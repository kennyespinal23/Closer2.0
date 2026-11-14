import { useEffect } from "react";
import { useRouter } from "expo-router";
import devRoute from "@/dev-route.json";

/* Development only: change dev-route.json ({ "route": "/lesson/lazarus", "n": 1 }) and the running app navigates
   there when Metro reloads it. Lets screens be checked in the Simulator without tapping. Does nothing in release. */
export function useDevRoute() {
  const router = useRouter();
  useEffect(() => {
    if (!__DEV__ || !devRoute.route) return;
    const t = setTimeout(() => router.push(devRoute.route as never), 600);
    return () => clearTimeout(t);
  }, [router]);
}
