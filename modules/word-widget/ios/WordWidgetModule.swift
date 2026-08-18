import ExpoModulesCore
import WidgetKit

/// The app's side of the iOS home-screen widget.
///
/// The widget runs in its own process and cannot read the app's storage, so
/// everything it shows is pushed here into a shared App Group. Keep the keys
/// in step with targets/widget/WordDeck.swift.
public class WordWidgetModule: Module {
  private static let suiteName = "group.app.kalima.vocab"

  public func definition() -> ModuleDefinition {
    Name("WordWidget")

    Function("isSupported") {
      // WidgetKit exists from iOS 14; the target itself asks for 16.
      if #available(iOS 16.0, *) { return true } else { return false }
    }

    /**
     * iOS can only answer this asynchronously, and the caller wants it
     * synchronously to decide what to render. Zero means "don't claim
     * anything" — the settings screen then shows how to add the widget rather
     * than asserting one is already placed.
     */
    Function("placedCount") { 0 }

    AsyncFunction("setDeck") { (cards: [[String: String]]) in
      let payload = cards.map { card in
        [
          "w": card["word"] ?? "",
          "t": card["translation"] ?? "",
          "p": card["ipa"] ?? "",
          "i": card["id"] ?? "",
        ]
      }

      guard
        let defaults = UserDefaults(suiteName: Self.suiteName),
        let data = try? JSONSerialization.data(withJSONObject: payload),
        let json = String(data: data, encoding: .utf8)
      else { return }

      defaults.set(json, forKey: "deck")
      // a fresh deck starts from its first card
      defaults.set(0, forKey: "base")

      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }

    AsyncFunction("refresh") {
      if #available(iOS 14.0, *) {
        WidgetCenter.shared.reloadAllTimelines()
      }
    }
  }
}
