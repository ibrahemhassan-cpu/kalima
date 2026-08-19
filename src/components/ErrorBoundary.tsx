import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";

import { Button, Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * The last line of defence.
 *
 * Without one of these, a single unhandled render error takes the whole app to
 * a white screen with no way back but force-quitting. A thrown exception is a
 * bug either way — but the user should meet a sentence and a button, not a
 * void.
 */
type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Replace with a crash reporter when one is wired up; until then this is
    // at least visible in `adb logcat` and the Expo dev console.
    console.error("[kalima] unhandled render error", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return <Fallback error={this.state.error} onReset={this.reset} />;
  }
}

function Fallback({ error, onReset }: { error: Error; onReset: () => void }) {
  const { colors, spacing, radius } = useTheme();
  const { t } = useTranslation();

  /**
   * Plain View, not Screen.
   *
   * Screen renders OfflineBar, which opens SQLite — so a render error caused by
   * the database would be re-thrown by the screen meant to recover from it, and
   * there is no boundary above this one to catch it. The fallback depends on
   * nothing but the theme.
   */
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: spacing.lg,
        }}
      >
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: radius.xl,
            backgroundColor: colors.dangerSoft,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="warning-outline" size={38} color={colors.danger} />
        </View>

        <View style={{ gap: spacing.xs, alignItems: "center" }}>
          <Text variant="heading" center>
            {t("errors.crashTitle")}
          </Text>
          <Text variant="body" tone="muted" center style={{ maxWidth: 300 }}>
            {t("errors.crashBody")}
          </Text>
        </View>

        <Button title={t("common.retry")} size="lg" icon="refresh" onPress={onReset} />

        {__DEV__ ? (
          <Text
            variant="micro"
            tone="faint"
            center
            ltr
            style={{ maxWidth: 320 }}
            numberOfLines={4}
          >
            {error.message}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
