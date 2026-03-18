import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPCMBlob, decodeBase64, decodeAudioData } from '../services/utils';
import { PersonaManager } from '../services/core'; // IMPORTING ISOLATION CORE
import { Mic, MicOff, Activity, Radio, AlertCircle, Sparkles } from 'lucide-react';

const API_KEY = process.env.API_KEY || '';

const LiveAvatar: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // GET NOVA PERSONA (ISOLATED FROM ARQUI)
  const persona = PersonaManager.get('NOVA');

  const cleanup = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch(e) {}
    }
    sourcesRef.current.forEach(source => { try { source.stop(); } catch (e) {} });
    sourcesRef.current.clear();
    if (audioContextRef.current) audioContextRef.current.close();
    if (inputContextRef.current) inputContextRef.current.close();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());

    audioContextRef.current = null;
    inputContextRef.current = null;
    streamRef.current = null;
    sessionRef.current = null;
    
    setIsConnected(false);
    setStatus('idle');
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  const startSession = async () => {
    try {
      setStatus('connecting');
      setErrorMessage('');
      
      const ai = new GoogleGenAI({ apiKey: API_KEY });

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser audio input not supported.");
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        const msg = err.message || '';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            throw new Error("Microphone permission denied.");
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError' || msg.includes('Requested device not found')) {
            throw new Error("No microphone found.");
        } else {
            throw new Error("Mic Error: " + msg);
        }
      }
      
      streamRef.current = stream;

      // Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      const inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      inputContextRef.current = inputAudioContext;
      
      const source = inputAudioContext.createMediaStreamSource(stream);
      const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
      
      nextStartTimeRef.current = 0;

      // Connect to Gemini Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: persona.voice } }, // Uses 'Zephyr' for Nova
          },
          systemInstruction: persona.instruction, // Uses Nova's specific prompt
        },
        callbacks: {
            onopen: () => {
                setStatus('active');
                setIsConnected(true);
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createPCMBlob(inputData);
                    sessionPromise.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio) {
                    setIsSpeaking(true);
                    nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                    const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), outputAudioContext, 24000, 1);
                    const sourceNode = outputAudioContext.createBufferSource();
                    sourceNode.buffer = audioBuffer;
                    sourceNode.connect(outputNode);
                    sourceNode.addEventListener('ended', () => {
                        sourcesRef.current.delete(sourceNode);
                        if (sourcesRef.current.size === 0) setIsSpeaking(false);
                    });
                    sourceNode.start(nextStartTimeRef.current);
                    nextStartTimeRef.current += audioBuffer.duration;
                    sourcesRef.current.add(sourceNode);
                }
                if (message.serverContent?.interrupted) {
                    sourcesRef.current.forEach(s => s.stop());
                    sourcesRef.current.clear();
                    nextStartTimeRef.current = 0;
                    setIsSpeaking(false);
                }
            },
            onclose: () => {
                setStatus('idle');
                setIsConnected(false);
            },
            onerror: (err) => {
                console.error("Session Error:", err);
            }
        }
      });
      
      sessionRef.current = await sessionPromise;

    } catch (e: any) {
      console.error("Failed to connect:", e);
      setErrorMessage(e.message || "Connection failed");
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(188,19,254,0.1)]">
        
        {/* Visualizer Circle - Uses Nova's Colors (Purple/Pink) instead of Arqui's Blue */}
        <div className={`relative w-64 h-64 mb-8 flex items-center justify-center rounded-full transition-all duration-500 ${isSpeaking ? 'scale-110 shadow-[0_0_80px_#bc13fe]' : 'shadow-[0_0_20px_rgba(255,255,255,0.1)]'}`}>
            <div className={`absolute inset-0 rounded-full border-4 border-dashed border-neon-purple ${status === 'connecting' ? 'animate-spin' : ''}`}></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-gray-900 to-black flex items-center justify-center overflow-hidden">
                {status === 'active' ? (
                     <div className="w-full h-16 flex items-center justify-center gap-2">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className={`w-3 bg-neon-pink rounded-full transition-all duration-100 ${isSpeaking ? 'animate-[pulse_0.5s_ease-in-out_infinite]' : 'h-2'}`} style={{ height: isSpeaking ? `${Math.random() * 40 + 10}px` : '4px', animationDelay: `${i * 0.1}s` }} />
                        ))}
                     </div>
                ) : (
                    <Sparkles className="w-16 h-16 text-gray-600" />
                )}
            </div>
        </div>

        <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-neon-pink">
            {persona.name} AI
        </h2>
        <p className="text-gray-400 mb-8 text-center max-w-md">
            Creative Companion & Digital Muse.
        </p>

        {status === 'error' && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 max-w-md animate-pulse">
                <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
                <span className="text-sm font-medium">{errorMessage}</span>
            </div>
        )}

        {!isConnected ? (
            <button
                onClick={startSession}
                disabled={status === 'connecting'}
                className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-pink opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-2 z-10 group-hover:text-white">
                    <Mic size={24} />
                    <span>{status === 'connecting' ? 'Awakening Nova...' : 'Start Voice Chat'}</span>
                </div>
            </button>
        ) : (
            <button
                onClick={cleanup}
                className="px-8 py-4 bg-red-500/20 text-red-500 border border-red-500 rounded-full font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
                <MicOff size={24} />
                <span>Disconnect</span>
            </button>
        )}
        
        {isConnected && (
            <div className="mt-6 flex items-center gap-2 text-xs text-neon-purple animate-pulse">
                <Radio size={12} />
                NOVA LIVE CONNECTION
            </div>
        )}
    </div>
  );
};

export default LiveAvatar;
