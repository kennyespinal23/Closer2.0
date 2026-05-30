import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/constants/theme";

/**
 * Shared chrome for everything reachable from the profile drawer
 * (Notifications, Appearance, Help & Support, Privacy).
 *
 * The pattern is intentionally minimal:
 *   • Back chevron (top-left)         — pops to wherever we came from
 *   • Centered title                  — visually balanced by spacer
 *   • ScrollView body                 — receives Section / Row children
 *
 * Each settings page is just a thin file that imports this scaffold
 * and renders a handful of Sections inside.
 */
export function SettingsScaffold({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <BackChevronIcon />
        </Pressable>
        <Text
          className="text-ink text-[17px] flex-1 text-center"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        {/* Spacer to balance the back button on the right so the title
            stays optically centered. */}
        <View className="w-10 h-10" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Section — an eyebrow title + a rounded card containing rows,
//          optionally followed by a quiet footer caption
// ─────────────────────────────────────────────────────────────────

export function SettingsSection({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <View className="px-5 mt-7">
      {title && (
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-2.5 ml-1"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
      )}
      <View className="rounded-2xl border border-border bg-surface overflow-hidden">
        {children}
      </View>
      {footer && (
        <Text
          className="text-ink-subtle text-[12px] leading-[18px] mt-2.5 px-1"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {footer}
        </Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Row primitives — three shapes for the most common settings cells
// ─────────────────────────────────────────────────────────────────

type BaseRowProps = {
  icon?: ReactNode;
  label: string;
  sublabel?: string;
  showDivider?: boolean;
};

/**
 * Link row — tappable, displays a value on the right + chevron.
 * Use for navigation destinations and link-out actions.
 */
export function SettingsLinkRow({
  icon,
  label,
  sublabel,
  value,
  onPress,
  destructive,
  showDivider,
}: BaseRowProps & {
  value?: string;
  onPress?: () => void;
  /** Tinted red. Used for irreversible actions (Delete, Reset). */
  destructive?: boolean;
}) {
  const labelColor = destructive ? "#FF6B6B" : colors.ink;
  return (
    <View>
      <Pressable onPress={onPress}>
        <View className="flex-row items-center px-4 py-3.5">
          {icon && (
            <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
              {icon}
            </View>
          )}
          <View className="flex-1 pr-2">
            <Text
              className="text-[14.5px]"
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                color: labelColor,
              }}
            >
              {label}
            </Text>
            {sublabel && (
              <Text
                className="text-ink-subtle text-[12px] mt-0.5"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                {sublabel}
              </Text>
            )}
          </View>
          {value && (
            <Text
              className="text-ink-muted text-[13px] mr-1.5"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              {value}
            </Text>
          )}
          <ChevronIcon />
        </View>
      </Pressable>
      {showDivider && <View className="h-[1px] bg-border ml-[60px]" />}
    </View>
  );
}

/**
 * Toggle row — label/sublabel on the left, Switch on the right.
 * State is owned by the parent (controlled component).
 */
export function SettingsToggleRow({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
  showDivider,
}: BaseRowProps & {
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  return (
    <View>
      <View className="flex-row items-center px-4 py-3.5">
        {icon && (
          <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
            {icon}
          </View>
        )}
        <View className="flex-1 pr-3">
          <Text
            className="text-ink text-[14.5px]"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text
              className="text-ink-subtle text-[12px] mt-0.5 leading-[17px]"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              {sublabel}
            </Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: "rgba(255,255,255,0.10)", true: "#3D8B6A" }}
          thumbColor="#F4F4F5"
          ios_backgroundColor="rgba(255,255,255,0.08)"
        />
      </View>
      {showDivider && <View className="h-[1px] bg-border ml-[60px]" />}
    </View>
  );
}

/**
 * Static row — read-only display of a key/value pair. No chevron, no
 * press feedback. Used for Version, Email, etc.
 */
export function SettingsStaticRow({
  icon,
  label,
  value,
  showDivider,
}: BaseRowProps & { value?: string }) {
  return (
    <View>
      <View className="flex-row items-center px-4 py-3.5">
        {icon && (
          <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
            {icon}
          </View>
        )}
        <Text
          className="text-ink text-[14.5px] flex-1 pr-2"
          style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
        >
          {label}
        </Text>
        {value && (
          <Text
            className="text-ink-muted text-[13px]"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {value}
          </Text>
        )}
      </View>
      {showDivider && <View className="h-[1px] bg-border ml-[60px]" />}
    </View>
  );
}

/**
 * Selectable row — for "pick one from a list" patterns (e.g. theme
 * choices). Selected one gets a checkmark; others are inert.
 */
export function SettingsChoiceRow({
  icon,
  label,
  sublabel,
  selected,
  onPress,
  showDivider,
}: BaseRowProps & {
  selected: boolean;
  onPress?: () => void;
}) {
  return (
    <View>
      <Pressable onPress={onPress}>
        <View className="flex-row items-center px-4 py-3.5">
          {icon && (
            <View className="w-8 h-8 rounded-xl bg-accent-soft items-center justify-center mr-3">
              {icon}
            </View>
          )}
          <View className="flex-1 pr-2">
            <Text
              className="text-ink text-[14.5px]"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              {label}
            </Text>
            {sublabel && (
              <Text
                className="text-ink-subtle text-[12px] mt-0.5"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                {sublabel}
              </Text>
            )}
          </View>
          {selected && <CheckIcon />}
        </View>
      </Pressable>
      {showDivider && <View className="h-[1px] bg-border ml-[60px]" />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons (kept here so settings screens don't repeat themselves)
// ─────────────────────────────────────────────────────────────────

function BackChevronIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6"
        stroke={colors.ink}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={colors.inkSubtle}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12l5 5L20 7"
        stroke={colors.ink}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
