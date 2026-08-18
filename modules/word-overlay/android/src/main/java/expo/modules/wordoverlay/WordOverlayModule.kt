package expo.modules.wordoverlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class OverlayCard : Record {
  @Field val word: String = ""
  @Field val translation: String = ""
}

/**
 * Android-only bridge for the periodic word card.
 *
 * iOS is not listed in expo-module.config.json at all: no iOS API lets one app
 * draw over another, so there is nothing to implement. The JS wrapper checks
 * `isSupported()` and hides the feature there.
 */
class WordOverlayModule : Module() {

  private val context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("WordOverlay")

    Function("isSupported") { true }

    Function("hasPermission") {
      Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)
    }

    Function("isRunning") { OverlayService.isRunning }

    /**
     * Opens the system screen where the permission is granted. Android gives no
     * dialog and no callback for this one, so the caller re-checks
     * `hasPermission()` when the app comes back to the foreground.
     */
    AsyncFunction("openPermissionSettings") {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${context.packageName}"),
        ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        context.startActivity(intent)
      }
    }

    AsyncFunction("start") { intervalMinutes: Int, cards: List<OverlayCard>, notificationTitle: String, notificationBody: String ->
      val intent = Intent(context, OverlayService::class.java).apply {
        action = OverlayService.ACTION_START
        putExtra(OverlayService.EXTRA_INTERVAL, intervalMinutes)
        putStringArrayListExtra(
          OverlayService.EXTRA_WORDS,
          ArrayList(cards.map { it.word }),
        )
        putStringArrayListExtra(
          OverlayService.EXTRA_TRANSLATIONS,
          ArrayList(cards.map { it.translation }),
        )
        putExtra(OverlayService.EXTRA_TITLE, notificationTitle)
        putExtra(OverlayService.EXTRA_BODY, notificationBody)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    /** Swap the deck without restarting the service. */
    AsyncFunction("setCards") { cards: List<OverlayCard> ->
      if (!OverlayService.isRunning) return@AsyncFunction

      val intent = Intent(context, OverlayService::class.java).apply {
        action = OverlayService.ACTION_UPDATE
        putStringArrayListExtra(
          OverlayService.EXTRA_WORDS,
          ArrayList(cards.map { it.word }),
        )
        putStringArrayListExtra(
          OverlayService.EXTRA_TRANSLATIONS,
          ArrayList(cards.map { it.translation }),
        )
      }
      context.startService(intent)
    }

    AsyncFunction("stop") {
      val intent = Intent(context, OverlayService::class.java).apply {
        action = OverlayService.ACTION_STOP
      }
      context.startService(intent)
    }
  }
}
