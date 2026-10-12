import React from 'react';
import { Composition } from 'remotion';
import { ReelComposition } from './ReelComposition';
import '../app/globals.css';

// Definimos el tipo de los parámetros de entrada que Remotion recibirá del backend
export interface ReelProps {
  compositionId: string;
  scenes: {
    id: string;
    duration: number; // en segundos
    title: string;
    subtitle: string;
    highlightWords: string[];
    gradientBg: string;
    textColor: string;
    accentColor: string;
    imagePrompt?: string;
    bgImageUrl?: string;
    bgVideoUrl?: string;
  }[];
  bgVideoUrl?: string;
  audioUrl?: string;
  wordTimestamps?: { word: string; start: number; end: number }[];
  totalDurationInFrames: number;
  showWatermark?: boolean;
  logoUrl?: string;
  businessName?: string;
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<ReelProps>
        id="SantisoftReel"
        component={ReelComposition}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        calculateMetadata={({ props }) => {
          const rawFrames = props?.totalDurationInFrames || 300;
          const durationInFrames = Math.min(300, Math.max(90, rawFrames));
          return {
            durationInFrames,
          };
        }}
        defaultProps={{
          compositionId: "default",
          totalDurationInFrames: 300,
          scenes: [
            {
              id: "scene_1",
              duration: 10,
              title: "GENERANDO VIDEO...",
              subtitle: "Por favor espere",
              highlightWords: ["VIDEO"],
              gradientBg: "from-slate-950 via-purple-950 to-indigo-950",
              textColor: "#FFFFFF",
              accentColor: "#F59E0B",
            }
          ]
        }}
      />
    </>
  );
};
