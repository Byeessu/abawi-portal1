/**
 * ABAWI ROBUST MEDIA ENGINE
 * 
 * Objectif :
 * - Capture photo/vidéo robuste et fiable
 * - Gestion centralisée des erreurs et permissions
 * - Memory optimization pour gros médias
 * - Background removal et traitement d'image
 * - Multiple formats et options avancées
 * - Error recovery et retry automatique
 * - Performance monitoring
 * 
 * @version 1.0.0 - Production Ready
 */

import robustAsync from './RobustAsyncWrapper'

// ========================================
// CONFIGURATION MEDIA
// ========================================

const MEDIA_CONFIG = {
  // Timeout par type de média
  TIMEOUTS: {
    camera: 15000,      // 15 secondes
    capture: 5000,      // 5 secondes
    processing: 30000,   // 30 secondes
    export: 20000        // 20 secondes
  },
  
  // Constraints vidéo par défaut
  VIDEO_CONSTRAINTS: {
    photo: {
      video: {
        width: { ideal: 1920, max: 3840 },
        height: { ideal: 1080, max: 2160 },
        facingMode: 'user',
        frameRate: { ideal: 30, max: 60 }
      }
    },
    video: {
      video: {
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        facingMode: 'user',
        frameRate: { ideal: 30, max: 30 }
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 44100
      }
    }
  },
  
  // Options de traitement
  PROCESSING_OPTIONS: {
    backgroundRemoval: {
      tolerance: 30,
      maxIterations: 1000,
      minRegionSize: 100
    },
    filters: {
      sharpen: { range: [0, 2], default: 0.5 },
      brightness: { range: [-100, 100], default: 0 },
      contrast: { range: [-100, 100], default: 0 },
      saturation: { range: [-100, 100], default: 0 },
      warmth: { range: [-100, 100], default: 0 }
    }
  }
}

// ========================================
// PERMISSION MANAGER
// ========================================

class PermissionManager {
  constructor() {
    this.permissions = new Map()
    this.requestCallbacks = new Map()
  }

  async requestPermission(type) {
    if (this.permissions.has(type)) {
      return this.permissions.get(type)
    }

    try {
      let permission
      
      switch (type) {
        case 'camera':
          permission = await navigator.permissions.query({ name: 'camera' })
          break
        case 'microphone':
          permission = await navigator.permissions.query({ name: 'microphone' })
          break
        default:
          throw new Error(`Type de permission non supporté: ${type}`)
      }

      this.permissions.set(type, permission)
      
      // Écouter les changements de permission
      permission.addEventListener('change', () => {
        this.permissions.set(type, permission)
        this.notifyPermissionChange(type, permission)
      })

      return permission
    } catch (error) {
      console.warn(`[PERMISSION] Impossible de vérifier la permission ${type}:`, error)
      // Fallback pour les navigateurs qui ne supportent pas l'API permissions
      return { state: 'prompt' }
    }
  }

  async requestMediaAccess(constraints) {
    try {
      // Vérifier les permissions d'abord
      if (constraints.video) {
        await this.requestPermission('camera')
      }
      if (constraints.audio) {
        await this.requestPermission('microphone')
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      return { success: true, stream }
    } catch (error) {
      const standardError = this.standardizeMediaError(error)
      console.error(`[MEDIA] Erreur d'accès média:`, standardError)
      return { success: false, error: standardError }
    }
  }

  standardizeMediaError(error) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return {
        type: 'permission_denied',
        message: 'Accès à la caméra/micro refusé. Veuillez autoriser l\'accès dans les paramètres du navigateur.',
        userAction: 'Vérifier les permissions du navigateur'
      }
    }

    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return {
        type: 'device_not_found',
        message: 'Aucun appareil photo/vidéo trouvé.',
        userAction: 'Vérifier que la caméra est connectée'
      }
    }

    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return {
        type: 'device_in_use',
        message: 'L\'appareil est déjà utilisé par une autre application.',
        userAction: 'Fermer les autres applications utilisant la caméra'
      }
    }

    if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
      return {
        type: 'constraints_not_satisfied',
        message: 'Les contraintes demandées ne sont pas supportées par l\'appareil.',
        userAction: 'Essayer avec des paramètres plus bas'
      }
    }

    if (error.name === 'TypeError') {
      return {
        type: 'security_error',
        message: 'Erreur de sécurité. Vérifiez que la connexion est HTTPS.',
        userAction: 'Utiliser une connexion sécurisée (HTTPS)'
      }
    }

    return {
      type: 'unknown',
      message: error.message || 'Erreur inconnue lors de l\'accès média.',
      userAction: 'Vérifier la console pour plus de détails'
    }
  }

  notifyPermissionChange(type, permission) {
    const callback = this.requestCallbacks.get(type)
    if (callback) {
      callback(permission)
    }
  }

  onPermissionChange(type, callback) {
    this.requestCallbacks.set(type, callback)
  }
}

// ========================================
// CANVAS PROCESSOR
// ========================================

class CanvasProcessor {
  constructor() {
    this.tempCanvas = document.createElement('canvas')
    this.tempCtx = this.tempCanvas.getContext('2d')
  }

  centerCropFromVideo(video, targetW, targetH, outW, outH, filters = null) {
    const vw = video.videoWidth
    const vh = video.videoHeight
    const va = vw / vh
    const ta = targetW / targetH

    let sx, sy, sw, sh
    if (va > ta) {
      sh = vh
      sw = vh * ta
      sx = (vw - sw) / 2
      sy = 0
    } else {
      sw = vw
      sh = vw / ta
      sx = 0
      sy = (vh - sh) / 2
    }

    this.tempCanvas.width = outW
    this.tempCanvas.height = outH

    if (!this.tempCtx) return null

    // Appliquer les filtres si spécifiés
    if (filters) {
      this.applyFilters(filters)
    }

    this.tempCtx.drawImage(video, sx, sy, sw, sh, 0, 0, outW, outH)
    this.tempCtx.filter = 'none'

    return this.tempCanvas
  }

  applyFilters(filters) {
    const { brightness = 0, contrast = 0, saturate = 0, warmth = 0 } = filters
    
    let filterString = ''
    
    if (brightness !== 0) {
      filterString += `brightness(${1 + brightness / 100}) `
    }
    
    if (contrast !== 0) {
      filterString += `contrast(${1 + contrast / 100}) `
    }
    
    if (saturate !== 0) {
      filterString += `saturate(${1 + saturate / 100}) `
    }
    
    if (warmth > 0) {
      filterString += `sepia(${warmth * 0.35}) `
    }

    this.tempCtx.filter = filterString.trim()
  }

  applySharpen(sourceCanvas, sharpness) {
    if (sharpness <= 0.05) return sourceCanvas

    const w = sourceCanvas.width
    const h = sourceCanvas.height
    const sourceCtx = sourceCanvas.getContext('2d')
    
    if (!sourceCtx) return sourceCanvas

    const imageData = sourceCtx.getImageData(0, 0, w, h)
    const data = imageData.data
    const output = sourceCtx.createImageData(w, h)
    const outputData = output.data

    const k = sharpness * 0.4
    for (let i = 0; i < data.length; i += 4) {
      if (i > w * 4 && i < data.length - w * 4) {
        outputData[i] = data[i] + k * (data[i] - data[i - w * 4])
        outputData[i + 1] = data[i + 1] + k * (data[i + 1] - data[i - w * 4 + 1])
        outputData[i + 2] = data[i + 2] + k * (data[i + 2] - data[i - w * 4 + 2])
      } else {
        outputData[i] = data[i]
        outputData[i + 1] = data[i + 1]
        outputData[i + 2] = data[i + 2]
      }
      outputData[i + 3] = data[i + 3]
    }

    const resultCanvas = document.createElement('canvas')
    resultCanvas.width = w
    resultCanvas.height = h
    resultCanvas.getContext('2d')?.putImageData(output, 0, 0)

    return resultCanvas
  }

  removeBackground(sourceCanvas, tolerance = 30) {
    const w = sourceCanvas.width
    const h = sourceCanvas.height
    
    if (w === 0 || h === 0) return sourceCanvas

    const ctx = sourceCanvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, w, h)
    const data = imageData.data

    // Flood fill algorithm pour supprimer le fond
    const visited = new Array(w * h).fill(false)
    const queue = []
    
    // Commencer depuis les coins
    const corners = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]
    ]
    
    for (const [x, y] of corners) {
      const pos = y * w + x
      if (!visited[pos]) {
        const startColor = this.getPixelColor(data, pos)
        if (this.isBackgroundLike(startColor, tolerance)) {
          queue.push(pos)
          visited[pos] = true
        }
      }
    }

    // Flood fill
    while (queue.length > 0) {
      const pos = queue.shift()
      const x = pos % w
      const y = Math.floor(pos / w)
      const currentColor = this.getPixelColor(data, pos)

      // Marquer comme transparent
      data[pos * 4 + 3] = 0

      // Ajouter les voisins
      const neighbors = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]
      ]

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const npos = ny * w + nx
          if (!visited[npos]) {
            visited[npos] = true
            const neighborColor = this.getPixelColor(data, npos)
            if (this.colorDistance(currentColor, neighborColor) < tolerance * 1.15) {
              queue.push(npos)
            }
          }
        }
      }
    }

    // Créer le canvas avec fond transparent
    const result = document.createElement('canvas')
    result.width = w
    result.height = h
    result.getContext('2d').putImageData(imageData, 0, 0)

    return result
  }

  getPixelColor(data, pos) {
    return {
      r: data[pos * 4],
      g: data[pos * 4 + 1],
      b: data[pos * 4 + 2],
      a: data[pos * 4 + 3]
    }
  }

  colorDistance(color1, color2) {
    const dr = color1.r - color2.r
    const dg = color1.g - color2.g
    const db = color1.b - color2.b
    return Math.sqrt(dr * dr + dg * dg + db * db)
  }

  isBackgroundLike(color, tolerance) {
    // Considérer comme fond les couleurs claires
    const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000
    return brightness > 240 - tolerance
  }

  composeOnBackground(subjectCanvas, bgColor, w, h) {
    const out = document.createElement('canvas')
    out.width = w
    out.height = h
    const ctx = out.getContext('2d')

    if (bgColor && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, w, h)
    }

    ctx.drawImage(subjectCanvas, 0, 0)
    return out
  }

  canvasToDataURL(canvas, format = 'png', quality = 0.95) {
    return robustAsync.execute(
      async () => {
        return new Promise((resolve, reject) => {
          try {
            const dataURL = canvas.toDataURL(`image/${format}`, quality)
            resolve(dataURL)
          } catch (error) {
            reject(error)
          }
        })
      },
      {
        timeout: 5000,
        operationType: 'canvas_conversion'
      }
    )
  }

  canvasToBlob(canvas, format = 'png', quality = 0.95) {
    return robustAsync.execute(
      async () => {
        return new Promise((resolve, reject) => {
          try {
            canvas.toBlob(resolve, `image/${format}`, quality)
          } catch (error) {
            reject(error)
          }
        })
      },
      {
        timeout: 5000,
        operationType: 'canvas_conversion'
      }
    )
  }
}

// ========================================
// MEDIA RECORDER
// ========================================

class MediaRecorder {
  constructor() {
    this.recorder = null
    this.chunks = []
    this.isRecording = false
    this.startTime = null
    this.onDataAvailable = null
    this.onStop = null
    this.onError = null
  }

  async startRecording(stream, options = {}) {
    if (this.isRecording) {
      throw new Error('Enregistrement déjà en cours')
    }

    let {
      mimeType = 'video/webm;codecs=vp9',
      timeSlice = 1000,
      maxWidth = 1280,
      maxHeight = 720
    } = options

    try {
      // Vérifier le support du mimeType
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.warn(`[RECORDER] mimeType ${mimeType} non supporté, utilisation du fallback`)
        mimeType = 'video/webm'
      }

      this.recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      })

      this.chunks = []
      this.isRecording = true
      this.startTime = Date.now()

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
        }
        
        if (this.onDataAvailable) {
          this.onDataAvailable(event)
        }
      }

      this.recorder.onerror = (event) => {
        const error = new Error(`Erreur d'enregistrement: ${event.error}`)
        if (this.onError) {
          this.onError(error)
        }
      }

      this.recorder.onstop = () => {
        if (this.onStop) {
          const duration = Date.now() - this.startTime
          const blob = new Blob(this.chunks, { type: mimeType })
          this.onStop({ blob, duration, chunks: this.chunks.length })
        }
      }

      this.recorder.start(timeSlice)

      return { success: true, recorder: this.recorder }
    } catch (error) {
      this.isRecording = false
      throw new Error(`Échec démarrage enregistrement: ${error.message}`)
    }
  }

  stopRecording() {
    if (!this.isRecording || !this.recorder) {
      return false
    }

    this.recorder.stop()
    this.isRecording = false

    return true
  }

  pauseRecording() {
    if (this.isRecording && this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause()
      return true
    }
    return false
  }

  resumeRecording() {
    if (this.isRecording && this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume()
      return true
    }
    return false
  }

  getRecordingState() {
    if (!this.recorder) return 'inactive'
    return this.recorder.state
  }

  getRecordingDuration() {
    if (!this.startTime) return 0
    return Date.now() - this.startTime
  }
}

// ========================================
// MAIN ROBUST MEDIA ENGINE
// ========================================

class RobustMediaEngine {
  constructor() {
    this.permissionManager = new PermissionManager()
    this.canvasProcessor = new CanvasProcessor()
    this.mediaRecorder = new MediaRecorder()
    this.activeStreams = new Map()
    this.stats = {
      totalCaptures: 0,
      successfulCaptures: 0,
      failedCaptures: 0,
      averageProcessingTime: 0
    }
  }

  async initializeCamera(mode = 'photo', constraints = null) {
    const mediaId = `camera_${mode}_${Date.now()}`
    
    try {
      const finalConstraints = constraints || MEDIA_CONFIG.VIDEO_CONSTRAINTS[mode]
      
      const result = await robustAsync.execute(
        async () => {
          return await this.permissionManager.requestMediaAccess(finalConstraints)
        },
        {
          timeout: MEDIA_CONFIG.TIMEOUTS.camera,
          operationType: 'camera_init',
          metadata: { mode, constraints: finalConstraints }
        }
      )

      if (!result.success) {
        throw result.error
      }

      this.activeStreams.set(mediaId, {
        stream: result.stream,
        mode,
        constraints: finalConstraints,
        startTime: Date.now()
      })

      console.log(`[MEDIA] Caméra initialisée en mode ${mode}`)
      return {
        success: true,
        mediaId,
        stream: result.stream,
        constraints: finalConstraints
      }

    } catch (error) {
      this.stats.failedCaptures++
      console.error(`[MEDIA] Échec initialisation caméra:`, error)
      throw error
    }
  }

  async capturePhoto(mediaId, options = {}) {
    const startTime = Date.now()
    const streamInfo = this.activeStreams.get(mediaId)
    
    if (!streamInfo) {
      throw new Error('Stream caméra non trouvé. Initialisez la caméra d\'abord.')
    }

    try {
      const {
        width = 1920,
        height = 1080,
        format = 'png',
        quality = 0.95,
        filters = null,
        backgroundRemoval = false,
        backgroundColor = null
      } = options

      // Créer le flux vidéo
      const video = document.createElement('video')
      video.srcObject = streamInfo.stream
      video.muted = true

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve
        video.play()
      })

      // Capturer l'image
      const canvas = this.canvasProcessor.centerCropFromVideo(
        video, width, height, width, height, filters
      )

      if (!canvas) {
        throw new Error('Échec capture canvas')
      }

      let finalCanvas = canvas

      // Suppression du fond si demandé
      if (backgroundRemoval) {
        finalCanvas = await robustAsync.execute(
          async () => {
            return this.canvasProcessor.removeBackground(canvas, options.tolerance)
          },
          {
            timeout: MEDIA_CONFIG.TIMEOUTS.processing,
            operationType: 'background_removal'
          }
        )
      }

      // Appliquer un fond si spécifié
      if (backgroundColor) {
        finalCanvas = this.canvasProcessor.composeOnBackground(
          finalCanvas, backgroundColor, width, height
        )
      }

      // Appliquer la netteté si spécifié
      if (filters && filters.sharpen) {
        finalCanvas = this.canvasProcessor.applySharpen(finalCanvas, filters.sharpen)
      }

      // Convertir en DataURL
      const dataURL = await this.canvasProcessor.canvasToDataURL(
        finalCanvas, format, quality
      )

      this.stats.successfulCaptures++
      const processingTime = Date.now() - startTime
      this.updateStats(processingTime)

      return {
        success: true,
        dataURL,
        format,
        width: finalCanvas.width,
        height: finalCanvas.height,
        processingTime,
        backgroundRemoved: backgroundRemoval
      }

    } catch (error) {
      this.stats.failedCaptures++
      console.error(`[MEDIA] Échec capture photo:`, error)
      throw error
    }
  }

  async startVideoRecording(mediaId, options = {}) {
    const streamInfo = this.activeStreams.get(mediaId)
    
    if (!streamInfo) {
      throw new Error('Stream caméra non trouvé. Initialisez la caméra d\'abord.')
    }

    try {
      const result = await this.mediaRecorder.startRecording(streamInfo.stream, options)
      
      if (result.success) {
        console.log(`[MEDIA] Enregistrement vidéo démarré`)
        
        // Configurer les callbacks
        this.mediaRecorder.onDataAvailable = options.onDataAvailable
        this.mediaRecorder.onStop = options.onStop
        this.mediaRecorder.onError = options.onError
      }

      return result

    } catch (error) {
      console.error(`[MEDIA] Échec démarrage enregistrement:`, error)
      throw error
    }
  }

  stopVideoRecording() {
    try {
      const result = this.mediaRecorder.stopRecording()
      if (result) {
        console.log(`[MEDIA] Enregistrement vidéo arrêté`)
      }
      return result
    } catch (error) {
      console.error(`[MEDIA] Erreur arrêt enregistrement:`, error)
      throw error
    }
  }

  async releaseStream(mediaId) {
    const streamInfo = this.activeStreams.get(mediaId)
    
    if (!streamInfo) {
      return false
    }

    try {
      // Arrêter l'enregistrement si en cours
      if (this.mediaRecorder.isRecording) {
        this.stopVideoRecording()
      }

      // Arrêter toutes les pistes du stream
      streamInfo.stream.getTracks().forEach(track => {
        track.stop()
      })

      this.activeStreams.delete(mediaId)
      console.log(`[MEDIA] Stream ${mediaId} libéré`)
      
      return true

    } catch (error) {
      console.error(`[MEDIA] Erreur libération stream:`, error)
      return false
    }
  }

  updateStats(processingTime) {
    const totalProcessing = this.stats.averageProcessingTime * (this.stats.successfulCaptures - 1) + processingTime
    this.stats.averageProcessingTime = Math.round(totalProcessing / this.stats.successfulCaptures)
  }

  getStats() {
    return {
      ...this.stats,
      activeStreams: this.activeStreams.size,
      recordingState: this.mediaRecorder.getRecordingState(),
      recordingDuration: this.mediaRecorder.getRecordingDuration()
    }
  }

  // Méthodes utilitaires
  async testCameraSupport() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      
      return {
        supported: true,
        videoDevices: videoDevices.length,
        audioDevices: devices.filter(device => device.kind === 'audioinput').length,
        permissions: await this.checkPermissions()
      }
    } catch (error) {
      return {
        supported: false,
        error: error.message,
        permissions: await this.checkPermissions()
      }
    }
  }

  async checkPermissions() {
    const camera = await this.permissionManager.requestPermission('camera').catch(() => ({ state: 'unknown' }))
    const microphone = await this.permissionManager.requestPermission('microphone').catch(() => ({ state: 'unknown' }))
    
    return {
      camera: camera.state,
      microphone: microphone.state
    }
  }

  // Cleanup
  destroy() {
    // Libérer tous les streams actifs
    for (const [mediaId] of this.activeStreams.keys()) {
      this.releaseStream(mediaId)
    }

    console.log('[MEDIA] RobustMediaEngine détruit')
  }
}

// ========================================
// INSTANCE GLOBALE
// ========================================

const robustMediaEngine = new RobustMediaEngine()

export default robustMediaEngine
export { MEDIA_CONFIG, PermissionManager, CanvasProcessor, MediaRecorder, RobustMediaEngine }
