/**
 * Hook de détection des fonctionnalités du navigateur
 * Pour une expérience adaptative selon les capacités de l'appareil
 */

import { useState, useEffect } from 'react'

export function useFeatureDetection() {
  const [features, setFeatures] = useState({
    isLoading: true,
    online: navigator.onLine,
    touch: false,
    webp: false,
    avif: false,
    webgl: false,
    indexedDB: false,
    serviceWorker: 'serviceWorker' in navigator,
    pushNotification: false,
    geolocation: 'geolocation' in navigator,
    mediaDevices: false,
    clipboard: false,
    fileSystem: false,
    wakeLock: false,
    bluetooth: false,
    usb: false,
    payment: false,
    share: false,
    deviceMemory: navigator.deviceMemory || null,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    connection: null,
    reducedMotion: false,
    prefersDarkMode: false,
  })

  useEffect(() => {
    const detectFeatures = async () => {
      const newFeatures = { ...features, isLoading: true }

      // Touch
      newFeatures.touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      // WebP support
      try {
        const webp = document.createElement('canvas')
        webp.width = 1
        webp.height = 1
        newFeatures.webp = webp.toDataURL('image/webp').indexOf('data:image/webp') === 0
      } catch {
        newFeatures.webp = false
      }

      // AVIF support
      try {
        const avif = new Image()
        avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAABwaWdhAAAAAG1pZjEAAABoZXFhAAAAAGRvYl8AAAAI2NhdlAAAAAjaWR0AAAAAGRsc2UAAAAkbWRhdAAAAA'
        await new Promise((resolve) => {
          avif.onload = () => resolve(true)
          avif.onerror = () => resolve(false)
          setTimeout(() => resolve(false), 100)
        })
        newFeatures.avif = avif.complete && avif.naturalWidth > 0
      } catch {
        newFeatures.avif = false
      }

      // WebGL
      try {
        const canvas = document.createElement('canvas')
        newFeatures.webgl = !!(window.WebGLRenderingContext && canvas.getContext('webgl'))
      } catch {
        newFeatures.webgl = false
      }

      // IndexedDB
      newFeatures.indexedDB = 'indexedDB' in window

      // Push Notifications
      newFeatures.pushNotification = 'PushManager' in window

      // Media Devices
      newFeatures.mediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)

      // Clipboard
      newFeatures.clipboard = !!(navigator.clipboard)

      // File System Access API
      newFeatures.fileSystem = 'showOpenFilePicker' in window

      // Wake Lock
      newFeatures.wakeLock = 'wakeLock' in navigator

      // Web Bluetooth
      newFeatures.bluetooth = 'bluetooth' in navigator

      // Web USB
      newFeatures.usb = 'usb' in navigator

      // Payment Request API
      newFeatures.payment = 'PaymentRequest' in window

      // Web Share API
      newFeatures.share = 'share' in navigator

      // Network Information
      if ('connection' in navigator) {
        newFeatures.connection = navigator.connection
      }

      // Reduced Motion
      newFeatures.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      // Dark Mode
      newFeatures.prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

      newFeatures.isLoading = false
      setFeatures(newFeatures)
    }

    detectFeatures()

    // Écouter les changements de connexion
    const handleOnline = () => setFeatures((f) => ({ ...f, online: true }))
    const handleOffline = () => setFeatures((f) => ({ ...f, online: false }))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Écouter les changements de préférences
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleMotionChange = (e) => setFeatures((f) => ({ ...f, reducedMotion: e.matches }))
    const handleDarkChange = (e) => setFeatures((f) => ({ ...f, prefersDarkMode: e.matches }))

    motionQuery.addEventListener('change', handleMotionChange)
    darkQuery.addEventListener('change', handleDarkChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      motionQuery.removeEventListener('change', handleMotionChange)
      darkQuery.removeEventListener('change', handleDarkChange)
    }
  }, [])

  return features
}

// Hook pour la qualité de connexion
export function useConnectionQuality() {
  const [quality, setQuality] = useState({
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  })

  useEffect(() => {
    if (!('connection' in navigator)) return

    const connection = navigator.connection

    const updateQuality = () => {
      setQuality({
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 50,
        saveData: connection.saveData || false,
      })
    }

    updateQuality()
    connection.addEventListener('change', updateQuality)

    return () => connection.removeEventListener('change', updateQuality)
  }, [])

  return quality
}

// Hook pour la batterie
export function useBattery() {
  const [battery, setBattery] = useState({
    supported: false,
    level: 1,
    charging: true,
    chargingTime: 0,
    dischargingTime: Infinity,
  })

  useEffect(() => {
    if (!('getBattery' in navigator)) return

    let batteryRef = null

    navigator.getBattery().then((bat) => {
      batteryRef = bat
      setBattery({
        supported: true,
        level: bat.level,
        charging: bat.charging,
        chargingTime: bat.chargingTime,
        dischargingTime: bat.dischargingTime,
      })

      const updateBattery = () => {
        setBattery({
          supported: true,
          level: bat.level,
          charging: bat.charging,
          chargingTime: bat.chargingTime,
          dischargingTime: bat.dischargingTime,
        })
      }

      bat.addEventListener('levelchange', updateBattery)
      bat.addEventListener('chargingchange', updateBattery)
      bat.addEventListener('chargingtimechange', updateBattery)
      bat.addEventListener('dischargingtimechange', updateBattery)

      return () => {
        bat.removeEventListener('levelchange', updateBattery)
        bat.removeEventListener('chargingchange', updateBattery)
        bat.removeEventListener('chargingtimechange', updateBattery)
        bat.removeEventListener('dischargingtimechange', updateBattery)
      }
    })
  }, [])

  return battery
}

// Hook pour la visibilité de la page
export function usePageVisibility() {
  const [visible, setVisible] = useState(!document.hidden)

  useEffect(() => {
    const handleVisibilityChange = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return visible
}

// Hook pour la taille de l'écran
export function useScreenSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 640,
    isTablet: window.innerWidth >= 640 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024,
  })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setSize({
        width,
        height: window.innerHeight,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return size
}
