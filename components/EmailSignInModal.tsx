import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppleSheet, SheetContent } from "@/components/AppleSheet";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { SheetModalHeader } from "@/components/SheetModalHeader";
import { SF_PRO, typography } from "@/lib/typography";
import { useColors } from "@/state/theme";

type EmailSignInModalProps = {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onSubmitEmail: (email: string) => Promise<void>;
  onSubmitCode: (email: string, code: string) => Promise<void>;
};

const FIELD_HEIGHT = 56;

/** iOS sheet secondary copy — 15/22, not full 17/28 body leading. */
const sheetSubhead = {
  fontFamily: SF_PRO,
  fontWeight: "400" as const,
  fontSize: 15,
  lineHeight: 22,
};

function SheetTextField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  editable,
  keyboardType = "default",
  textContentType,
  autoComplete,
  textAlign = "left",
  letterSpacing = 0,
  maxLength,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  accessibilityLabel: string;
  editable: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  textContentType?: "emailAddress" | "oneTimeCode";
  autoComplete?: "email";
  textAlign?: "left" | "center";
  letterSpacing?: number;
  maxLength?: number;
}) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={{
        minHeight: FIELD_HEIGHT,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: focused ? colors.primary : colors.border,
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        justifyContent: "center",
      }}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.inkSubtle}
        editable={editable}
        keyboardType={keyboardType}
        textContentType={textContentType}
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        selectionColor={colors.primary}
        accessibilityLabel={accessibilityLabel}
        maxLength={maxLength}
        style={{
          width: "100%",
          minHeight: FIELD_HEIGHT - 2,
          fontFamily: SF_PRO,
          fontWeight: "400",
          fontSize: 17,
          lineHeight: 22,
          color: colors.ink,
          textAlign,
          letterSpacing,
          paddingVertical: 0,
        }}
      />
    </View>
  );
}

export function EmailSignInModal({
  visible,
  busy,
  onClose,
  onSubmitEmail,
  onSubmitCode,
}: EmailSignInModalProps) {
  const colors = useColors();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!visible) {
      setStep("email");
      setEmail("");
      setCode("");
    }
  }, [visible]);

  const handleClose = () => {
    if (busy) return;
    onClose();
  };

  const handlePrimary = async () => {
    if (step === "email") {
      await onSubmitEmail(email);
      setStep("code");
      return;
    }
    await onSubmitCode(email, code);
    onClose();
  };

  const title = step === "email" ? "Sign in with email" : "Enter your code";
  const primaryLabel = step === "email" ? "Send code" : "Verify and sign in";
  const canSubmit =
    step === "email"
      ? email.trim().includes("@")
      : code.trim().length >= 6;

  return (
    <AppleSheet
      visible={visible}
      onClose={handleClose}
      detents={["auto"]}
      backgroundColor={colors.bg}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ width: "100%" }}
      >
        <View style={{ paddingTop: 4, paddingBottom: 12 }}>
          <SheetModalHeader
            title={title}
            onCancel={handleClose}
            showSave={false}
          />
        </View>

        <SheetContent style={{ paddingTop: 0 }}>
          <Text style={[sheetSubhead, { color: colors.inkMuted }]}>
            {step === "email"
              ? "We'll email you a one-time 6-digit code. No password needed."
              : `We sent a code to ${email.trim()}.`}
          </Text>

          <View style={{ height: 28 }} />

          {step === "email" ? (
            <SheetTextField
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              accessibilityLabel="Email address"
              editable={!busy}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
            />
          ) : (
            <SheetTextField
              value={code}
              onChangeText={setCode}
              placeholder="6-digit code"
              accessibilityLabel="6-digit code"
              editable={!busy}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              textAlign="center"
              letterSpacing={2}
              maxLength={6}
            />
          )}

          <View style={{ height: 20 }} />

          <PrimaryPillButton
            label={primaryLabel}
            onPress={() => {
              handlePrimary().catch(() => {});
            }}
            disabled={!canSubmit}
            loading={busy}
          />

          {step === "code" ? (
            <Text
              onPress={busy ? undefined : () => setStep("email")}
              suppressHighlighting
              style={[
                typography.body,
                {
                  color: colors.inkMuted,
                  fontSize: 15,
                  lineHeight: 22,
                  textAlign: "center",
                  marginTop: 20,
                },
              ]}
            >
              Use a different email
            </Text>
          ) : null}
        </SheetContent>
      </KeyboardAvoidingView>
    </AppleSheet>
  );
}
