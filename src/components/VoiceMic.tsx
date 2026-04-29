"use client";

import React from 'react';
import { useSpeechToText } from '../hooks/useSpeechToText';

interface VoiceMicProps {
    onResult: (text: string) => void;
    className?: string;
}

export default function VoiceMic({ onResult, className = "" }: VoiceMicProps) {
    const { isListening, startListening, stopListening, isSupported } = useSpeechToText({
        onFinalTranscript: (text) => {
            onResult(text);
        }
    });

    if (!isSupported) return null;

    return (
        <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`relative flex items-center justify-center transition-all duration-300 ${isListening ? 'text-rose-500 scale-110' : 'text-slate-400 hover:text-indigo-600'} ${className}`}
            title={isListening ? "Detener grabación" : "Dictar por voz"}
        >
            {isListening && (
                <span className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping"></span>
            )}
            <svg 
                className={`w-5 h-5 relative z-10 ${isListening ? 'animate-pulse' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
            >
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" 
                />
                <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M19 10v1a7 7 0 01-14 0v-1m14 0a7 7 0 00-7 7m0 0a7 7 0 00-7-7m7 7v4m0 0H8m4 0h4" 
                />
            </svg>
        </button>
    );
}
