import React from 'react';
import { Composition, registerRoot } from 'remotion';
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
  }[];
  audioUrl?: string; // MP3 de ElevenLabs
  totalDurationInFrames: number;
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SantisoftReel"
        component={ReelComposition}
        durationInFrames={360} // Valor por defecto, se sobreescribe al renderizar
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          compositionId: "default",
          totalDurationInFrames: 360,
          scenes: [
            {
              id: "scene_1",
              duration: 12,
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

registerRoot(RemotionRoot);
