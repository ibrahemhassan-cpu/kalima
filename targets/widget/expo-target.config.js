/**
 * The iOS home-screen widget target.
 *
 * @bacons/apple-targets links this folder into the Xcode project on every
 * `expo prebuild`, so the Swift lives here in git rather than inside the
 * generated `ios/` directory that prebuild wipes.
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: "widget",
  name: "KalimaWidget",
  displayName: "Kalima",

  // 16.0 so it installs broadly; the interactive button is gated to 17 in Swift
  deploymentTarget: "16.0",

  frameworks: ["SwiftUI", "WidgetKit", "AppIntents"],

  colors: {
    $accent: "#5B5BF5",
  },

  // the widget and the app must share the same group to see the same words
  entitlements: {
    "com.apple.security.application-groups":
      config.ios?.entitlements?.["com.apple.security.application-groups"],
  },
});
