package expo.modules.wordwidget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import android.widget.RemoteViews
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

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

    private const val UTTERANCE_ID = "kalima-widget"

    /** Longest the spinner may stay up if the voice engine never answers. */
    private const val WATCHDOG_MS = 10_000L

    private val main = Handler(Looper.getMainLooper())

    /**
     * Held for the life of the process so only the first tap waits for the
     * system voice service to bind — that bind is what made every tap feel
     * like nothing happened.
     */
    @Volatile
    private var engine: TextToSpeech? = null

    @Volatile
    private var engineReady = false

    /** Drives which icon the speak button shows. */
    @Volatile
    private var speaking = false

    private fun setSpeaking(context: Context, value: Boolean) {
      if (speaking == value) return
      speaking = value
      renderAll(context)
    }

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
        views.setTextViewText(
          R.id.kalima_meaning,
          context.getString(R.string.kalima_widget_empty),
        )
      } else {
        // no IPA on the widget: at a glance it reads as noise, and the space
        // is worth more to the word and its meaning when the card is small
        views.setTextViewText(R.id.kalima_word, current.word)
        views.setTextViewText(R.id.kalima_meaning, current.translation)
      }

      // an hourglass while the voice engine warms up, so a slow first tap
      // reads as "loading" rather than "nothing happened"
      views.setImageViewResource(
        R.id.kalima_speak,
        if (speaking) R.drawable.kalima_ic_loading else R.drawable.kalima_ic_speak,
      )

      views.setOnClickPendingIntent(R.id.kalima_next, broadcast(context, ACTION_NEXT))
      views.setOnClickPendingIntent(R.id.kalima_speak, broadcast(context, ACTION_SPEAK))
      views.setOnClickPendingIntent(R.id.kalima_root, openApp(context, current?.id))

      // A throw here would leave the launcher showing "error loading widget"
      // with no way back except removing the widget. Keeping the last good
      // render on screen is a far better failure than that.
      try {
        manager.updateAppWidget(widgetId, views)
      } catch (e: Exception) {
        Log.w("KalimaWidget", "update failed", e)
      }
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
   *
   * The engine is kept alive between taps. Building a TextToSpeech binds to the
   * system voice service and takes a second or more; doing that on every tap
   * made every tap feel broken. Now only the first one pays.
   */
  private fun speak(context: Context) {
    val word = WidgetStore.current(context)?.word ?: return
    val app = context.applicationContext
    val pending = goAsync()

    setSpeaking(app, true)

    // Exactly one path may finish the broadcast and clear the spinner.
    val finished = AtomicBoolean(false)
    val finish = {
      if (finished.compareAndSet(false, true)) {
        setSpeaking(app, false)
        try {
          pending.finish()
        } catch (_: Exception) {
          // already finished
        }
      }
    }

    // If the engine never calls back, the button must not stay an hourglass.
    main.postDelayed({ finish() }, WATCHDOG_MS)

    val warm = engine
    if (warm != null && engineReady) {
      warm.setOnUtteranceProgressListener(listener(finish))
      warm.speak(word, TextToSpeech.QUEUE_FLUSH, null, UTTERANCE_ID)
      return
    }

    // `local` is captured by the callback, which fires after this assignment.
    var local: TextToSpeech? = null
    local = TextToSpeech(app) { status ->
      if (status != TextToSpeech.SUCCESS) {
        engineReady = false
        finish()
        return@TextToSpeech
      }

      engineReady = true
      local?.language = Locale.US
      local?.setOnUtteranceProgressListener(listener(finish))
      local?.speak(word, TextToSpeech.QUEUE_FLUSH, null, UTTERANCE_ID)
    }
    engine = local
  }

  private fun listener(finish: () -> Unit) = object : UtteranceProgressListener() {
    override fun onStart(utteranceId: String?) {}

    override fun onDone(utteranceId: String?) = finish()

    @Deprecated("required by the base class")
    override fun onError(utteranceId: String?) = finish()
  }
}
