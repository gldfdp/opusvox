/**
 * Mobile app lifecycle management for Capacitor.
 *
 * Handles Android back-button navigation and pauses recording
 * when the app is backgrounded. Only activates on native platforms —
 * no-ops when running in a regular browser.
 *
 * Usage: call `initMobileLifecycle` once in App.tsx useEffect,
 * and `cleanupMobileLifecycle` on unmount.
 */
import { App, type PluginListenerHandle } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'

export interface MobileLifecycleOptions {
  /** Called when the Android back button is pressed and settings are open. */
  onBack: () => void
  /** Called when the app goes to the background (pause recording, stop TTS…). */
  onBackground: () => void
}

const handles: PluginListenerHandle[] = []

export async function initMobileLifecycle(opts: MobileLifecycleOptions): Promise<void> 
{
  if (!Capacitor.isNativePlatform()) 
  {
    return
  }

  // Configure status bar appearance
  try 
  {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0f0f0f' })
  }
  catch 
  {
    // Status bar API not available on all devices
  }

  // Hide splash screen after the app shell is ready
  try 
  {
    await SplashScreen.hide()
  }
  catch 
  {
    // Already hidden or not supported
  }

  // Android back button: delegate to app-level navigation, exit if nothing to close
  handles.push(
    await App.addListener('backButton', ({ canGoBack }) => 
    {
      opts.onBack()
      if (!canGoBack) 
      {
        App.exitApp()
      }
    })
  )

  // Stop active recording / TTS when app is backgrounded
  handles.push(
    await App.addListener('appStateChange', ({ isActive }) => 
    {
      if (!isActive) 
      {
        opts.onBackground()
      }
    })
  )
}

export function cleanupMobileLifecycle(): void 
{
  handles.forEach(h => h.remove())
  handles.length = 0
}

/** True when running inside a Capacitor native app (iOS or Android). */
export const isNative = (): boolean => Capacitor.isNativePlatform()

/** Current native platform: 'ios' | 'android' | 'web' */
export const getPlatform = (): string => Capacitor.getPlatform()
