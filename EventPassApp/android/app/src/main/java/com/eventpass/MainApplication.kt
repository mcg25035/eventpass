package com.eventpass

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    
    // Auto-configure Metro host for physical device debugging
    try {
      val prefs = android.preference.PreferenceManager.getDefaultSharedPreferences(this)
      if (!prefs.contains("debug_http_host")) {
        prefs.edit().putString("debug_http_host", "10.104.173.190:8081").apply()
      }
    } catch (e: Exception) {
      // Ignore
    }

    loadReactNative(this)
  }
}
