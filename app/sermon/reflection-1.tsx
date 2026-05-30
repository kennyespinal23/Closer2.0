import { useRouter } from "expo-router";
import { ReflectionLayout } from "@/components/ReflectionLayout";

const PARAGRAPHS = [
  "Notifications. News cycles. Group chats. The hum of expectation that never powers down. It's not just that we're busy — it's that there are very few moments in a modern day quiet enough for us to hear ourselves think, let alone hear God.",
  "The psalmist didn't write \u201cBe still\u201d as a suggestion. He wrote it as an instruction — because even three thousand years ago, the human soul needed permission to stop.",
  "Maybe the noise around you isn't the real problem. Maybe the real problem is that you've started to believe it's normal.",
];

export default function Reflection1Step() {
  const router = useRouter();

  return (
    <ReflectionLayout
      step="reflection-1"
      eyebrow="Reflection · 1 of 2"
      numeral="01"
      title="The world has gotten loud."
      paragraphs={PARAGRAPHS}
      onContinue={() => router.push("/sermon/reflection-2")}
    />
  );
}
