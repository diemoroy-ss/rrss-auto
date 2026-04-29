"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechToTextOptions {
    onTranscript?: (text: string) => void;
    onFinalTranscript?: (text: string) => void;
    language?: string;
    continuous?: boolean;
}

export function useSpeechToText({
    onTranscript,
    onFinalTranscript,
    language = 'es-ES',
    continuous = false
}: UseSpeechToTextOptions = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = continuous;
            recognition.interimResults = true;
            recognition.lang = language;

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                const currentTranscript = finalTranscript || interimTranscript;
                setTranscript(currentTranscript);
                
                if (onTranscript) onTranscript(currentTranscript);
                if (finalTranscript && onFinalTranscript) onFinalTranscript(finalTranscript);
            };

            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        }
    }, [language, continuous, onTranscript, onFinalTranscript]);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        isSupported
    };
}
