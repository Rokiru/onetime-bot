package ru.rokiru.cargo;
import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.view.Display;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.content.pm.ActivityInfo;
public class MainActivity extends Activity {
 private WebView web;
 private boolean activityPaused=false;
 private int cutLeft=0,cutTop=0,cutRight=0,cutBottom=0;
 private void sendInsets(){if(web==null)return;float density=getResources().getDisplayMetrics().density;web.evaluateJavascript("window.androidInsets && window.androidInsets("+(cutLeft/density)+","+(cutTop/density)+","+(cutRight/density)+","+(cutBottom/density)+")",null);}
 public static class SaveStore {
  private final android.content.SharedPreferences prefs;
  SaveStore(android.content.Context context){prefs=context.getSharedPreferences("dustrivo_saves_v1",android.content.Context.MODE_PRIVATE);}
  private boolean allowed(String key){return "cargo-save-v1".equals(key)||"cargo-career-v1".equals(key)||"cargo-active-profile".equals(key);}
  @android.webkit.JavascriptInterface public String read(String key){return allowed(key)?prefs.getString(key,""):"";}
  @android.webkit.JavascriptInterface public boolean write(String key,String value){return allowed(key)&&value!=null&&value.length()<=2000000&&prefs.edit().putString(key,value).commit();}
 }

 private void immersive(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);}
 @Override public void onCreate(Bundle b){super.onCreate(b);setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);immersive();
 if(android.os.Build.VERSION.SDK_INT>=28){WindowManager.LayoutParams p=getWindow().getAttributes();p.layoutInDisplayCutoutMode=WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;getWindow().setAttributes(p);}
 Display d=getWindowManager().getDefaultDisplay();Display.Mode best=d.getMode();for(Display.Mode m:d.getSupportedModes())if(m.getPhysicalWidth()==best.getPhysicalWidth()&&m.getPhysicalHeight()==best.getPhysicalHeight()&&Math.abs(m.getRefreshRate()-60f)<Math.abs(best.getRefreshRate()-60f))best=m;WindowManager.LayoutParams wp=getWindow().getAttributes();wp.preferredDisplayModeId=best.getModeId();wp.preferredRefreshRate=60f;getWindow().setAttributes(wp);
 web=new WebView(this);web.setBackgroundColor(0xff20382a);web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);web.getSettings().setAllowFileAccess(true);web.getSettings().setAllowContentAccess(false);web.getSettings().setMediaPlaybackRequiresUserGesture(false);web.getSettings().setSupportZoom(false);web.getSettings().setBuiltInZoomControls(false);web.setOverScrollMode(View.OVER_SCROLL_NEVER);web.addJavascriptInterface(new SaveStore(this),"AndroidGameStore");
 web.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener(){@Override public android.view.WindowInsets onApplyWindowInsets(View view,android.view.WindowInsets insets){if(android.os.Build.VERSION.SDK_INT>=28){android.view.DisplayCutout cut=insets.getDisplayCutout();cutLeft=cut==null?0:cut.getSafeInsetLeft();cutTop=cut==null?0:cut.getSafeInsetTop();cutRight=cut==null?0:cut.getSafeInsetRight();cutBottom=cut==null?0:cut.getSafeInsetBottom();sendInsets();}return insets;}});
 web.setWebViewClient(new WebViewClient(){@Override public void onPageFinished(WebView v,String url){sendInsets();}@Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){return !r.getUrl().toString().startsWith("file:///android_asset/");}@Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){if(!r.getUrl().toString().startsWith("file:///android_asset/"))return new WebResourceResponse("text/plain","UTF-8",new java.io.ByteArrayInputStream(new byte[0]));return null;}});setContentView(web);web.loadUrl("file:///android_asset/index.html");}
 @Override public void onWindowFocusChanged(boolean f){super.onWindowFocusChanged(f);if(f)immersive();else if(web!=null)web.evaluateJavascript("window.androidPause && window.androidPause()",null);}
 @Override protected void onPause(){activityPaused=true;if(web!=null){final WebView target=web;target.evaluateJavascript("window.androidPause && window.androidPause()",new android.webkit.ValueCallback<String>(){public void onReceiveValue(String value){if(activityPaused&&web==target)target.pauseTimers();}});target.onPause();}super.onPause();}
 @Override protected void onResume(){super.onResume();activityPaused=false;if(web!=null){web.onResume();web.resumeTimers();web.evaluateJavascript("window.androidResume && window.androidResume()",null);}immersive();}
 @Override public void onBackPressed(){web.evaluateJavascript("window.androidBack ? window.androidBack() : false",new android.webkit.ValueCallback<String>(){ public void onReceiveValue(String v){if("false".equals(v))finish();}});}
 @Override protected void onDestroy(){if(web!=null){web.stopLoading();web.destroy();web=null;}super.onDestroy();}
}
