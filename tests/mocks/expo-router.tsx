import type { ReactNode } from "react";
import { vi } from "vitest";

/**
 * Test double for expo-router. Journey tests set the current route params via
 * `__setParams` before rendering a screen, and can assert navigation calls
 * through `__router`.
 */

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  canGoBack: () => false
};

let params: Record<string, string> = {};

export function __setParams(next: Record<string, string>): void {
  params = next;
}

export function __resetRouter(): void {
  router.push.mockClear();
  router.replace.mockClear();
  router.back.mockClear();
}

export function __router(): typeof router {
  return router;
}

export function useLocalSearchParams(): Record<string, string> {
  return params;
}

export function useRouter(): typeof router {
  return router;
}

export function usePathname(): string {
  return "/lesson/lesson-python-zero-files-folders";
}

export function Link({ children }: { children: ReactNode }): ReactNode {
  return <>{children}</>;
}

export function Redirect(): null {
  return null;
}
