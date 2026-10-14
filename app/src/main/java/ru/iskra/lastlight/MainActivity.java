package ru.iskra.lastlight;

import android.app.Activity;
import android.os.Bundle;
import android.os.Build;
import android.graphics.Insets;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.view.View;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Offline game host. All assets ship in the APK; no Internet permission or remote content. */
public final class MainActivity extends Activity {
    private WebView game;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        immersive();
        game = new WebView(this);
        game.setBackgroundColor(0xff080f17);
        game.setOverScrollMode(View.OVER_SCROLL_NEVER);
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setBlockNetworkLoads(true);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setSupportZoom(false);
        game.addJavascriptInterface(new Feedback(), "Android");
        game.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return true; // The game never navigates away from its bundled entry point.
            }
        });
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xff080f17);
        root.addView(game, new FrameLayout.LayoutParams(-1, -1));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                Insets safe = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(safe.left, safe.top, safe.right, safe.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
        setContentView(root);
        game.loadUrl("file:///android_asset/game/index.html");
    }

    private void immersive() {
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
    }

    @Override public void onWindowFocusChanged(boolean focused) {
        super.onWindowFocusChanged(focused);
        if (focused) immersive();
    }

    @Override protected void onPause() {
        if (game != null) {
            game.evaluateJavascript("window.nativePause && window.nativePause()", null);
            game.onPause();
            game.pauseTimers();
        }
        super.onPause();
    }

    @Override protected void onResume() {
        super.onResume();
        if (game != null) { game.onResume(); game.resumeTimers(); }
    }

    @Override public void onBackPressed() {
        game.evaluateJavascript("window.nativeBack ? window.nativeBack() : false", handled -> {
            if (!"true".equals(handled)) finish();
        });
    }

    @Override protected void onDestroy() {
        if (game != null) {
            game.removeJavascriptInterface("Android");
            game.destroy();
        }
        super.onDestroy();
    }

    private final class Feedback {
        @JavascriptInterface public void feedback(int duration) {
            final int ms = Math.max(1, Math.min(duration, 100));
            runOnUiThread(() -> {
                Vibrator vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (vibrator != null && vibrator.hasVibrator())
                    vibrator.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
            });
        }
    }
}
