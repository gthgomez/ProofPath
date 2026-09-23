import type { SQLiteDatabase } from "expo-sqlite";
import { describe, expect, it } from "vitest";
import { importLegacyDatabase, LEGACY_DATABASE_NAME } from "@/storage/legacy-db-import";

interface FakeColumn {
  name: string;
  type: string;
}

interface FakeTable {
  columns: FakeColumn[];
  rows: unknown[][];
}

function table(columns: FakeColumn[], rows: unknown[][] = []): FakeTable {
  return { columns, rows };
}

const USER_PROFILE_COLUMNS: FakeColumn[] = [
  { name: "id", type: "TEXT" },
  { name: "role_target_id", type: "TEXT" },
  { name: "created_at", type: "TEXT" }
];

const COMPLETED_LESSONS_COLUMNS: FakeColumn[] = [
  { name: "lesson_id", type: "TEXT" },
  { name: "sort_order", type: "INTEGER" }
];

class FakeLegacyImportDatabase {
  public mainTables = new Map<string, FakeTable>();
  public legacyTables = new Map<string, FakeTable>();
  public legacyFileExists = true;
  public attachedFilenames: string[] = [];
  public detached = false;
  public copiedTables: string[] = [];

  async execAsync(sql: string): Promise<void> {
    const attachMatch = /^ATTACH DATABASE '(.+)' AS legacy$/.exec(sql);
    if (attachMatch) {
      if (!this.legacyFileExists) {
        throw new Error(`unable to open database file: ${attachMatch[1]}`);
      }
      this.attachedFilenames.push(attachMatch[1]);
      return;
    }

    if (/^DETACH DATABASE legacy$/.test(sql)) {
      if (this.attachedFilenames.length === 0) {
        throw new Error("cannot DETACH a database that was never attached");
      }
      this.detached = true;
      return;
    }

    throw new Error(`Unexpected execAsync: ${sql}`);
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    const tableListMatch = /^SELECT name FROM "(main|legacy)"\.sqlite_master/.exec(sql);
    if (tableListMatch) {
      const tables = tableListMatch[1] === "main" ? this.mainTables : this.legacyTables;
      return [...tables.keys()].map((name) => ({ name })) as T[];
    }

    const columnMatch = /^PRAGMA "(main|legacy)"\.table_info\("(.+)"\)$/.exec(sql);
    if (columnMatch) {
      const tables = columnMatch[1] === "main" ? this.mainTables : this.legacyTables;
      const fakeTable = tables.get(columnMatch[2]);
      return fakeTable ? fakeTable.columns.map((column) => ({ name: column.name, type: column.type })) as T[] : [];
    }

    throw new Error(`Unexpected getAllAsync: ${sql}`);
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    const countMatch = /^SELECT COUNT\(\*\) AS total FROM main\."(.+)"$/.exec(sql);
    if (countMatch) {
      const fakeTable = this.mainTables.get(countMatch[1]);
      return { total: fakeTable?.rows.length ?? 0 } as T;
    }

    throw new Error(`Unexpected getFirstAsync: ${sql}`);
  }

  async runAsync(sql: string): Promise<void> {
    const insertMatch = /^INSERT INTO main\."(.+)" SELECT \* FROM "legacy"\."(.+)"$/.exec(sql);
    if (insertMatch) {
      const [, mainTableName, legacyTableName] = insertMatch;
      const legacyTable = this.legacyTables.get(legacyTableName);
      if (!legacyTable) {
        throw new Error(`No legacy table ${legacyTableName}`);
      }
      const mainTable = this.mainTables.get(mainTableName);
      if (!mainTable) {
        throw new Error(`No main table ${mainTableName}`);
      }
      mainTable.rows.push(...legacyTable.rows.map((row) => [...row]));
      this.copiedTables.push(mainTableName);
      return;
    }

    throw new Error(`Unexpected runAsync: ${sql}`);
  }
}

function createFreshDatabases(): { db: FakeLegacyImportDatabase } {
  const db = new FakeLegacyImportDatabase();
  db.mainTables.set("user_profile", table(USER_PROFILE_COLUMNS));
  db.mainTables.set("completed_lessons", table(COMPLETED_LESSONS_COLUMNS));
  db.legacyTables.set("user_profile", table(USER_PROFILE_COLUMNS, [
    ["default", "role-python-fullstack", "2026-05-01T00:00:00.000Z"]
  ]));
  db.legacyTables.set("completed_lessons", table(COMPLETED_LESSONS_COLUMNS, [
    ["lesson-python-values", 0],
    ["lesson-python-functions", 1]
  ]));
  return { db };
}

async function importWith(db: FakeLegacyImportDatabase): Promise<void> {
  await importLegacyDatabase(db as unknown as SQLiteDatabase);
}

describe("legacy database import", () => {
  it("attaches the pre-rename database by its same-directory relative name", async () => {
    const { db } = createFreshDatabases();

    await importWith(db);

    expect(db.attachedFilenames).toEqual([LEGACY_DATABASE_NAME]);
    expect(db.detached).toBe(true);
  });

  it("no-ops when the legacy database file is missing", async () => {
    const { db } = createFreshDatabases();
    db.legacyFileExists = false;

    await expect(importWith(db)).resolves.toBeUndefined();

    expect(db.attachedFilenames).toEqual([]);
    expect(db.copiedTables).toEqual([]);
    expect(db.mainTables.get("user_profile")?.rows).toEqual([]);
    expect(db.mainTables.get("completed_lessons")?.rows).toEqual([]);
  });

  it("skips legacy tables that do not exist in main", async () => {
    const { db } = createFreshDatabases();
    db.legacyTables.set("legacy_only_table", table([{ name: "value", type: "TEXT" }], [["kept-in-legacy"]]));

    await importWith(db);

    expect(db.copiedTables).not.toContain("legacy_only_table");
    expect(db.mainTables.has("legacy_only_table")).toBe(false);
  });

  it("skips tables whose column sets do not match", async () => {
    const { db } = createFreshDatabases();
    db.mainTables.set("completed_lessons", table([
      { name: "lesson_id", type: "TEXT" },
      { name: "sort_order", type: "INTEGER" },
      { name: "completed_at", type: "TEXT" }
    ]));

    await importWith(db);

    expect(db.copiedTables).toEqual(["user_profile"]);
    expect(db.mainTables.get("completed_lessons")?.rows).toEqual([]);
  });

  it("skips tables that already have rows in main", async () => {
    const { db } = createFreshDatabases();
    db.mainTables.set("user_profile", table(USER_PROFILE_COLUMNS, [
      ["default", "role-junior-swe", "2026-05-02T00:00:00.000Z"]
    ]));

    await importWith(db);

    expect(db.copiedTables).toEqual(["completed_lessons"]);
    expect(db.mainTables.get("user_profile")?.rows).toEqual([
      ["default", "role-junior-swe", "2026-05-02T00:00:00.000Z"]
    ]);
  });

  it("copies rows from matching empty tables and detaches the legacy schema", async () => {
    const { db } = createFreshDatabases();

    await importWith(db);

    expect(db.copiedTables).toEqual(["user_profile", "completed_lessons"]);
    expect(db.mainTables.get("user_profile")?.rows).toEqual([
      ["default", "role-python-fullstack", "2026-05-01T00:00:00.000Z"]
    ]);
    expect(db.mainTables.get("completed_lessons")?.rows).toEqual([
      ["lesson-python-values", 0],
      ["lesson-python-functions", 1]
    ]);
    expect(db.detached).toBe(true);
  });
});
