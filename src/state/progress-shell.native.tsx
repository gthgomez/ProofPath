import type { PropsWithChildren, ReactElement } from "react";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { ProgressProvider } from "@/state/progress-provider";
import { finalizeProgressMigration, prepareProgressDbSchema } from "@/storage/progress-store";
import { importLegacyDatabase } from "@/storage/legacy-db-import";

async function initializeProgressDb(db: SQLiteDatabase): Promise<void> {
  // 1. Create/upgrade the schema and seed content without writing the default
  //    progress row yet.
  await prepareProgressDbSchema(db);
  // 2. Copy learner data from the pre-rename careerforge.db while the user
  //    tables are still empty (the import skips any table that already has
  //    rows; content tables are already seeded by step 1, so they are
  //    skipped as non-empty).
  await importLegacyDatabase(db);
  // 3. Version-gated initial save: runs only when no normalized progress
  //    exists, so a successful legacy import prevents defaults from
  //    overwriting the imported rows.
  await finalizeProgressMigration(db);
}

export function ProgressShell({ children }: PropsWithChildren): ReactElement {
  return (
    <SQLiteProvider databaseName="proofpath.db" onInit={initializeProgressDb} useSuspense>
      <ProgressProvider>{children}</ProgressProvider>
    </SQLiteProvider>
  );
}
