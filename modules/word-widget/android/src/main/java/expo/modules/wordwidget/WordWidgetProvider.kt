package expo.modules.wordwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.widget.RemoteViews
import java.util.Locale

/**
 * The home-screen card.
 *
 *   tap the card   opens that word in the app
 *   next           advances the deck in place, no app launch
 *   speak          speaks it in place, using the system voice
 *
 * The system also calls onUpdate on its own schedule (every 30 minutes, see
 * kalima_widget_info.xml), and each of those advances the word — so the card
 * rotates by itself even if nobody touches it.
 */
class WordWidgetProvider : AppWidgetProvider() {

  companion object {
    const val ACTION_NEXT = "expo.modules.wordwidget.NEXT"
    const val ACTION_SPEAK = "expo.modules.wordwidget.SPEAK"

    /** Re-renders every placed widget. Safe to call from anywhere. */
    fun renderAll(context: Context) {
      val manager = AppWidgetManager.getInstance(context)
      val ids = manager.getAppWidgetIds(
        ComponentName(context, WordWidgetProvider::class.java),
      )
      for (id in ids) render(context, manager, id)
    }

    private fun render(context: Context, manager: AppWidgetManager, widgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.kalima_widget)
      val current = WidgetStore.current(context)

      if (current == null) {
        views.setTextViewText(R.id.kalima_word, "—")
        views.setTextViewText(R.id.kalima_ipa, "")
        views.setTextViewText(
          R.id.kalima_meaning,
          context.getString(R.string.kalima_widget_empty),
        )
      } else {
        views.setTextViewText(R.id.kalima_word, current.word)
        views.setTextViewText(R.id.kalima_ipa, current.ipa)
        views.setTextViewText(R.id.kalima_meaning, current.translation)
      }

      views.setOnClickPendingIntent(R.id.kalima_next, broadcast(context, ACTION_NEXT))
      views.setOnClickPendingIntent(R.id.kalima_speak, broadcast(context, ACTION_SPEAK))
      views.setOnClickPendingIntent(R.id.kalima_root, openApp(context, current?.id))

      manager.updateAppWidget(widgetId, views)
    }

    private fun flags(): Int =
      PendingIntent.FLAG_UPDATE_CURRENT or
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
          PendingIntent.FLAG_IMMUTABLE
        } else {
          0
        }

    private fun broadcast(context: Context, action: String): PendingIntent {
      val intent = Intent(context, WordWidgetProvider::class.java).apply {
        this.action = action
      }
      return PendingIntent.getBroadcast(context, action.hashCode(), intent, flags())
    }

    /** Deep link straight to the word, falling back to the app's launcher. */
    private fun openApp(context: Context, userWordId: String?): PendingIntent {
      val intent = if (!userWordId.isNullOrEmpty()) {
        Intent(Intent.ACTION_VIEW, Uri.parse("kalima:///word/$userWordId"))
      } else {
        context.packageManager.getLaunchIntentForPackage(context.packageName)
          ?: Intent(Intent.ACTION_MAIN)
      }
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      return PendingIntent.getActivity(context, 1, intent, flags())
    }
  }

  override fun onUpdate(
    context: Context,
    manager: AppWidgetManager,
    widgetIds: IntArray,
  ) {
    // A system-driven update means time passed — show a different word.
    WidgetStore.advance(context)
    for (id in widgetIds) render(context, manager, id)
  }

  override fun onReceive(context: Context, intent: Intent) {
    super.onReceive(context, intent)

    when (intent.action) {
      ACTION_NEXT -> {
        WidgetStore.advance(context)
        renderAll(context)
      }

      ACTION_SPEAK -> speak(context)
    }
  }

  /**
   * Speaks the current word from inside the receiver.
   *
   * goAsync() rather than a Service on purpose: Android 8 forbids starting a
   * background service from a broadcast, and a foreground service would mean a
   * permanent notification for one second of audio. A receiver gets about ten
   * seconds of leeway, which is far more than one word needs.
   */
  private fun speak(context: Context) {
    val word = WidgetStore.current(context)?.word ?: return
    val pending = goAsync()
    val app = context.applicationContext

    var tts: TextToSpeech? = null
    tts = TextToSpeech(app) { status ->
      if (status != TextToSpeech.SUCCESS) {
        tts?.shutdown()
        pending.finish()
        return@TextToSpeech
      }

      tts?.language = Locale.US
      tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
        override fun onStart(utteranceId: String?) {}

        override fun onDone(utteranceId: String?) {
          tts?.shutdown()
          pending.finish()
        }

        @Deprecated("required by the base class")
        override fun onError(utteranceId: String?) {
          tts?.shutdown()
          pending.finish()
        }
      })

      tts?.speak(word, TextToSpeech.QUEUE_FLUSH, null, "kalima-widget")
    }
  }
}
