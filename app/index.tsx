import { useEffect } from "react";
import { Redirect } from "expo-router";
import { armLaunchSplash } from "@/lib/launchSplashSession";
import { useOnboarding } from "@/state/onboarding";

/**
 * Root launch gate. The old Get Started landing and onboarding screens are gone,
 * so everyone lands on Today. A first launch is stamped as onboarded so Profile
 * still gets a join date.
 */
export default function IndexScreen() {
  const { answers, setAnswer } = useOnboarding();

  useEffect(() => {
    if (answers.completed) armLaunchSplash();
    else setAnswer("completed", true);
  }, [answers.completed, setAnswer]);

  return <Redirect href="/today" />;
}
