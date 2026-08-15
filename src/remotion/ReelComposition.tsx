import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, Img } from 'remotion';
import { ReelProps } from './Root';

export const ReelComposition: React.FC<ReelProps> = ({ scenes, audioUrl }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Encontrar la escena actual basada en el frame
  let accumulatedFrames = 0;
  let currentSceneIndex = 0;
  let sceneProgress = 0;

  for (let i = 0; i < scenes.length; i++) {
    const sceneDurationFrames = scenes[i].duration * fps;
    if (frame >= accumulatedFrames && frame < accumulatedFrames + sceneDurationFrames) {
      currentSceneIndex = i;
      sceneProgress = (frame - accumulatedFrames) / sceneDurationFrames;
      break;
    }
    accumulatedFrames += sceneDurationFrames;
  }

  // Si nos pasamos, usar la última
  if (frame >= accumulatedFrames && scenes.length > 0) {
    currentSceneIndex = scenes.length - 1;
    sceneProgress = 1;
  }

  const activeScene = scenes[currentSceneIndex] || scenes[0];

  const renderHormoziText = (text: string, highlightWords: string[] = [], accentColor: string = "#FF6B00") => {
    if (!text) return null;
    const words = text.split(" ");
    const upperHighlights = highlightWords.map((w) => w.toUpperCase());

    return words.map((word, idx) => {
      const cleanWord = word.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "").toUpperCase();
      const isHighlighted = upperHighlights.includes(cleanWord);

      return (
        <span
          key={idx}
          className={`inline-block mr-2 transition-transform ${
            isHighlighted ? "font-black underline decoration-4" : "font-extrabold opacity-95"
          }`}
          style={{
            color: isHighlighted ? accentColor : "#FFFFFF",
            textDecorationColor: isHighlighted ? accentColor : "transparent",
            transform: isHighlighted ? "scale(1.1)" : "scale(1)",
          }}
        >
          {word}
        </span>
      );
    });
  };

  const getMotionTransform = (progress: number) => {
    // Zoom in suave
    return `scale(${1 + progress * 0.22})`;
  };

  return (
    <AbsoluteFill className="bg-slate-950 text-white flex flex-col justify-between p-12">
      {/* Fondo Animado o Gradiente */}
      <AbsoluteFill>
        {activeScene?.bgImageUrl ? (
          <>
            <Img
              src={activeScene.bgImageUrl}
              className="w-full h-full object-cover"
              style={{
                transform: getMotionTransform(sceneProgress),
              }}
            />
            <AbsoluteFill className="bg-gradient-to-t from-slate-950/70 via-black/20 to-slate-950/30" />
          </>
        ) : (
          <AbsoluteFill
            className={`bg-gradient-to-b ${
              activeScene?.gradientBg || "from-slate-950 via-purple-950 to-indigo-950"
            }`}
          />
        )}
      </AbsoluteFill>

      {/* Marca de agua top */}
      <div className="absolute top-10 left-10 z-10 bg-black/40 px-5 py-3 rounded-full border border-white/10 flex items-center gap-3">
         <span className="text-xl font-black tracking-wider text-slate-100 uppercase">SANTISOFT AI</span>
      </div>

      <div className="absolute top-10 right-10 z-10 bg-white/10 px-5 py-3 rounded-full text-xl font-bold text-slate-200 border border-white/15">
        Escena {currentSceneIndex + 1}/{scenes.length}
      </div>

      {/* Textos Centrales */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-12 space-y-12 text-center">
        <div className="px-6 py-2 bg-black/50 rounded-2xl border border-white/10 text-3xl font-extrabold uppercase tracking-widest text-slate-300 shadow-xl">
          {activeScene?.title || "ESCENA REEL"}
        </div>
        
        <div className="text-6xl leading-tight px-4 drop-shadow-2xl">
          {renderHormoziText(activeScene?.subtitle || "Subtítulo", activeScene?.highlightWords, activeScene?.accentColor)}
        </div>
      </div>

      {/* Progress Bar Bottom */}
      <div className="absolute bottom-10 left-10 right-10 z-10 h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
          style={{ width: `${Math.max(0, Math.min(100, sceneProgress * 100))}%` }}
        />
      </div>

      {/* Pista de Audio de ElevenLabs - Esencial para YouTube Shorts */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};
