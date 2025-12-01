'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';


interface AudioRecorderProps {
  onTranscription: (transcription: string) => void;
  disabled?: boolean;
}

const AudioRecorder = ({ onTranscription, disabled = false }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // No initialization of speech recognition needed since we're using backend transcription
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Request microphone permission
  useEffect(() => {
    const requestPermission = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        if (permissionStatus.state === 'granted') {
          setPermissionGranted(true);
        } else {
          // We'll request permission when the user clicks the record button
          setPermissionGranted(false);
        }
      } catch (error) {
        console.warn('Permissions API not supported, will request on record');
        // Fallback to requesting on record attempt
        setPermissionGranted(false);
      }
    };

    requestPermission();
  }, []);

  const startRecording = async () => {
    if (disabled) return;

    try {
      // Request microphone access if not already granted
      if (!permissionGranted) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermissionGranted(true);
        stream.getTracks().forEach(track => track.stop()); // Stop immediately after permission check
      }

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize MediaRecorder with a specific MIME type that works well with Whisper API
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob - using webm format which is well supported
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Audio blob created, size:', audioBlob.size, 'type:', audioBlob.type);

        // Start transcription
        startTranscription(audioBlob);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start recording timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('No se pudo acceder al micrófono. Por favor, asegúrate de haber concedido permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const startTranscription = async (audioBlob: Blob) => {
    setIsProcessing(true);

    // Never use Web Speech API for recorded audio - only for real-time input
    // Instead, send the recorded audio to our backend for transcription

    try {
      // Create FormData with the audio blob
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');

      console.log('Sending audio to transcribe endpoint...');
      // Send to backend transcription endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/transcribe`, {
        method: 'POST',
        body: formData,
      });
      console.log('Response received:', response.status);

      if (response.ok) {
        const data = await response.json();
        onTranscription(data.text);
      } else {
        const errorData = await response.json();
        console.error('Transcription error:', errorData.detail);
        onTranscription("Error en la transcripción: " + errorData.detail);
      }
    } catch (error) {
      console.error('Error during transcription request:', error);
      onTranscription("Error al conectar con el servicio de transcripción.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled || isProcessing}
        className={`p-3 rounded-full flex items-center justify-center transition-all ${
          isRecording 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-label={isRecording ? 'Detener grabación' : 'Iniciar grabación'}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>
      
      {isRecording && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs whitespace-nowrap">
          {formatTime(recordingTime)}
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;