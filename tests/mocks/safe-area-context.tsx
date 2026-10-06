import { createContext, useContext } from "react";
import type { ReactNode } from "react";

/**
 * Test double for react-native-safe-area-context. The real package requires
 * the native react-native package internally, which cannot load in jsdom.
 * Components under test only consume `SafeAreaProvider` and
 * `useSafeAreaInsets`, so a fixed zero-inset context is enough.
 */

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const ZERO_INSETS: SafeAreaInsets = { top: 0, right: 0, bottom: 0, left: 0 };

const SafeAreaInsetsContext = createContext<SafeAreaInsets>(ZERO_INSETS);

export function SafeAreaProvider({ children }: { children: ReactNode }): ReactNode {
  return (
    <SafeAreaInsetsContext.Provider value={ZERO_INSETS}>
      {children}
    </SafeAreaInsetsContext.Provider>
  );
}

export function useSafeAreaInsets(): SafeAreaInsets {
  return useContext(SafeAreaInsetsContext);
}
