import { isOnboardingComplete } from "@/domain/role-routing";
import { useProgress } from "@/state/progress-provider";

interface OnboardingGateState {
  isCheckingOnboarding: boolean;
  needsOnboarding: boolean;
}

export function useOnboardingGate(): OnboardingGateState {
  const { isLoading, profile } = useProgress();

  return {
    isCheckingOnboarding: isLoading,
    needsOnboarding: !isLoading && !isOnboardingComplete(profile)
  };
}

export function useNeedsOnboarding(): boolean {
  return useOnboardingGate().needsOnboarding;
}
