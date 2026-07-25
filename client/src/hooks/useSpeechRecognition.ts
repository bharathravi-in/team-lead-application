import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionHookResult {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  error: string | null;
}

export const useSpeechRecognition = (): SpeechRecognitionHookResult => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      : null;

  const isSupported = Boolean(SpeechRecognition);

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentFinal = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        if (result.isFinal) {
          currentFinal += result[0].transcript + ' ';
        } else {
          currentInterim += result[0].transcript;
        }
      }

      if (currentFinal) {
        setTranscript(prev => (prev + ' ' + currentFinal).trim());
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access denied. Please grant permission in browser settings.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      // Re-start if still marked listening (continuous session)
      if (isListening && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, [SpeechRecognition, isListening]);

  const startListening = useCallback(() => {
    setError(null);
    if (!recognitionRef.current) {
      setError('Speech Recognition is not supported in this browser.');
      return;
    }
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err: any) {
      console.error('Failed to start listening:', err);
      // Already running?
      setIsListening(true);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error
  };
};
