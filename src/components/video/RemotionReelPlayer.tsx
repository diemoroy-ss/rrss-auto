"use client";

import React, { useState, useEffect, useRef } from "react";
import LogoMark from "../LogoMark";
import { VideoComposition, VideoScene } from "../../lib/video-poc-service";

interface RemotionReelPlayerProps {
  composition: VideoComposition;
  onSceneChange?: (sceneIndex: number) => void;
}

export default function RemotionReelPlayer({ composition, onSceneChange }: RemotionReelPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [useVoiceSpeech, setUseVoiceSpeech] = useState<boolean>(true);

  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const scenes = composition.scenes || [];
  const totalDuration = composition.totalDuration || scenes.reduce((acc, s) => acc + s.duration, 0) || 12;

  // Encontrar escena activa según currentTime
  let accumulatedTime = 0;
  let currentSceneIndex = 0;
  let sceneProgress = 0; // 0 a 1 dentro de la escena activa

  for (let i = 0; i < scenes.length; i++) {
    const sceneDuration = scenes[i].duration;
    if (currentTime >= accumulatedTime && currentTime <= accumulatedTime + sceneDuration) {
      currentSceneIndex = i;
      sceneProgress = (currentTime - accumulatedTime) / sceneDuration;
      break;
    }
    accumulatedTime += sceneDuration;
  }

  if (currentTime >= totalDuration) {
    currentSceneIndex = scenes.length - 1;
    sceneProgress = 1;
  }

  const activeScene: VideoScene | undefined = scenes[currentSceneIndex] || scenes[0];

  useEffect(() => {
    if (onSceneChange) {
      onSceneChange(currentSceneIndex);
    }
  }, [currentSceneIndex, onSceneChange]);

  // Loop de Animación 60fps con requestAnimationFrame
  const animate = (time: number) => {
    if (lastTimeRef.current !== null) {
      const delta = (time - lastTimeRef.current) / 1000;
      setCurrentTime((prevTime) => {
        const nextTime = prevTime + delta;
        if (nextTime >= totalDuration) {
          setIsPlaying(false);
          return 0; // Reset al terminar
        }
        return nextTime;
      });
    }
    lastTimeRef.current = time;
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
      if (useVoiceSpeech && 'speechSynthesis' in window && currentTime === 0) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(composition.audioScript || activeScene?.subtitle || "");
        utterance.lang = "es-ES";
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      lastTimeRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (currentTime >= totalDuration) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Función para destacar palabras tipo Alex Hormozi
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
          className={`inline-block mr-1.5 transition-transform transform ${
            isHighlighted
              ? "scale-110 font-black drop-shadow-md underline decoration-4"
              : "font-extrabold opacity-95"
          }`}
          style={{
            color: isHighlighted ? accentColor : "#FFFFFF",
            textDecorationColor: isHighlighted ? accentColor : "transparent",
          }}
        >
          {word}
        </span>
      );
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* CONTENEDOR PRINCIPAL REEL 9:16 */}
      <div className="relative w-[310px] sm:w-[340px] h-[550px] sm:h-[600px] rounded-[36px] overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-950 flex flex-col justify-between p-5 text-white">
        
        {/* FONDO DINÁMICO EN DEGRADADO */}
        {/* FONDO DE IMAGEN DINÁMICA CON EFECTO KEN BURNS (ANIMACIÓN DE ZOOM/MOVIMIENTO) */}
        {activeScene?.bgImageUrl ? (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <img
              key={activeScene.bgImageUrl}
              src={activeScene.bgImageUrl}
              alt="Fondo de escena"
              className="w-full h-full object-cover transition-transform duration-75 ease-linear"
              style={{
                transform: `scale(${1 + sceneProgress * 0.18})`,
              }}
            />
            {/* Máscara sutil para máxima claridad de imagen manteniendo contraste en texto */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-black/20 to-slate-950/30" />
          </div>
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-b ${
              activeScene?.gradientBg || "from-slate-950 via-purple-950 to-indigo-950"
            } transition-all duration-700 ease-in-out`}
          />
        )}

        {/* PATRÓN ABSTRACTO DE FONDO ANIMADO */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#rgba(255,255,255,0.15)_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* 1. TOP BAR - BRAND WATERMARK & SCENE BADGE */}
        <div className="relative z-10 flex items-center justify-between gap-2 pt-2">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <LogoMark size={20} />
            <span className="text-[11px] font-black tracking-wider text-slate-100 uppercase">SANTISOFT AI</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-200 border border-white/15">
            Escena {currentSceneIndex + 1}/{scenes.length}
          </div>
        </div>

        {/* 2. CENTER CONTENT - TITLES & HORMOZI SUBTITLES */}
        <div className="relative z-10 my-auto text-center px-3 space-y-5">
          {/* TÍTULO PRINCIPAL DE LA ESCENA */}
          <div className="inline-block px-3 py-1 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 text-[11px] font-extrabold uppercase tracking-widest text-slate-300 shadow-lg">
            {activeScene?.title || "ESCIENA REEL"}
          </div>

          {/* TEXTO ANAMÓRFICO GIGANTE (CAPTION HORMOZI) */}
          <div className="text-2xl sm:text-3xl leading-tight font-black tracking-tight drop-shadow-2xl">
            {renderHormoziText(
              activeScene?.subtitle || "",
              activeScene?.highlightWords,
              activeScene?.accentColor
            )}
          </div>
        </div>

        {/* 3. BOTTOM BAR - PROGRESS & PLAYBACK TIME */}
        <div className="relative z-10 space-y-3 pb-2">
          {/* BARRA DE PROGRESO INFERIOR */}
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-indigo-400 to-emerald-400 transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${(currentTime / totalDuration) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-300 px-1">
            <span>{currentTime.toFixed(1)}s</span>
            <span>{totalDuration.toFixed(1)}s</span>
          </div>
        </div>

        {/* OVERLAY DE PAUSA */}
        {!isPlaying && (
          <div
            onClick={handleTogglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center cursor-pointer z-20 transition-all"
          >
            <div className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white text-2xl shadow-2xl transition-transform hover:scale-110">
              ▶
            </div>
          </div>
        )}
      </div>

      {/* CONTROLES DEL REPRODUCTOR */}
      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
        <button
          onClick={handleTogglePlay}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md flex items-center gap-1.5"
        >
          <span>{isPlaying ? "⏸️ Pausar" : "▶️ Reproducir"}</span>
        </button>

        <button
          onClick={handleRestart}
          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all border border-slate-300"
        >
          <span>🔄 Reiniciar</span>
        </button>

        <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 pl-2 border-l border-slate-200">
          <input
            type="checkbox"
            checked={useVoiceSpeech}
            onChange={(e) => setUseVoiceSpeech(e.target.checked)}
            className="rounded text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-[11px]">Voz en Off (Locución)</span>
        </label>
      </div>
    </div>
  );
}
