import { Redirect } from "expo-router";

/**
 * Old sermon antechamber — retired with the Hook→Prayer ritual.
 * Daily content now opens from the Home card.
 */
export default function ScriptureRedirect() {
  return <Redirect href="/today" />;
}
