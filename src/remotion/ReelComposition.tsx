import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, Img, OffthreadVideo } from 'remotion';
import { ReelProps } from './Root';

export const ReelComposition: React.FC<ReelProps> = ({ 
  scenes = [], 
  bgVideoUrl = '', 
  audioUrl = '', 
  showWatermark = false,
  logoUrl = '',
  businessName = ''
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Encontrar la escena actual basada en el frame
  let accumulatedFrames = 0;
  let currentSceneIndex = 0;
  let sceneProgress = 0;

  const validScenes = scenes.length > 0 ? scenes : [{
    id: "scene_default",
    duration: 10,
    title: "REEL EXCLUSIVO",
    subtitle: "Solución Inteligente para tu Negocio",
    highlightWords: ["INTELIGENTE", "NEGOCIO"],
    gradientBg: "linear-gradient(135deg, #020617 0%, #1e1b4b 50%, #0f172a 100%)",
    textColor: "#FFFFFF",
    accentColor: "#F59E0B",
  }];

  let found = false;

  for (let i = 0; i < validScenes.length; i++) {
    const sceneDurationFrames = (validScenes[i].duration || 4) * fps;
    if (frame >= accumulatedFrames && frame < accumulatedFrames + sceneDurationFrames) {
      currentSceneIndex = i;
      sceneProgress = (frame - accumulatedFrames) / sceneDurationFrames;
      found = true;
      break;
    }
    accumulatedFrames += sceneDurationFrames;
  }

  // Si nos pasamos, usar la última
  if (!found && validScenes.length > 0) {
    currentSceneIndex = validScenes.length - 1;
    sceneProgress = 1;
  }

  const activeScene = validScenes[currentSceneIndex] || validScenes[0];

  const renderHormoziText = (text: string = "", highlightWords: string[] = [], accentColor: string = "#FF6B00") => {
    if (!text) return null;
    const words = text.split(" ");
    const upperHighlights = (highlightWords || []).map((w) => (w || "").toUpperCase());

    return words.map((word, idx) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "").toUpperCase();
      const isHighlighted = upperHighlights.includes(cleanWord);

      return (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            marginRight: 14,
            fontWeight: 900,
            color: isHighlighted ? accentColor : '#FFFFFF',
            textDecoration: isHighlighted ? `underline 6px ${accentColor}` : 'none',
            transform: isHighlighted ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.2s ease',
            textShadow: isHighlighted 
              ? `0 0 20px ${accentColor}88, 0 4px 16px rgba(0,0,0,0.9)` 
              : '0 4px 20px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.9)'
          }}
        >
          {word}
        </span>
      );
    });
  };

  const getMotionTransform = (progress: number) => {
    // Zoom in suave constante
    return `scale(${1 + progress * 0.18})`;
  };

  return (
    <AbsoluteFill style={{ 
      backgroundColor: '#020617', 
      color: '#FFFFFF', 
      position: 'relative', 
      width: 1080, 
      height: 1920, 
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Fondo Animado, Video de Fondo o Gradiente */}
      <AbsoluteFill style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {(bgVideoUrl || activeScene?.bgVideoUrl) ? (
          <>
            <OffthreadVideo
              src={bgVideoUrl || activeScene?.bgVideoUrl}
              style={{
                width: 1080,
                height: 1920,
                objectFit: 'cover'
              }}
            />
            {/* Sombreado de alto contraste para lectura perfecta */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(2,6,23,0.6) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.4) 65%, rgba(2,6,23,0.85) 100%)'
            }} />
          </>
        ) : activeScene?.bgImageUrl ? (
          <>
            <Img
              src={activeScene.bgImageUrl}
              style={{
                width: 1080,
                height: 1920,
                objectFit: 'cover',
                transform: getMotionTransform(sceneProgress),
                transformOrigin: 'center center'
              }}
            />
            {/* Sombreado de alto contraste para lectura perfecta */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(180deg, rgba(2,6,23,0.7) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.5) 70%, rgba(2,6,23,0.85) 100%)'
            }} />
          </>
        ) : (
          <div style={{
            width: 1080,
            height: 1920,
            background: activeScene?.gradientBg || 'linear-gradient(180deg, #020617 0%, #312e81 50%, #0f172a 100%)'
          }} />
        )}
      </AbsoluteFill>

      {/* Logo personalizado del cliente o Marca de agua Santisoft (condicional) */}
      {(logoUrl || showWatermark) && (
        <div style={{
          position: 'absolute',
          top: 60,
          left: 48,
          zIndex: 30,
          backgroundColor: 'rgba(0,0,0,0.75)',
          padding: logoUrl ? '10px 24px' : '14px 28px',
          borderRadius: 999,
          border: '1.5px solid rgba(255,255,255,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)'
        }}>
          {logoUrl ? (
            <>
              <Img
                src={logoUrl}
                style={{
                  height: 38,
                  maxWidth: 120,
                  objectFit: 'contain'
                }}
              />
              {businessName && (
                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: '0.1em', color: '#F8FAFC', textTransform: 'uppercase' }}>
                  {businessName}
                </span>
              )}
            </>
          ) : (
            <>
              <span style={{ fontSize: 26 }}>⚡</span>
              <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.15em', color: '#F8FAFC', textTransform: 'uppercase' }}>
                SANTISOFT
              </span>
            </>
          )}
        </div>
      )}

      {/* Título de la escena en badge (Posicionado en Safe Zone Superior) */}
      <div style={{
        position: 'absolute',
        top: showWatermark ? 220 : 160,
        left: 0,
        right: 0,
        zIndex: 30,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 48px'
      }}>
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: '14px 32px',
          borderRadius: 20,
          border: '2px solid rgba(255,255,255,0.3)',
          fontSize: 28,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: '#E2E8F0',
          boxShadow: '0 12px 32px rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)'
        }}>
          {activeScene?.title || "REEL EXCLUSIVO"}
        </div>
      </div>

      {/* Subtítulo dinámico con palabras destacadas (Posicionado en Safe Zone Inferior TikTok/Reels) */}
      <div style={{
        position: 'absolute',
        bottom: 420,
        left: 0,
        right: 0,
        zIndex: 30,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 48px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: 48,
          fontWeight: 900,
          lineHeight: 1.25,
          padding: '24px 32px',
          backgroundColor: 'rgba(0,0,0,0.75)',
          borderRadius: 32,
          border: '1.5px solid rgba(255,255,255,0.2)',
          backdropFilter: 'blur(12px)',
          maxWidth: 980,
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)'
        }}>
          {renderHormoziText(activeScene?.subtitle || "Descubre cómo escalar tu negocio", activeScene?.highlightWords, activeScene?.accentColor || "#F59E0B")}
        </div>
      </div>

      {/* Barra de Progreso (Ubicada justo debajo del subtítulo en Safe Zone) */}
      <div style={{
        position: 'absolute',
        bottom: 370,
        left: 64,
        right: 64,
        height: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 999,
        overflow: 'hidden',
        zIndex: 30,
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
      }}>
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, sceneProgress * 100))}%`,
            background: 'linear-gradient(90deg, #3B82F6 0%, #06B6D4 100%)',
            borderRadius: 999,
            transition: 'width 0.05s linear'
          }}
        />
      </div>

      {/* Pista de Audio de ElevenLabs */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};

