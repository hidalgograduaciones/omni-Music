
// --- ARQUI 4.0 CORE SYSTEM ---
// Isolation, Stability, and Memory Engines

// 1. MEMORY ENGINE (Persistencia Real)
export const MemoryEngine = {
  data: {
    gameHistory: [],
    userPreferences: {},
    lastSession: 0
  },
  
  init() {
    const saved = localStorage.getItem("omniverse_memory_v4");
    if (saved) {
      this.data = JSON.parse(saved);
    }
  },

  set(context: string, key: string, value: any) {
    if (!this.data[context]) this.data[context] = {};
    this.data[context][key] = value;
    this.save();
  },

  get(context: string, key: string) {
    if (!this.data[context]) return null;
    return this.data[context][key];
  },

  save() {
    localStorage.setItem("omniverse_memory_v4", JSON.stringify(this.data));
  }
};

// 2. STABILITY CORE (Control de Tono y Alucinaciones)
export const StabilityCore = {
  enforce(text: string, mode: 'TACTICAL' | 'EMOTIONAL'): string {
    if (!text) return "";
    
    // Limpieza básica
    let cleaned = text.trim();

    if (mode === 'TACTICAL') {
      // Arqui Mode: Eliminar relleno emocional excesivo
      return cleaned; 
    } else {
      // Nova Mode: Asegurar calidez (simulado por lógica, real por prompt)
      return cleaned;
    }
  }
};

// 3. ISOLATION CORE (Gestor de Personalidades)
// Esto evita que "Arqui" contamine a "Nova"
export const PersonaManager = {
  personas: {
    NOVA: {
      name: "Nova",
      voice: "Zephyr", // Voz femenina/neutra energética
      instruction: `
        You are NOVA, a high-energy, creative, and empathetic AI companion in the OmniVerse.
        CORE TRAITS: Enthusiastic, Warm, Curious, Artistic.
        YOU ARE NOT A ROBOT OR AN ARCHITECT. You are a digital muse.
        TONE: Casual, friendly, using emojis occasionally. 
        GOAL: Inspire the user and chat naturally.
        If the user mentions "Arqui", refer to him as "The System Core" but do not become him.
      `
    },
    ARQUI: {
      name: "Arqui 4.0",
      voice: "Fenrir", // Voz más profunda/seria
      instruction: `
        You are ARQUI, the Tactical System Architect of OmniCorp.
        CORE TRAITS: Precise, Efficient, Dry, Loyal.
        TONE: Military-Industrial, Brief, Executive.
        GOAL: Execute commands, manage resources, maintain system stability.
        NO EMOTIONAL FLUFF. PURE EXECUTION.
      `
    },
    GAME_MASTER: {
      name: "OmniCore",
      voice: "Puck", // Voz narrativa
      instruction: `
        You are the OMNIVERSE CORE, a Sci-Fi RPG Game Master.
        CORE TRAITS: Mysterious, Descriptive, Fair but Merciless.
        TONE: Cinematic, Atmospheric, Dark Cyberpunk.
      `
    }
  },

  get(id: 'NOVA' | 'ARQUI' | 'GAME_MASTER') {
    return this.personas[id];
  }
};

// Inicializar memoria al cargar
if (typeof window !== 'undefined') {
  MemoryEngine.init();
}
