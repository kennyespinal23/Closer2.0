import { AppBlocksScreen } from "@/components/AppBlocksScreen";

/** Stack entry — native UINavigationBar supplies Back. */
export default function AppBlocksSettingsScreen() {
  return <AppBlocksScreen showBack={false} />;
}
