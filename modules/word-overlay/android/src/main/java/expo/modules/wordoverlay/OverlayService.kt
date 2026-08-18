package expo.modules.wordoverlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Shows a small word card over whatever the user is doing, on a fixed interval.
 *
 * A foreground service rather than WorkManager because the interval is short
 * (30 minutes by default) and the card must appear at that moment, not
 * whenever the system feels like batching work.
 */
class OverlayService : Service() {

  companion object {
    const val ACTION_START = "expo.modules.wordoverlay.START"
    const val ACTION_STOP = "expo.modules.wordoverlay.STOP"
    const val ACTION_UPDATE = "expo.modules.wordoverlay.UPDATE"

    const val EXTRA_INTERVAL = "intervalMinutes"
    const val EXTRA_WORDS = "words"
    const val EXTRA_TRANSLATIONS = "translations"
    const val EXTRA_TITLE = "notificationTitle"
    const val EXTRA_BODY = "notificationBody"

    private const val CHANNEL_ID = "kalima-overlay"
    private const val NOTIFICATION_ID = 4711

    /** How long a card stays on screen before it fades itself out. */
    private const val VISIBLE_MS = 9_000L

    @Volatile
    var isRunning: Boolean = false
      private set
  }

  private val handler = Handler(Looper.getMainLooper())
  private var windowManager: WindowManager? = null
  private var cardView: View? = null

  private var words: List<String> = emptyList()
  private var translations: List<String> = emptyList()
  private var intervalMs: Long = 30 * 60 * 1000L
  private var cursor = 0

  private val tick = object : Runnable {
    override fun run() {
      showCard()
      handler.postDelayed(this, intervalMs)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopEverything()
        return START_NOT_STICKY
      }

      ACTION_UPDATE -> {
        readPayload(intent)
        return START_STICKY
      }

      else -> {
        readPayload(intent)

        // No permission means no overlay — bail out rather than run a service
        // that can never draw anything.
        if (!canDraw()) {
          stopEverything()
          return START_NOT_STICKY
        }

        startInForeground(
          intent?.getStringExtra(EXTRA_TITLE) ?: "Kalima",
          intent?.getStringExtra(EXTRA_BODY) ?: "",
        )

        isRunning = true
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        handler.removeCallbacks(tick)
        // First card comes at the first interval, not the instant you enable it.
        handler.postDelayed(tick, intervalMs)
        return START_STICKY
      }
    }
  }

  override fun onDestroy() {
    stopEverything()
    super.onDestroy()
  }

  // ── payload ─────────────────────────────────────────────
  private fun readPayload(intent: Intent?) {
    intent ?: return

    intent.getStringArrayListExtra(EXTRA_WORDS)?.let { words = it }
    intent.getStringArrayListExtra(EXTRA_TRANSLATIONS)?.let { translations = it }

    val minutes = intent.getIntExtra(EXTRA_INTERVAL, 30)
    if (minutes > 0) intervalMs = minutes * 60 * 1000L
    if (cursor >= words.size) cursor = 0
  }

  private fun canDraw(): Boolean =
    Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(this)

  // ── lifecycle ───────────────────────────────────────────
  private fun startInForeground(title: String, body: String) {
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "Word cards",
        NotificationManager.IMPORTANCE_MIN,
      ).apply { setShowBadge(false) }
      manager.createNotificationChannel(channel)
    }

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }

    val notification = builder
      .setContentTitle(title)
      .setContentText(body)
      .setSmallIcon(applicationInfo.icon)
      .setOngoing(true)
      .build()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun stopEverything() {
    handler.removeCallbacksAndMessages(null)
    removeCard()
    isRunning = false
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
        stopForeground(STOP_FOREGROUND_REMOVE)
      } else {
        @Suppress("DEPRECATION")
        stopForeground(true)
      }
    } catch (_: Exception) {
      // already gone
    }
    stopSelf()
  }

  // ── the card ────────────────────────────────────────────
  private fun showCard() {
    if (words.isEmpty() || !canDraw()) return

    removeCard()

    val word = words[cursor % words.size]
    val translation = translations.getOrElse(cursor % words.size) { "" }
    cursor = (cursor + 1) % words.size

    val view = buildCard(word, translation)
    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
      } else {
        @Suppress("DEPRECATION")
        WindowManager.LayoutParams.TYPE_PHONE
      },
      // not focusable: the card must never steal typing from the app underneath
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
      y = dp(72)
    }

    try {
      windowManager?.addView(view, params)
      cardView = view
    } catch (_: Exception) {
      // permission revoked while running, or window token refused
      stopEverything()
      return
    }

    view.alpha = 0f
    view.animate().alpha(1f).setDuration(220).start()
    handler.postDelayed({ removeCard() }, VISIBLE_MS)
  }

  private fun removeCard() {
    val view = cardView ?: return
    cardView = null
    try {
      windowManager?.removeView(view)
    } catch (_: Exception) {
      // never attached
    }
  }

  private fun buildCard(word: String, translation: String): View {
    val root = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(dp(20), dp(16), dp(20), dp(16))
      background = GradientDrawable().apply {
        cornerRadius = dp(20).toFloat()
        setColor(Color.parseColor("#F2101827"))
        setStroke(dp(1), Color.parseColor("#33FFFFFF"))
      }
      elevation = dp(8).toFloat()
      layoutParams = LinearLayout.LayoutParams(dp(300), LinearLayout.LayoutParams.WRAP_CONTENT)
    }

    root.addView(
      TextView(this).apply {
        text = word
        setTextColor(Color.WHITE)
        setTextSize(TypedValue.COMPLEX_UNIT_SP, 22f)
        textDirection = View.TEXT_DIRECTION_LTR
      },
    )

    if (translation.isNotEmpty()) {
      root.addView(
        TextView(this).apply {
          text = translation
          setTextColor(Color.parseColor("#C8D0E0"))
          setTextSize(TypedValue.COMPLEX_UNIT_SP, 17f)
          setPadding(0, dp(6), 0, 0)
        },
      )
    }

    // Tap dismisses it early; it's a glance, not a task.
    root.setOnClickListener { removeCard() }
    return root
  }

  private fun dp(value: Int): Int =
    (value * resources.displayMetrics.density).toInt()
}
