import type { PropsWithChildren, ReactElement } from "react";
import { SQLiteProvider } from "expo-sqlite";
import { ProgressProvider } from "@/state/progress-provider";
import { migrateProgressDb } from "@/storage/progress-store";

export function ProgressShell({ children }: PropsWithChildren): ReactElement {
  return (
    <SQLiteProvider databaseName="careerforge.db" onInit={migrateProgressDb} useSuspense>
      <ProgressProvider>{children}</ProgressProvider>
    </SQLiteProvider>
  );
}
