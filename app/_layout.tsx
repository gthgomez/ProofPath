import type { ReactElement } from "react";
import { Suspense } from "react";
import { Text, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ProgressShell } from "@/state/progress-shell";
import { colors } from "@/ui/theme";

export default function RootLayout(): ReactElement {
  return (
    <>
      <Suspense fallback={<LoadingState />}>
        <ProgressShell>
          <SafeAreaProvider>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: colors.background },
                headerShown: false
              }}
            />
          </SafeAreaProvider>
        </ProgressShell>
      </Suspense>
      <StatusBar style="dark" />
    </>
  );
}

function LoadingState(): ReactElement {
  return (
    <View style={{ alignItems: "center", backgroundColor: colors.background, flex: 1, justifyContent: "center" }}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>Loading CareerForge</Text>
    </View>
  );
}
