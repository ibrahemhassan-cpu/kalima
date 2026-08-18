package expo.modules.wordwidget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/** One card as the widget knows it. */
data class WidgetWord(
  val word: String,
  val translation: String,
  val ipa: String,
  /** user_word id, so tapping the card opens that exact word */
  val id: String,
)

/**
 * The deck, shared between the app and the widget.
 *
 * SharedPreferences rather than a database: the widget process needs this on a
 * cold start with no app running, and it is a handful of strings.
 */
object WidgetStore {
  private const val PREFS = "kalima_widget"
  private const val KEY_DECK = "deck"
  private const val KEY_INDEX = "index"

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun saveDeck(context: Context, words: List<WidgetWord>) {
    val array = JSONArray()
    for (w in words) {
      array.put(
        JSONObject()
          .put("w", w.word)
          .put("t", w.translation)
          .put("p", w.ipa)
          .put("i", w.id),
      )
    }
    prefs(context).edit()
      .putString(KEY_DECK, array.toString())
      .putInt(KEY_INDEX, 0)
      .apply()
  }

  fun deck(context: Context): List<WidgetWord> {
    val raw = prefs(context).getString(KEY_DECK, null) ?: return emptyList()
    return try {
      val array = JSONArray(raw)
      (0 until array.length()).mapNotNull { i ->
        val o = array.optJSONObject(i) ?: return@mapNotNull null
        WidgetWord(
          word = o.optString("w"),
          translation = o.optString("t"),
          ipa = o.optString("p"),
          id = o.optString("i"),
        )
      }.filter { it.word.isNotEmpty() }
    } catch (_: Exception) {
      emptyList()
    }
  }

  fun current(context: Context): WidgetWord? {
    val deck = deck(context)
    if (deck.isEmpty()) return null
    return deck[index(context).mod(deck.size)]
  }

  fun index(context: Context): Int = prefs(context).getInt(KEY_INDEX, 0)

  fun advance(context: Context) {
    val deck = deck(context)
    if (deck.isEmpty()) return
    val next = (index(context) + 1).mod(deck.size)
    prefs(context).edit().putInt(KEY_INDEX, next).apply()
  }
}
