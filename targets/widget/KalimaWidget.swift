import AppIntents
import SwiftUI
import WidgetKit

// ── the interactive button (iOS 17+) ────────────────────────
/// Shifts the deck one word forward, in place, without opening the app.
/// iOS 16 has no interactive widgets at all, so the button is simply absent
/// there and the card still rotates on its own every half hour.
@available(iOS 17.0, *)
struct NextWordIntent: AppIntent {
  static var title: LocalizedStringResource = "Next word"
  static var description = IntentDescription("Show another word from your library")

  func perform() async throws -> some IntentResult {
    WordDeck.base += 1
    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }
}

// ── timeline ────────────────────────────────────────────────
struct WordEntry: TimelineEntry {
  let date: Date
  let card: WordCard?
}

struct WordProvider: TimelineProvider {
  func placeholder(in context: Context) -> WordEntry {
    WordEntry(
      date: Date(),
      card: WordCard(w: "serenity", t: "الهدوء والطمأنينة", p: "/səˈren.ə.ti/", i: "")
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (WordEntry) -> Void) {
    let cards = WordDeck.cards()
    completion(WordEntry(date: Date(), card: WordDeck.card(at: Date(), cards: cards)))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<WordEntry>) -> Void) {
    let cards = WordDeck.cards()
    let now = Date()

    // Six hours of half-hourly entries. WidgetKit renders them all up front and
    // swaps them on schedule, so the card keeps changing even with no app runs.
    let entries = (0..<12).map { step -> WordEntry in
      let date = now.addingTimeInterval(Double(step) * WordDeck.slot)
      return WordEntry(date: date, card: WordDeck.card(at: date, cards: cards))
    }

    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

// ── the card ────────────────────────────────────────────────
/// Mirrors src/components/word/WordGlassCard.tsx: the widget paints its own
/// gradient and lays glass over it. A widget can never see the wallpaper, so a
/// design that leaned on real backdrop blur could not exist here.
struct KalimaWidgetView: View {
  var entry: WordEntry

  private let brand = Color(red: 0.357, green: 0.357, blue: 0.961)      // #5B5BF5
  private let brandAlt = Color(red: 0.545, green: 0.361, blue: 0.965)   // #8B5CF6

  var body: some View {
    VStack(spacing: 6) {
      if let card = entry.card {
        Text("كلمة")
          .font(.system(size: 10))
          .foregroundStyle(.white.opacity(0.55))

        Text(card.word)
          .font(.system(size: 26, weight: .bold))
          .foregroundStyle(.white)
          .lineLimit(1)
          .minimumScaleFactor(0.6)
          .environment(\.layoutDirection, .leftToRight)

        if !card.ipa.isEmpty {
          Text(card.ipa)
            .font(.system(size: 12))
            .foregroundStyle(.white.opacity(0.75))
            .lineLimit(1)
            .environment(\.layoutDirection, .leftToRight)
        }

        Divider()
          .overlay(.white.opacity(0.38))
          .padding(.vertical, 4)

        Text("معناها")
          .font(.system(size: 10))
          .foregroundStyle(.white.opacity(0.55))

        Text(card.translation)
          .font(.system(size: 16, weight: .semibold))
          .foregroundStyle(.white)
          .multilineTextAlignment(.center)
          .lineLimit(2)
          .minimumScaleFactor(0.7)

        controls(for: card)
      } else {
        Text("أضِف كلمات من التطبيق")
          .font(.system(size: 14))
          .foregroundStyle(.white.opacity(0.85))
          .multilineTextAlignment(.center)
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .widgetURL(deepLink(for: entry.card, speak: false))
    .widgetBackground {
      ZStack {
        LinearGradient(
          colors: [brand, brandAlt],
          startPoint: .topLeading,
          endPoint: .bottomTrailing
        )
        // the glass pane and its rim, same values as the RN card
        Color.white.opacity(0.14)
      }
    }
  }

  @ViewBuilder
  private func controls(for card: WordCard) -> some View {
    HStack(spacing: 10) {
      // Audio cannot play from a widget on iOS — no widget may start an audio
      // session. Tapping this opens the app, which speaks on arrival.
      Link(destination: deepLink(for: card, speak: true) ?? fallbackURL) {
        Image(systemName: "speaker.wave.2.fill")
          .font(.system(size: 13))
          .foregroundStyle(.white)
          .frame(width: 32, height: 32)
          .background(Circle().fill(.white.opacity(0.14)))
          .overlay(Circle().stroke(.white.opacity(0.38), lineWidth: 1))
      }

      if #available(iOS 17.0, *) {
        Button(intent: NextWordIntent()) {
          Image(systemName: "arrow.triangle.2.circlepath")
            .font(.system(size: 13))
            .foregroundStyle(.white)
            .frame(width: 32, height: 32)
            .background(Circle().fill(.white.opacity(0.14)))
            .overlay(Circle().stroke(.white.opacity(0.38), lineWidth: 1))
        }
        .buttonStyle(.plain)
      }
    }
    .padding(.top, 4)
  }

  private var fallbackURL: URL { URL(string: "kalima:///")! }

  private func deepLink(for card: WordCard?, speak: Bool) -> URL? {
    guard let card, !card.id.isEmpty else { return URL(string: "kalima:///") }
    return URL(string: "kalima:///word/\(card.id)\(speak ? "?speak=1" : "")")
  }
}

/// `containerBackground` is iOS 17+; on 16 the background goes on directly.
private extension View {
  @ViewBuilder
  func widgetBackground<Background: View>(
    @ViewBuilder _ background: () -> Background
  ) -> some View {
    if #available(iOS 17.0, *) {
      containerBackground(for: .widget) { background() }
    } else {
      self.background(background())
    }
  }
}

// ── entry point ─────────────────────────────────────────────
struct KalimaWidget: Widget {
  let kind = "KalimaWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: WordProvider()) { entry in
      KalimaWidgetView(entry: entry)
    }
    .configurationDisplayName("Kalima")
    .description("كلمة من مكتبتك، بترجمتها ونطقها")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

@main
struct KalimaWidgetBundle: WidgetBundle {
  var body: some Widget {
    KalimaWidget()
  }
}
