import Foundation

/// One card, exactly as the app writes it into the shared group.
struct WordCard: Codable, Hashable {
  let w: String   // the English word
  let t: String   // the Arabic translation
  let p: String   // IPA
  let i: String   // user_word id, for the deep link

  var word: String { w }
  var translation: String { t }
  var ipa: String { p }
  var id: String { i }
}

/// The deck, shared between the app and the widget through an App Group.
///
/// The widget process cannot reach the app's storage, and it has to render on a
/// cold start with the app never launched — so the app pushes a plain JSON
/// string into the group and the widget only ever reads.
enum WordDeck {
  static let suiteName = "group.app.kalima.vocab"

  private static var defaults: UserDefaults? {
    UserDefaults(suiteName: suiteName)
  }

  static func cards() -> [WordCard] {
    guard
      let raw = defaults?.string(forKey: "deck"),
      let data = raw.data(using: .utf8),
      let cards = try? JSONDecoder().decode([WordCard].self, from: data)
    else { return [] }

    return cards.filter { !$0.w.isEmpty }
  }

  /// Where the user has nudged the deck to with the next button.
  static var base: Int {
    get { defaults?.integer(forKey: "base") ?? 0 }
    set { defaults?.set(newValue, forKey: "base") }
  }

  /// How long one word stays up before the timeline moves on.
  static let slot: TimeInterval = 30 * 60

  /// The card to show at a given moment.
  ///
  /// Derived from the clock rather than stored, so the timeline is
  /// deterministic and rotates forever without the provider writing anything.
  /// The next button only shifts `base`.
  static func card(at date: Date, cards: [WordCard]) -> WordCard? {
    guard !cards.isEmpty else { return nil }
    let slots = Int(date.timeIntervalSince1970 / slot)
    let index = (base + slots) % cards.count
    return cards[index < 0 ? index + cards.count : index]
  }
}
