import type { PropsWithChildren, ReactElement } from "react";
import { ProgressProvider } from "@/state/progress-provider";

export function ProgressShell({ children }: PropsWithChildren): ReactElement {
  return <ProgressProvider>{children}</ProgressProvider>;
}
