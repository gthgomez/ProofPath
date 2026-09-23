import type { SQLiteDatabase } from "expo-sqlite";

/**
 * One-time import of the pre-rename `careerforge.db` into the new `proofpath.db`.
 *
 * expo-sqlite has no rename/copy API for database files (verified against
 * node_modules/expo-sqlite/build), so the import attaches the legacy file under
 * a schema name and copies rows across. Both databases live in the same
 * expo-sqlite directory, and SQLite resolves a same-directory relative ATTACH
 * name against the database folder, so `careerforge.db` attaches directly.
 * The legacy file is never modified or deleted: if anything about it is
 * unreadable the import is a no-op and the app starts fresh.
 */

export const LEGACY_DATABASE_NAME = "careerforge.db";
const LEGACY_SCHEMA_NAME = "legacy";

type LegacyImportDatabase = Pick<SQLiteDatabase, "execAsync" | "getAllAsync" | "getFirstAsync" | "runAsync">;

interface TableNameRow {
  name: string;
}

interface TableColumnRow {
  name: string;
  type: string;
}

interface CountRow {
  total: number;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function listUserTables(db: LegacyImportDatabase, schemaName: string): Promise<string[]> {
  const rows = await db.getAllAsync<TableNameRow>(
    `SELECT name FROM ${quoteIdentifier(schemaName)}.sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
  );
  return rows.map((row) => row.name);
}

async function listColumns(db: LegacyImportDatabase, schemaName: string, tableName: string): Promise<string> {
  const rows = await db.getAllAsync<TableColumnRow>(
    `PRAGMA ${quoteIdentifier(schemaName)}.table_info(${quoteIdentifier(tableName)})`
  );
  return rows.map((row) => `${row.name.toLowerCase()}:${row.type.toLowerCase()}`).join("|");
}

/**
 * Attach the legacy database and copy every user table whose schema matches.
 *
 * For each table that exists in both `main` and the attached legacy schema with
 * an identical column set (names and declared types, in order), the legacy rows
 * are appended with `INSERT INTO main.<t> SELECT * FROM legacy.<t>` unless the
 * table in `main` already holds rows. The legacy schema is always detached, even
 * when individual copies fail.
 */
export async function importLegacyDatabase(
  db: LegacyImportDatabase,
  legacyFilename: string = LEGACY_DATABASE_NAME
): Promise<void> {
  const filenameLiteral = legacyFilename.replace(/'/g, "''");

  try {
    await db.execAsync(`ATTACH DATABASE '${filenameLiteral}' AS ${LEGACY_SCHEMA_NAME}`);
  } catch {
    // Legacy file missing, unreadable, or not a database — nothing to import.
    return;
  }

  try {
    const [mainTables, legacyTables] = await Promise.all([
      listUserTables(db, "main"),
      listUserTables(db, LEGACY_SCHEMA_NAME)
    ]);
    const legacyTableNames = new Set(legacyTables);

    for (const tableName of mainTables) {
      if (!legacyTableNames.has(tableName)) {
        continue;
      }

      const [mainColumns, legacyColumns] = await Promise.all([
        listColumns(db, "main", tableName),
        listColumns(db, LEGACY_SCHEMA_NAME, tableName)
      ]);
      if (mainColumns.length === 0 || mainColumns !== legacyColumns) {
        continue;
      }

      const countRow = await db.getFirstAsync<CountRow>(
        `SELECT COUNT(*) AS total FROM main.${quoteIdentifier(tableName)}`
      );
      if (countRow && countRow.total > 0) {
        continue;
      }

      await db.runAsync(
        `INSERT INTO main.${quoteIdentifier(tableName)} SELECT * FROM ${quoteIdentifier(LEGACY_SCHEMA_NAME)}.${quoteIdentifier(tableName)}`
      );
    }
  } finally {
    try {
      await db.execAsync(`DETACH DATABASE ${LEGACY_SCHEMA_NAME}`);
    } catch {
      // Already detached; nothing to clean up.
    }
  }
}
