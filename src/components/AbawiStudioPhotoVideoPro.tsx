/**
 * ABAWI Smart Office - Studio Photo & Vidéo Pro
 * AI Identity & Corporate Studio avec filtres premium et outils avancés
 */

import React, { useState, useRef, useEffect } from 'react';
import robustMediaEngine from '../lib/RobustMediaEngine';
import productionErrorHandler from '../lib/ProductionErrorHandler';

// Icônes SVG inline pour éviter les dépendances externes
const Camera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const Video = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>
);

const Sparkles = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const SlidersHorizontal = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="21" y1="12" x2="14" y2="12"/>
    <line x1="10" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="6" x2="16" y2="6"/>
    <line x1="8" y1="6" x2="3" y2="6"/>
    <line x1="21" y1="18" x2="16" y2="18"/>
    <line x1="8" y1="18" x2="3" y2="18"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const Wand2 = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 8l2 2"/>
    <path d="M3 20l5-5.5"/>
    <path d="M20.5 6.5l-16 16"/>
    <path d="M6 12l2 2"/>
    <path d="M10 8l2 2"/>
  </svg>
);

const Download = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const Share2 = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const Palette = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="13.5" cy="6.5" r=".5"/>
    <circle cx="17.5" cy="10.5" r=".5"/>
    <circle cx="8.5" cy="7.5" r=".5"/>
    <circle cx="6.5" cy="12.5" r=".5"/>
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
  </svg>
);

const Monitor = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);

const ScanFace = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <circle cx="8" cy="8" r="2"/>
    <circle cx="16" cy="8" r="2"/>
    <path d="M9 14s1.5 2 4 2 4-2 4-2"/>
  </svg>
);

const Crop = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/>
    <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>
  </svg>
);

const Layers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);

const Zap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const filters = [
  "Auto Pro",
  "Studio Premium", 
  "Portrait HD",
  "Corporate",
  "Noir & Blanc",
  "LinkedIn Pro",
  "Visa UE",
  "Admin Sénégal",
];

const exportsList = [
  "PNG HD",
  "JPG Optimisé", 
  "PDF Identité",
  "Format Visa",
  "Format LinkedIn",
  "Format WhatsApp",
];

const aiTools = [
  {
    title: "Suppression de fond IA",
    icon: Layers,
    desc: "Découpe automatique ultra propre avec fond transparent ou fond couleur.",
  },
  {
    title: "Correction visage intelligente",
    icon: ScanFace,
    desc: "Lissage naturel, correction lumière, netteté premium sans effet fake.",
  },
  {
    title: "Recadrage intelligent",
    icon: Crop,
    desc: "Format automatique identité, visa, passeport, CV, réseaux sociaux.",
  },
  {
    title: "Studio Branding",
    icon: Palette,
    desc: "Ajout logo, signature, watermark et identité visuelle professionnelle.",
  },
];

// Composants UI simplifiés
interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'outline';
  style?: React.CSSProperties;
  disabled?: boolean;
}

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface ProgressProps {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}

const Card = ({ children, className = "", style = {} }: CardProps) => (
  <div className={`card ${className}`} style={{
    background: '#081224',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '28px',
    ...style
  }}>
    {children}
  </div>
);

const CardContent = ({ children, className = "", style = {} }: CardContentProps) => (
  <div className={`card-content ${className}`} style={{
    padding: '24px',
    ...style
  }}>
    {children}
  </div>
);

const Button = ({ children, onClick, className = "", variant = "default", style = {} }: ButtonProps) => {
  const baseStyle = {
    padding: '12px 24px',
    borderRadius: '16px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    ...style
  };

  const variants: Record<string, React.CSSProperties> = {
    default: {
      background: '#06b6d4',
      color: '#000',
    },
    outline: {
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#fff',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    }
  };

  return (
    <button 
      onClick={onClick}
      className={`button ${className}`}
      style={{...baseStyle, ...variants[variant as keyof typeof variants]}}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className = "", style = {} }: BadgeProps) => (
  <span className={`badge ${className}`} style={{
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    background: 'rgba(6, 182, 212, 0.1)',
    color: '#67e8f9',
    border: '1px solid rgba(6, 182, 212, 0.2)',
    display: 'inline-block',
    ...style
  }}>
    {children}
  </span>
);

const Progress = ({ value, className = "", style = {} }: ProgressProps) => (
  <div className={`progress ${className}`} style={{
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    ...style
  }}>
    <div style={{
      width: `${value}%`,
      height: '100%',
      background: '#06b6d4',
      borderRadius: '4px',
      transition: 'width 0.3s ease'
    }} />
  </div>
);

export default function AbawiStudioPhotoVideoPro() {
  const [mode, setMode] = useState("photo");
  const [selectedFilter, setSelectedFilter] = useState("Auto Pro");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [brightness, setBrightness] = useState(92);
  const [sharpness, setSharpness] = useState(84);
  const [faceCorrection, setFaceCorrection] = useState(76);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isCameraActive && videoRef.current) {
      startCamera();
    } else {
      stopCamera();
    }
    // Wrap async stopCamera in a void-returning fn — useEffect cleanups must
    // not return Promises (they would not be awaited and could leak).
    return () => { void stopCamera(); };
  }, [isCameraActive]);

  const startCamera = async () => {
    try {
      const result = await robustMediaEngine.initializeCamera(mode === 'photo' ? 'photo' : 'video');
      
      if (result.success) {
        if (videoRef.current) {
          videoRef.current.srcObject = result.stream;
        }
        setIsCameraActive(true);
      } else {
        // RobustMediaEngine returns { success: false, error?: { message } } on
        // failure, but the union is not exposed in its declared return type.
        throw new Error((result as any).error?.message || 'Échec initialisation caméra');
      }
    } catch (err) {
      await productionErrorHandler.handleUserActionError(err, 'start_camera', {
        component: 'AbawiStudioPhotoVideoPro',
        showToast: () => console.error('Erreur caméra:', err)
      });
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    try {
      // Libérer tous les streams actifs via RobustMediaEngine
      const stats = robustMediaEngine.getStats();
      if (stats.activeStreams > 0) {
        // Nettoyer tous les médias actifs
        if (typeof robustMediaEngine.destroy === 'function') {
          robustMediaEngine.destroy();
        }
      }
      
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      setIsCameraActive(false);
    } catch (err) {
      await productionErrorHandler.handleUserActionError(err, 'stop_camera', {
        component: 'AbawiStudioPhotoVideoPro',
        showToast: () => console.error('Erreur arrêt caméra:', err)
      });
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) throw new Error('Contexte canvas non disponible');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Utiliser RobustMediaEngine pour la capture
      const captureResult = await robustMediaEngine.capturePhoto('camera', {
        width: canvas.width,
        height: canvas.height,
        filters: {
          brightness: brightness - 100,
          contrast: 0,
          saturate: 0,
          warmth: 0,
          sharpen: sharpness / 100
        }
      });
      
      if (captureResult.success) {
        // Télécharger l'image
        const a = document.createElement('a');
        a.href = captureResult.dataURL;
        a.download = `abawi-studio-${mode}-${Date.now()}.png`;
        a.click();
      } else {
        // Same union-not-exposed pattern as startCamera() above.
        throw new Error((captureResult as any).error || 'Échec capture photo');
      }
    } catch (err) {
      await productionErrorHandler.handleUserActionError(err, 'capture_photo', {
        component: 'AbawiStudioPhotoVideoPro',
        showToast: () => console.error('Erreur capture photo:', err)
      });
    }
  };

  const applyFilter = (context: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Non-null assertions are safe here: i is bounded by data.length and
    // i+1, i+2 stay within RGBA stride (data.length is a multiple of 4).
    switch (selectedFilter) {
      case "Noir & Blanc":
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i]! * 0.299 + data[i + 1]! * 0.587 + data[i + 2]! * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        break;
      case "Corporate":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i]! * 1.1);
          data[i + 1] = Math.min(255, data[i + 1]! * 1.05);
          data[i + 2] = Math.min(255, data[i + 2]! * 0.95);
        }
        break;
      case "LinkedIn Pro":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i]! * 1.15);
          data[i + 1] = Math.min(255, data[i + 1]! * 1.1);
          data[i + 2] = Math.min(255, data[i + 2]! * 1.05);
        }
        break;
    }

    // Appliquer les réglages de luminosité
    const brightnessFactor = brightness / 100;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, data[i]! * brightnessFactor);
      data[i + 1] = Math.min(255, data[i + 1]! * brightnessFactor);
      data[i + 2] = Math.min(255, data[i + 2]! * brightnessFactor);
    }
    
    context.putImageData(imageData, 0, 0);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#04060b', color: 'white', padding: '20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', marginBottom: '32px' }}>
        {/* Header */}
        <div style={{
          borderRadius: '28px',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          background: 'linear-gradient(to right, #081428, #07101d)',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <Badge style={{ marginBottom: '16px' }}>
            ABAWI STUDIO PRO
          </Badge>

          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: 'bold', 
            lineHeight: '1.2',
            marginBottom: '16px',
            maxWidth: '800px'
          }}>
            Studio Photo & Vidéo Pro - AI Identity & Corporate Studio
          </h1>

          <p style={{ 
            color: '#d1d5db', 
            fontSize: '1.125rem',
            lineHeight: '1.6',
            marginBottom: '24px',
            maxWidth: '700px'
          }}>
            Plus qu'un simple studio : photo identité, vidéo pro, suppression de fond,
            retouche IA, branding corporate et export premium multi-formats.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button
              onClick={() => setMode("photo")}
              style={{ 
                background: mode === "photo" ? '#06b6d4' : 'rgba(255, 255, 255, 0.05)',
                color: mode === "photo" ? '#000' : '#fff',
                border: mode === "photo" ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Camera />
              Mode Photo
            </Button>

            <Button
              onClick={() => setMode("video")}
              style={{ 
                background: mode === "video" ? '#06b6d4' : 'rgba(255, 255, 255, 0.05)',
                color: mode === "video" ? '#000' : '#fff',
                border: mode === "video" ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Video />
              Mode Vidéo
            </Button>

            <Button variant="outline" onClick={() => {}}>
              <Sparkles />
              IA Premium
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.2fr 0.8fr', 
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Preview Section */}
          <Card>
            <CardContent>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Aperçu Studio</h2>
                <Badge>Live Preview</Badge>
              </div>

              <div style={{
                borderRadius: '24px',
                minHeight: '420px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                background: '#030814',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {isCameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '16px'
                    }}
                  />
                ) : (
                  <>
                    {mode === "photo" ? (
                      <>
                        <div style={{ width: '64px', height: '64px', color: '#06b6d4', marginBottom: '16px' }}>
                          <Camera />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
                          Studio Photo Professionnel
                        </h3>
                        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
                          Photo identité, visa, CV, LinkedIn, corporate et documents administratifs.
                        </p>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '64px', height: '64px', color: '#06b6d4', marginBottom: '16px' }}>
                          <Video />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
                          Studio Vidéo Premium
                        </h3>
                        <p style={{ color: '#6b7280', maxWidth: '400px' }}>
                          Capsules vidéo, pitch pro, reels business, contenu WhatsApp et réseaux.
                        </p>
                      </>
                    )}
                  </>
                )}
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
                <Button 
                  onClick={() => setIsCameraActive(!isCameraActive)}
                  style={{ background: '#06b6d4', color: '#000' }}
                >
                  <Monitor />
                  {isCameraActive ? 'Arrêter' : 'Activer'} Caméra
                </Button>
                
                {isCameraActive && (
                  <Button onClick={capturePhoto} style={{ background: '#06b6d4', color: '#000' }}>
                    <Camera />
                    Capturer
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => {}}>
                  <Download />
                  Export HD
                </Button>
                <Button variant="outline" onClick={() => {}}>
                  <Share2 />
                  Partager
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Controls Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card>
              <CardContent>
                <h2 style={{ fontWeight: '600', marginBottom: '16px' }}>Filtres Premium</h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '12px'
                }}>
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      style={{
                        borderRadius: '16px',
                        padding: '12px 16px',
                        border: `1px solid ${selectedFilter === filter ? 'rgba(6, 182, 212, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                        background: selectedFilter === filter ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                        color: selectedFilter === filter ? '#67e8f9' : '#d1d5db',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent style={{ paddingBottom: '24px' }}>
                <h2 style={{ fontWeight: '600', marginBottom: '20px' }}>Réglages IA</h2>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    <span>Luminosité</span>
                    <span>{brightness}%</span>
                  </div>
                  <Progress value={brightness} />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    <span>Netteté</span>
                    <span>{sharpness}%</span>
                  </div>
                  <Progress value={sharpness} />
                </div>

                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}>
                    <span>Correction visage</span>
                    <span>{faceCorrection}%</span>
                  </div>
                  <Progress value={faceCorrection} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Tools Section */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px' }}>
            Outils IA Professionnels
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '16px'
          }}>
            {aiTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Card key={tool.title}>
                  <CardContent>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '16px',
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{ width: '20px', height: '20px', color: '#06b6d4' }}>
                        <Icon />
                      </div>
                    </div>
                    <h3 style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '8px' }}>
                      {tool.title}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                      {tool.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Export Section */}
        <Card style={{
          background: 'linear-gradient(to right, rgba(6, 182, 212, 0.1), transparent)',
          border: '1px solid rgba(6, 182, 212, 0.2)'
        }}>
          <CardContent>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'flex-start',
              gap: '24px',
              flexDirection: 'column'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '8px' }}>
                  Export Corporate Premium
                </h2>
                <p style={{ color: '#d1d5db', maxWidth: '600px', lineHeight: '1.6' }}>
                  Formats optimisés pour identité, visa, LinkedIn, CV premium,
                  profils administratifs et diffusion WhatsApp/Instagram.
                </p>
              </div>

              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px',
                maxWidth: '400px'
              }}>
                {exportsList.map((item) => (
                  <Badge
                    key={item}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#d1d5db'
                    }}
                  >
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
