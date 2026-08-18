import React from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui";
import { useTheme } from "@/theme/ThemeProvider";
import { CONTACT_EMAIL, legalFor, type LegalBlock } from "@/i18n/legal";

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading">{title}</Text>
      <View style={{ gap: spacing.sm }}>{children}</View>
    </View>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return (
    <Text variant="body" tone="muted">
      {children}
    </Text>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <Text variant="body" tone="muted">
        ·
      </Text>
      <Text variant="body" tone="muted" style={{ flex: 1 }}>
        {children}
      </Text>
    </View>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case "p":
      return <P>{block.text}</P>;

    case "strong":
      return <Text variant="bodyStrong">{block.text}</Text>;

    case "bullet":
      return (
        <Bullet>
          {block.label ? (
            <Text variant="bodyStrong">{block.label} </Text>
          ) : null}
          {block.text}
        </Bullet>
      );

    case "email":
      return (
        <Text variant="body" tone="brand" ltr>
          {CONTACT_EMAIL}
        </Text>
      );
  }
}

/**
 * Renders a whole legal document in whichever language the user is reading the
 * app in. The text itself lives in `@/i18n/legal`.
 */
export function LegalDocument({ doc }: { doc: "privacy" | "terms" }) {
  const { t, i18n } = useTranslation();
  const { spacing } = useTheme();
  const { content, lastUpdated } = legalFor(i18n.language, doc);

  return (
    <>
      <View style={{ gap: spacing.xs }}>
        <Text variant="caption" tone="faint">
          {t("legal.lastUpdated", { date: lastUpdated })}
        </Text>
        {content.note ? (
          <Text variant="caption" tone="faint">
            {content.note}
          </Text>
        ) : null}
      </View>

      {content.sections.map((section) => (
        <Section key={section.title} title={section.title}>
          {section.blocks.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </Section>
      ))}
    </>
  );
}
