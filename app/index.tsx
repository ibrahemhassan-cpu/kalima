import { Redirect } from "expo-router";

/**
 * نقطة الدخول. الحارس في _layout.tsx بيتولّى التوجيه الحقيقي،
 * وده مجرد مسار افتراضي.
 */
export default function Index() {
  return <Redirect href="/(tabs)" />;
}
