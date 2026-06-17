import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View className="flex-1 items-center justify-center bg-bg px-6">
        <Text
          className="text-ink text-[22px]"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          We couldn&apos;t find that page.
        </Text>
        <Link href="/" className="mt-4">
          <Text
            className="text-primary text-[15px]"
            style={{ fontFamily: "System", fontWeight: "600" }}
          >
            Go back home
          </Text>
        </Link>
      </View>
    </>
  );
}
