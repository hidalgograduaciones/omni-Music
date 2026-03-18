import React, { useState } from 'react';
import { AppMode, Language } from './types';
import LiveAvatar from './components/LiveAvatar';
import ImageStudio from './components/ImageStudio';
import MediaLab from './components/MediaLab';
import StoryEngine from './components/StoryEngine';
import OmniUploader from './components/OmniUploader';
import BootSequence from './components/BootSequence';
import { sfx } from './services/audio'; // God Level Audio
import { LayoutGrid, Mic, Image, Video, Menu, Sparkles, Gamepad2, Globe, HelpCircle, X, Disc } from 'lucide-react';

const App: React.FC = () => {
  const [booted, setBooted] = useState(false);
  const [mode, setMode] = useState<AppMode>(AppMode.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lang, setLang] = useState<Language>('es'); // Default to Spanish as requested
  const [showManual, setShowManual] = useState(false);

  // Translation Dictionary
  const t = {
    es: {
      dashboard: "Panel Principal",
      core: "Sistemas Centrales",
      story: "Núcleo de Historia",
      uploader: "Omni Uploader",
      tools: "Herramientas",
      live: "Holo-Chat (Vivo)",
      studio: "Estudio Avatar",
      media: "Laboratorio Media",
      enter: "ENTRAR AL",
      glitch: "GLITCH",
      desc: "La gloria no es una meta, es nuestro estándar. Bienvenido al OmniVerse, donde la IA construye la realidad en tiempo real.",
      play: "JUGAR HISTORIA",
      subplay: "RPG Infinito. Visuales 4K. Lógica Real.",
      liveBtn: "Conversación Real",
      liveSub: "IA de voz ultra rápida.",
      imgBtn: "Alquimia de Imagen",
      imgSub: "Transforma assets al instante.",
      manualTitle: "MANUAL OPERATIVO",
      manualDesc: "Guía rápida para pilotos del OmniVerse.",
      close: "CERRAR LINK"
    },
    en: {
      dashboard: "Dashboard",
      core: "Core Systems",
      story: "Story Core (Game)",
      uploader: "Omni Uploader",
      tools: "Tools",
      live: "Holo-Chat (Live)",
      studio: "Avatar Studio",
      media: "Media Lab",
      enter: "ENTER THE",
      glitch: "GLITCH",
      desc: "The glory is not a goal, it is our standard. Welcome to the OmniVerse, where AI constructs reality in real-time.",
      play: "PLAY STORY CORE",
      subplay: "Infinite RPG. 4K Visuals. Real-time Logic.",
      liveBtn: "Live Conversation",
      liveSub: "Real-time low latency voice AI.",
      imgBtn: "Image Alchemy",
      imgSub: "Transform assets instantly.",
      manualTitle: "OPERATIONAL MANUAL",
      manualDesc: "Quick guide for OmniVerse pilots.",
      close: "CLOSE LINK"
    }
  };

  const text = t[lang];

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  const NavItem = ({ m, icon: Icon, label }: { m: AppMode; icon: any; label: string }) => (
    <button
      onClick={() => { setMode(m); setIsSidebarOpen(false); sfx.playClick(); }}
      onMouseEnter={() => sfx.playHover()}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
        mode === m 
          ? 'bg-gradient-to-r from-neon-blue/20 to-transparent border-l-4 border-neon-blue text-white' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className={`transition-colors ${mode === m ? 'text-neon-blue' : 'group-hover:text-neon-blue'}`} />
      <span className="font-medium tracking-wide">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-[#0a0a12] text-white overflow-hidden font-sans selection:bg-neon-blue selection:text-black">
      
      {/* GOD LEVEL 3: HOLOGRAPHIC MANUAL OVERLAY */}
      {showManual && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-[#0f0f16] border border-neon-blue/50 max-w-2xl w-full rounded-2xl p-8 relative shadow-[0_0_50px_rgba(0,243,255,0.2)]">
              <button onClick={() => setShowManual(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
              
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                  <HelpCircle className="text-neon-blue" />
                  <div>
                    <h2 className="text-2xl font-bold font-mono tracking-widest text-white">{text.manualTitle}</h2>
                    <p className="text-xs text-gray-500 uppercase">{text.manualDesc}</p>
                  </div>
              </div>

              <div className="space-y-6 text-gray-300 text-sm">
                  <div className="flex gap-4">
                      <div className="w-10 h-10 rounded bg-neon-blue/10 flex items-center justify-center text-neon-blue shrink-0"><Gamepad2 /></div>
                      <div>
                          <h3 className="font-bold text-white mb-1">{text.story}</h3>
                          <p>Es un juego de rol infinito. Escribe lo que quieras hacer ("Atacar", "Hackear puerta") y la IA generará el resultado y la imagen.</p>
                      </div>
                  </div>
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded bg-neon-purple/10 flex items-center justify-center text-neon-purple shrink-0"><Disc /></div>
                      <div>
                          <h3 className="font-bold text-white mb-1">Omni Uploader</h3>
                          <p>Sube tus canciones (WAV/MP3), edita la letra y genera automáticamente una portada futurista con IA.</p>
                      </div>
                  </div>
                   <div className="flex gap-4">
                      <div className="w-10 h-10 rounded bg-neon-pink/10 flex items-center justify-center text-neon-pink shrink-0"><Image /></div>
                      <div>
                          <h3 className="font-bold text-white mb-1">{text.studio}</h3>
                          <p>Sube una foto y escribe un "prompt" para transformarla con IA.</p>
                      </div>
                  </div>
              </div>

              <button onClick={() => setShowManual(false)} className="mt-8 w-full py-3 bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue font-bold rounded uppercase tracking-widest border border-neon-blue/30 transition-all">
                  {text.close}
              </button>
           </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0F0F16] border-r border-white/5 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/20 animate-pulse-fast">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter">OmniVerse</h1>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Creator Studio</p>
          </div>
        </div>

        <nav className="space-y-2 px-4">
          <NavItem m={AppMode.HOME} icon={LayoutGrid} label={text.dashboard} />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-600 uppercase">{text.core}</div>
          <NavItem m={AppMode.STORY_ENGINE} icon={Gamepad2} label={text.story} />
          <NavItem m={AppMode.OMNI_UPLOADER} icon={Disc} label={text.uploader} />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-600 uppercase">{text.tools}</div>
          <NavItem m={AppMode.LIVE_AVATAR} icon={Mic} label={text.live} />
          <NavItem m={AppMode.IMAGE_STUDIO} icon={Image} label={text.studio} />
          <NavItem m={AppMode.MEDIA_LAB} icon={Video} label={text.media} />
        </nav>

        {/* Language & Help Controls */}
        <div className="absolute bottom-6 left-0 w-full px-6 space-y-4">
             <div className="flex gap-2">
                 <button 
                    onClick={() => { setLang(lang === 'es' ? 'en' : 'es'); sfx.playClick(); }} 
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center gap-2 text-xs font-bold text-gray-400 border border-white/5"
                 >
                     <Globe size={12} /> {lang === 'es' ? 'ESPAÑOL' : 'ENGLISH'}
                 </button>
                 <button 
                    onClick={() => { setShowManual(true); sfx.playClick(); }}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded flex items-center justify-center gap-2 text-xs font-bold text-gray-400 border border-white/5"
                 >
                     <HelpCircle size={12} /> INFO
                 </button>
             </div>

             <div className="p-4 rounded-xl bg-gradient-to-br from-gray-900 to-black border border-white/10">
                <p className="text-xs text-gray-400 mb-2">Powered by</p>
                <div className="flex items-center gap-2 font-bold text-sm">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Gemini 3.0 Pro</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#050508]">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a12]/90 backdrop-blur z-40">
           <div className="font-bold">OmniVerse</div>
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
             <Menu />
           </button>
        </div>

        {/* Dynamic Canvas */}
        <main className="flex-1 w-full h-full relative overflow-hidden">
          
          {/* Views */}
          {mode === AppMode.HOME && (
            <div className="h-full overflow-y-auto p-4 md:p-8">
                {/* Background Ambient Effects */}
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neon-purple/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-5xl mx-auto pt-6 pb-20">
                  <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none">
                    {text.enter} <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-blue via-white to-neon-purple">{text.glitch}</span>
                  </h1>
                  <p className="text-xl text-gray-400 mb-12 max-w-2xl leading-relaxed">
                    {text.desc}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Featured Card */}
                    <button 
                        onClick={() => { setMode(AppMode.STORY_ENGINE); sfx.playClick(); }} 
                        onMouseEnter={() => sfx.playHover()}
                        className="col-span-1 md:col-span-2 lg:col-span-2 group relative p-1 rounded-3xl bg-gradient-to-br from-neon-blue via-neon-purple to-neon-pink transition-all hover:scale-[1.01] overflow-hidden shadow-[0_0_40px_rgba(0,243,255,0.2)]"
                    >
                      <div className="absolute inset-0 bg-black m-[1px] rounded-[23px] z-0"></div>
                      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614728853975-69c960c72217?w=800&auto=format&fit=crop')] opacity-30 group-hover:opacity-50 transition-opacity bg-cover bg-center z-1" />
                      
                      <div className="relative z-10 p-8 h-full flex flex-col justify-end">
                        <div className="absolute top-8 left-8 w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                            <Gamepad2 size={32} />
                        </div>
                        <h3 className="text-4xl font-black mb-2 text-white italic tracking-tighter">{text.play}</h3>
                        <p className="text-gray-300 font-medium">{text.subplay}</p>
                        <div className="mt-4 flex items-center gap-2 text-neon-blue font-bold uppercase tracking-widest text-xs">
                             <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
                             Live Simulation
                        </div>
                      </div>
                    </button>

                    <button 
                        onClick={() => { setMode(AppMode.OMNI_UPLOADER); sfx.playClick(); }}
                        onMouseEnter={() => sfx.playHover()} 
                        className="group p-6 rounded-3xl bg-[#0F0F16] border border-white/5 hover:bg-white/5 transition-all text-left hover:border-neon-blue/30"
                    >
                      <div className="w-12 h-12 rounded-full bg-neon-blue/20 text-neon-blue flex items-center justify-center mb-4">
                        <Disc size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-1">{text.uploader}</h3>
                      <p className="text-xs text-gray-500">Audio + Cover AI</p>
                    </button>

                    <button 
                        onClick={() => { setMode(AppMode.LIVE_AVATAR); sfx.playClick(); }}
                        onMouseEnter={() => sfx.playHover()} 
                        className="group p-6 rounded-3xl bg-[#0F0F16] border border-white/5 hover:bg-white/5 transition-all text-left hover:border-neon-purple/30"
                    >
                      <div className="w-12 h-12 rounded-full bg-neon-purple/20 text-neon-purple flex items-center justify-center mb-4">
                        <Mic size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-1">{text.liveBtn}</h3>
                      <p className="text-xs text-gray-500">{text.liveSub}</p>
                    </button>
                  </div>
                </div>
            </div>
          )}

          {mode === AppMode.STORY_ENGINE && <StoryEngine lang={lang} />}
          {mode === AppMode.LIVE_AVATAR && <LiveAvatar />}
          {mode === AppMode.IMAGE_STUDIO && <ImageStudio />}
          {mode === AppMode.MEDIA_LAB && <MediaLab />}
          {mode === AppMode.OMNI_UPLOADER && <OmniUploader />}

        </main>
      </div>
    </div>
  );
};

export default App;
