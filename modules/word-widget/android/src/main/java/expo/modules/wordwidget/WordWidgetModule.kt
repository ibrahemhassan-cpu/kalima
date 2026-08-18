package expo.modules.wordwidget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class WidgetCard : Record {
  @Field val word: String = ""
  @Field val translation: String = ""
  @Field val ipa: String = ""
  @Field val id: String = ""
}

/**
 * The app's side of the home-screen widget.
 *
 * Android only. iOS widgets are a separate WidgetKit extension and are not
 * part of this module — the JS wrapper reports `isSupported() = false` there
 * so the feature hides itself rather than half-working.
 */
class WordWidgetModule : Module() {

  private val context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("WordWidget")

    Function("isSupported") { true }

    /** How many widgets the user has actually placed. */
    Function("placedCount") {
      AppWidgetManager.getInstance(context).getAppWidgetIds(
        ComponentName(context, WordWidgetProvider::class.java),
      ).size
    }

    AsyncFunction("setDeck") { cards: List<WidgetCard> ->
      WidgetStore.saveDeck(
        context,
        cards.map {
          WidgetWord(
            word = it.word,
            translation = it.translation,
            ipa = it.ipa,
            id = it.id,
          )
        },
      )
      WordWidgetProvider.renderAll(context)
    }

    AsyncFunction("refresh") {
      WordWidgetProvider.renderAll(context)
    }
  }
}
