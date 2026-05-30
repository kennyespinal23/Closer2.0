import { useRouter } from "expo-router";
import { ReflectionLayout } from "@/components/ReflectionLayout";

const PARAGRAPHS = [
  "Drawing near to God rarely happens by accident. It almost never happens at the end of a busy day when we've used all our attention on everything else. It happens when we make room — small, deliberate room — for Him at the beginning.",
  "Two minutes of stillness in the morning is worth more than two hours of distracted thinking later.",
  "God is not loud. He doesn't compete. He waits in the quiet for the soul that comes looking.",
];

export default function Reflection2Step() {
  const router = useRouter();

  return (
    <ReflectionLayout
      step="reflection-2"
      eyebrow="Reflection · 2 of 2"
      numeral="02"
      title="Stillness is a discipline, not an accident."
      paragraphs={PARAGRAPHS}
      onContinue={() => router.push("/sermon/application")}
    />
  );
}
