import React, { useState, useRef, useEffect } from 'react';
import { generateSceneImage } from '../services/gemini';
import { sfx } from '../services/audio';
import { Upload, Music, Mic2, Image as ImageIcon, Play, Pause, Download, Disc, Wand2, Save, Share2 } from 'lucide-react';

const OmniUploader: React.FC = () => {
  // State
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [style, setStyle] = useState('Cyberpunk');
  const [coverArt, setCoverArt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Audio Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number>(0);

  // Styles
  const musicStyles = ["Cyberpunk", "Synthwave", "Dark Techno", "Ethereal Trap", "Cinematic Orchestral", "Industrial Metal", "Reggaeton Futurista", "Lo-Fi Glitch"];

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioFile(file);
      setAudioUrl(url);
      setTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
      sfx.playSuccess();
    }
  };

  // Generate Cover Art
  const handleGenerateCover = async () => {
    if (!title && !lyrics) return;
    setIsGenerating(true);
    sfx.playClick();
    
    // Construct a rich prompt for Gemini
    const artPrompt = `Album cover art for a song titled "${title}". Musical style: ${style}. Vibe/Lyrics theme: ${lyrics.slice(0, 100)}... High quality, 4k, digital art, cinematic lighting, masterpiece.`;
    
    try {
      const img = await generateSceneImage(artPrompt);
      if (img) setCoverArt(img);
    } catch (e) {
      console.error("Cover Gen Error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  // Audio Visualization Logic
  useEffect(() => {
    if (!audioUrl || !audioRef.current || !canvasRef.current) return;

    if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        
        // Connect nodes
        // Note: createMediaElementSource requires CORS if not local blob, but blob is fine
        try {
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
        } catch (e) {
            console.warn("Audio Context Connection Error", e);
        }
    }

    const renderFrame = () => {
        if (!analyserRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 1.5; // Scale down

            // Gradient Bar
            const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
            gradient.addColorStop(0, '#00f3ff');
            gradient.addColorStop(1, '#bc13fe');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }

        if (isPlaying) {
            animationRef.current = requestAnimationFrame(renderFrame);
        }
    };

    if (isPlaying) {
        if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }
        renderFrame();
    } else {
        cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
        audioRef.current.pause();
    } else {
        audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="h-full flex flex-col xl:flex-row p-6 gap-6 relative overflow-y-auto">
        
        {/* --- LEFT: CONTROL PANEL (The Inputs) --- */}
        <div className="flex-1 flex flex-col gap-6">
            
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-xl bg-neon-blue/10 flex items-center justify-center text-neon-blue shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                    <Disc size={24} className="animate-spin-slow" />
                </div>
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter">OMNI<span className="text-neon-blue">UPLOADER</span></h1>
                    <p className="text-xs text-gray-400 tracking-widest uppercase">Audio Asset Management & Distribution</p>
                </div>
            </div>

            {/* Upload Zone */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-neon-blue/50 transition-colors group">
                <label className="cursor-pointer flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-xl bg-black/20 group-hover:bg-black/40 transition-all relative overflow-hidden">
                    <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Upload className="text-gray-400 mb-2 group-hover:text-neon-blue group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-gray-300 z-10">{audioFile ? audioFile.name : "Drop WAV/MP3 Master File"}</span>
                    <span className="text-xs text-gray-500 z-10">Max 50MB • 24-bit WAV Preferred</span>
                    <input type="file" className="hidden" accept="audio/*" onChange={handleFileUpload} />
                </label>
            </div>

            {/* Metadata Form */}
            <div className="bg-glass border border-white/10 rounded-2xl p-6 space-y-4">
                 <div className="flex items-center gap-2 text-neon-blue mb-2 text-sm font-bold uppercase tracking-widest">
                     <Music size={14} /> Track Metadata
                 </div>
                 
                 <input 
                    type="text" 
                    placeholder="Track Title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/40 border-b border-gray-700 p-3 text-white text-lg font-bold focus:border-neon-blue outline-none transition-all placeholder-gray-600"
                 />

                 <div className="grid grid-cols-2 gap-4">
                     <select 
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="bg-black/40 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-neon-blue outline-none"
                     >
                         {musicStyles.map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                     <div className="flex items-center justify-center text-xs text-gray-500 bg-black/20 rounded border border-white/5">
                        {style} Vibe Active
                     </div>
                 </div>

                 <textarea 
                    placeholder="Paste Lyrics here..." 
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    className="w-full h-32 bg-black/40 border border-gray-700 rounded-lg p-3 text-sm text-gray-300 focus:border-neon-blue outline-none resize-none font-mono leading-relaxed"
                 />
            </div>
        </div>

        {/* --- RIGHT: PREVIEW & GENERATION (The Output) --- */}
        <div className="flex-1 flex flex-col gap-6">
            
            {/* Visualizer & Player Card */}
            <div className="flex-1 bg-[#0a0a12] border border-white/10 rounded-3xl relative overflow-hidden flex flex-col shadow-2xl">
                
                {/* Dynamic Background (Canvas) */}
                <canvas 
                    ref={canvasRef} 
                    width={600} 
                    height={300} 
                    className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
                />
                
                {/* Content Layer */}
                <div className="relative z-10 p-8 flex flex-col h-full items-center justify-center text-center">
                    
                    {/* Cover Art Container */}
                    <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-lg bg-black/50 border border-white/10 mb-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden group">
                        {coverArt ? (
                            <img src={coverArt} alt="Cover" className="w-full h-full object-cover animate-in fade-in duration-1000" />
                        ) : (
                            <div className="text-gray-600 flex flex-col items-center">
                                <ImageIcon size={48} className="mb-2 opacity-50" />
                                <span className="text-xs tracking-widest uppercase">No Cover Art</span>
                            </div>
                        )}
                        
                        {/* Overlay Button */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                             <button 
                                onClick={handleGenerateCover}
                                disabled={isGenerating || !title}
                                className="flex items-center gap-2 px-6 py-3 bg-neon-purple text-white font-bold rounded-full hover:scale-105 transition-transform shadow-lg shadow-neon-purple/40"
                             >
                                 {isGenerating ? <span className="animate-spin">⏳</span> : <Wand2 size={18} />}
                                 Generate AI Art
                             </button>
                        </div>
                    </div>

                    {/* Track Info */}
                    <h2 className="text-3xl font-black text-white mb-1 tracking-tight">{title || "Untitled Track"}</h2>
                    <p className="text-neon-blue text-sm font-bold uppercase tracking-widest mb-6">{style}</p>

                    {/* Audio Controls */}
                    <div className="w-full max-w-md flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                        <button 
                            onClick={togglePlay}
                            disabled={!audioUrl}
                            className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                        >
                            {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-1" />}
                        </button>
                        
                        <div className="flex-1">
                             {/* Fake Waveform Lines */}
                             <div className="flex items-center gap-[2px] h-8 opacity-50">
                                 {Array.from({length: 30}).map((_, i) => (
                                     <div key={i} className={`flex-1 bg-neon-blue rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''}`} style={{ height: `${Math.random() * 100}%` }} />
                                 ))}
                             </div>
                        </div>

                        <span className="text-xs font-mono text-gray-400">WAV</span>
                    </div>

                    {/* Hidden Audio Element */}
                    <audio 
                        ref={audioRef} 
                        src={audioUrl || ''} 
                        onEnded={() => setIsPlaying(false)}
                        crossOrigin="anonymous" 
                    />

                </div>
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-2 gap-4">
                <button className="py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-neon-green/20 hover:border-neon-green/50 text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2 font-bold uppercase text-sm">
                    <Save size={18} /> Save Draft
                </button>
                <button 
                    disabled={!audioUrl || !coverArt}
                    className="py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-xl hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center gap-2 font-bold uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Share2 size={18} /> Publish Release
                </button>
            </div>

        </div>
    </div>
  );
};

export default OmniUploader;
