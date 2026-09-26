import { Redirect } from "expo-router";
/** Preserve the former Help & Support entry point. */
export default function CommunitySettingsLink() { return <Redirect href="/(tabs)/community" />; }
