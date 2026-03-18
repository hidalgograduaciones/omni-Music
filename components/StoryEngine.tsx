import React, { useState, useEffect, useRef } from 'react';
import { runGameTurn, generateSceneImage, generateSpeechWithGemini } from '../services/gemini';
import { GameState, Language } from '../types';
import { sfx } from '../services/audio';
import { MemoryEngine, PersonaManager } from '../services/core'; // IMPORTING CORE
import { Send, Shield, MapPin, Package, Skull, Play, Terminal, Zap, Eye, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface StoryEngineProps {
  lang: Language;
}

const StoryEngine: React.FC<StoryEngineProps> = ({ lang }) => {
  // Translations
  const t = {
    initLoc: lang === 'es' ? "Sector 4 [Subterráneo]" : "Sector 4 [Underground]",
    initInv: lang === 'es' ? ["Tarjeta ID", "Cuchillo"] : ["ID Card", "Combat Knife"],
    initNar: lang === 'es' 
        ? "SECUENCIA_INICIO: Estás bajo la lluvia ácida. Las luces de neón se reflejan en los charcos. Escuchas pasos metálicos pesados acercándose por el callejón. Tienes un cuchillo y una tarjeta ID robada. ¿Corres o te escondes?"
        : "INIT_SEQUENCE: You stand in the acid rain. The neon lights reflect in the puddles. You hear heavy metallic footsteps approaching down the alley. You have a knife and a stolen ID card. Do you run or hide?",
    visualPrompt: "Dark cyberpunk alleyway, heavy acid rain, neon lights reflection, metallic texture, first person perspective, cinematic",
    startBtn: lang === 'es' ? "INICIAR LINK" : "INITIALIZE",
    immersion: lang === 'es' ? "Inmersión" : "Immersion",
    strategy: lang === 'es' ? "Estrategia" : "Strategy",
    survival: lang === 'es' ? "Supervivencia" : "Survival",
    visualizing: lang === 'es' ? "VISUALIZANDO..." : "VISUALIZING...",
    integrity: lang === 'es' ? "Integridad" : "Suit Integrity",
    inspect: lang === 'es' ? "Inspeccionar" : "Inspect",
    gear: lang === 'es' ? "Equipo" : "Gear",
    processing: lang === 'es' ? "PROCESANDO..." : "PROCESSING...",
    enterCmd: lang === 'es' ? "TU ACCIÓN..." : "YOUR ACTION...",
    critFail: lang === 'es' ? "FALLO CRÍTICO" : "CRITICAL FAILURE",
    reboot: lang === 'es' ? "REINICIAR SISTEMA" : "REBOOT SYSTEM",
    listening: lang === 'es' ? "ESCUCHANDO..." : "LISTENING...",
    actions: {
        inspect: lang === 'es' ? "Mirar alrededor" : "Look around",
        gear: lang === 'es' ? "Revisar inventario" : "Check inventory"
    }
  };

  const [gameState, setGameState] = useState<GameState>({
      location: t.initLoc,
      health: 100,
      inventory: t.initInv,
      narrative: t.initNar,
      visualPrompt: t.visualPrompt,
      gameOver: false
  });
  
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isNarratorOn, setIsNarratorOn] = useState(false); // TTS Toggle
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load from Memory Engine on mount
  useEffect(() => {
    const savedState = MemoryEngine.get('game', 'currentState');
    if (savedState) {
        setGameState(savedState);
        setIsGameStarted(true);
        // Also try to load image from memory if we had one (simplified)
        const savedImage = MemoryEngine.get('game', 'currentImage');
        if (savedImage) setSceneImage(savedImage);
    }
  }, []);

  // Initial Scene
  useEffect(() => {
    if (isGameStarted && !sceneImage && !MemoryEngine.get('game', 'currentImage')) {
        generateImage(t.visualPrompt);
        if (isNarratorOn) {
            generateSpeechWithGemini(t.initNar, PersonaManager.get('GAME_MASTER').voice as any);
        }
    }
  }, [isGameStarted]);

  // Scroll to bottom only when history updates
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const generateImage = async (prompt: string) => {
    try {
      const img = await generateSceneImage(prompt);
      if (img) {
          setSceneImage(img);
          MemoryEngine.set('game', 'currentImage', img); // Persist Image
      }
    } catch (e) {
      console.error("Image gen failed", e);
    }
  };

  const executeTurn = async (actionText: string) => {
    if (isLoading || gameState.gameOver) return;
    
    sfx.playClick();
    setIsLoading(true);
    const tempHistory = [...history, { role: 'user', parts: [{ text: actionText }] }];
    
    try {
      const newState = await runGameTurn(tempHistory, actionText, lang);
      sfx.playSuccess();
      setGameState(newState);
      
      // ARQUI 4.0 MEMORY PERSISTENCE
      MemoryEngine.set('game', 'currentState', newState);

      const newHistory = [
          ...tempHistory, 
          { role: 'model', parts: [{ text: JSON.stringify(newState) }] } 
      ];
      setHistory(newHistory);
      
      // Narrative Voice
      if (isNarratorOn && newState.narrative) {
          generateSpeechWithGemini(newState.narrative, PersonaManager.get('GAME_MASTER').voice as any);
      }

      // Visuals
      generateImage(newState.visualPrompt);
    } catch (error) {
      sfx.playError();
      console.error("Critical Failure:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!input.trim()) return;
    executeTurn(input);
    setInput('');
  };

  const toggleMic = () => {
      if (isListening) {
          setIsListening(false);
          return;
      }

      if (!('webkitSpeechRecognition' in window)) {
          alert("Voice input requires a Chromium browser (Chrome/Edge).");
          return;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = lang === 'es' ? 'es-ES' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
          setIsListening(true);
          sfx.playHover();
      };
      
      recognition.onend = () => {
          setIsListening(false);
      };

      recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          sfx.playError();
      };

      recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          sfx.playSuccess();
          // AUTO SUBMIT FOR "SEGUIMIENTO" (Flow)
          setTimeout(() => {
             executeTurn(transcript);
             setInput('');
          }, 500);
      };

      recognition.start();
  };

  const startGame = () => {
      sfx.playSuccess();
      setIsGameStarted(true);
  };

  // --- WELCOME SCREEN ---
  if (!isGameStarted) {
      return (
          <div className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden bg-black select-none">
              <div className="absolute inset-0 bg-grid-pattern opacity-30 bg-[size:30px_30px] animate-[pulse_4s_infinite]"></div>
              
              {/* Central Box */}
              <div className="z-10 flex flex-col items-center p-12 bg-black/50 backdrop-blur-sm border border-neon-blue/20 rounded-lg relative">
                 <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-neon-blue"></div>
                 <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-neon-blue"></div>

                <h1 className="text-6xl md:text-8xl font-black text-white mb-2 tracking-tighter drop-shadow-[0_0_15px_rgba(0,243,255,0.5)] font-sans">
                    CORE<span className="text-neon-blue">.</span>SYS
                </h1>
                
                <div className="flex items-center gap-4 text-gray-400 font-mono text-xs tracking-[0.3em] uppercase mb-12">
                     <span>{t.immersion}</span>
                     <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                     <span>{t.strategy}</span>
                     <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                     <span>{t.survival}</span>
                </div>

                 {/* Enable Narrator Toggle on Start */}
                 <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => setIsNarratorOn(!isNarratorOn)}>
                    <div className={`w-5 h-5 border rounded flex items-center justify-center ${isNarratorOn ? 'bg-neon-blue border-neon-blue' : 'border-gray-500'}`}>
                        {isNarratorOn && <div className="w-3 h-3 bg-black rounded-sm" />}
                    </div>
                    <span className="text-sm text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        {isNarratorOn ? <Volume2 size={14}/> : <VolumeX size={14}/>} 
                        {lang === 'es' ? 'Activar Voz Narradora' : 'Enable Narrator Voice'}
                    </span>
                 </div>

                <button 
                    onClick={startGame}
                    onMouseEnter={() => sfx.playHover()}
                    className="group relative px-10 py-5 bg-neon-blue text-black font-bold text-xl tracking-widest hover:bg-white transition-all clip-corner shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_40px_rgba(0,243,255,0.8)]"
                >
                    <span className="flex items-center gap-2">
                        {t.startBtn} <Play size={20} fill="black" />
                    </span>
                </button>
              </div>
          </div>
      );
  }

  // --- MAIN UI ---
  return (
    <div className="h-full w-full flex flex-col lg:flex-row bg-black overflow-hidden font-mono text-white">
        
        {/* --- LEFT: IMMERSIVE VISUALS --- */}
        <div className="lg:w-3/5 h-[35vh] lg:h-full relative border-r border-white/10 bg-gray-900 flex flex-col overflow-hidden">
            {/* Scanlines Overlay */}
            <div className="scanlines"></div>
            
            {/* Main Image */}
            <div className="flex-1 relative w-full h-full">
                {sceneImage ? (
                    <img 
                        src={sceneImage} 
                        alt="Scene" 
                        className="w-full h-full object-cover animate-in fade-in duration-700"
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050508]">
                        <div className="w-12 h-12 border-2 border-neon-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                        <span className="text-neon-blue text-xs animate-pulse tracking-widest">{t.visualizing}</span>
                    </div>
                )}
                
                {/* Location Badge (Floating) */}
                <div className="absolute top-6 left-6 bg-black/80 backdrop-blur border-l-4 border-neon-blue px-4 py-2 flex items-center gap-3">
                    <MapPin size={16} className="text-neon-blue" />
                    <span className="font-bold tracking-widest text-sm uppercase text-gray-200">{gameState.location}</span>
                </div>

                {/* Status Overlay (Bottom of Image) */}
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-4 px-6 flex justify-between items-end">
                    
                    {/* Health */}
                    <div className="flex flex-col gap-1 w-48">
                        <div className="flex justify-between text-xs font-bold uppercase text-gray-400">
                            <span className="flex items-center gap-1"><Shield size={12}/> {t.integrity}</span>
                            <span className={gameState.health < 30 ? 'text-neon-pink' : 'text-neon-blue'}>{gameState.health}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-sm overflow-hidden border border-gray-700">
                            <div 
                                className={`h-full transition-all duration-500 ${gameState.health < 30 ? 'bg-neon-pink animate-pulse' : 'bg-neon-blue'}`}
                                style={{ width: `${gameState.health}%` }}
                            />
                        </div>
                    </div>

                    {/* Simple Inv */}
                    <div className="flex gap-2">
                        {gameState.inventory.slice(0, 3).map((item, i) => (
                             <div key={i} className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-sm" title={item}>
                                 <Package size={14} className="text-gray-400" />
                             </div>
                        ))}
                        {gameState.inventory.length > 3 && (
                             <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-sm text-xs font-bold text-gray-500">
                                 +{gameState.inventory.length - 3}
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* --- RIGHT: TERMINAL & CONTROLS --- */}
        <div className="lg:w-2/5 h-[65vh] lg:h-full bg-[#050508] flex flex-col border-l border-white/5 shadow-2xl z-20">
            
            {/* Terminal Header */}
            <div className="h-10 bg-[#0a0a12] border-b border-white/10 flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-neon-green" />
                    <span className="text-neon-green/80 text-xs font-bold tracking-widest">CMD_LINE_V9</span>
                </div>
                <div className="flex items-center gap-4">
                     <button onClick={() => setIsNarratorOn(!isNarratorOn)} className="text-gray-500 hover:text-white transition-colors" title="Toggle Narrator">
                         {isNarratorOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                     </button>
                    <div className="text-[10px] text-gray-600 font-mono">SECURE_CONN</div>
                </div>
            </div>

            {/* Scrollable Logs */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth" ref={scrollRef}>
                 {/* Start Message */}
                 <div className="text-gray-600 text-[10px] text-center uppercase tracking-[0.2em] mb-4 opacity-50">
                     --- Neural Link Established ---
                 </div>

                 {/* Current Narrative Block */}
                 <div className="animate-in slide-in-from-right duration-500 border-l-2 border-neon-blue pl-4 py-1">
                     <p className="text-sm md:text-base text-gray-200 leading-7 font-sans">
                         {gameState.narrative}
                     </p>
                 </div>

                 {gameState.gameOver && (
                     <div className="p-4 bg-neon-pink/10 border border-neon-pink text-neon-pink flex items-center gap-4 animate-pulse rounded-sm mt-4">
                         <Skull size={32} />
                         <div>
                             <h3 className="font-bold text-lg tracking-widest">{t.critFail}</h3>
                             <button onClick={() => window.location.reload()} className="text-xs underline hover:text-white">{t.reboot}</button>
                         </div>
                     </div>
                 )}
            </div>

            {/* Input Controls (Sticky Bottom) */}
            <div className="p-4 bg-[#08080c] border-t border-white/10 shrink-0">
                
                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                    <button onClick={() => executeTurn(t.actions.inspect)} onMouseEnter={() => sfx.playHover()} disabled={isLoading || gameState.gameOver} className="bg-white/5 hover:bg-neon-blue/20 hover:border-neon-blue border border-white/10 py-2 px-3 rounded-sm text-xs text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-wider">
                        <Eye size={12} /> {t.inspect}
                    </button>
                    <button onClick={() => executeTurn(t.actions.gear)} onMouseEnter={() => sfx.playHover()} disabled={isLoading || gameState.gameOver} className="bg-white/5 hover:bg-neon-purple/20 hover:border-neon-purple border border-white/10 py-2 px-3 rounded-sm text-xs text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-wider">
                        <Package size={12} /> {t.gear}
                    </button>
                </div>

                {/* Text Input with Mic */}
                <div className="relative flex items-center bg-[#0a0a12] border border-white/10 rounded-sm focus-within:border-neon-blue focus-within:ring-1 focus-within:ring-neon-blue/50 transition-all">
                    <button 
                        onClick={toggleMic}
                        disabled={isLoading || gameState.gameOver}
                        className={`pl-3 pr-2 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-neon-blue hover:text-white'}`}
                        title="Voice Input (Auto-Submit)"
                    >
                        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                        placeholder={isListening ? t.listening : (isLoading ? t.processing : t.enterCmd)}
                        disabled={gameState.gameOver || isLoading}
                        className="w-full bg-transparent border-none text-white text-sm py-3 focus:ring-0 placeholder-gray-600 font-mono"
                        autoFocus
                    />
                    <button 
                        onClick={handleManualSubmit}
                        onMouseEnter={() => sfx.playHover()}
                        disabled={!input.trim() || isLoading || gameState.gameOver}
                        className="px-4 text-neon-blue hover:text-white disabled:opacity-30 disabled:hover:text-neon-blue transition-colors"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StoryEngine;
