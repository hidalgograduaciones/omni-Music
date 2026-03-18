import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decodeBase64, decodeAudioData } from "./utils";
import { GameState, Language } from "../types";

const API_KEY = process.env.API_KEY || '';

const getAI = () => new GoogleGenAI({ apiKey: API_KEY });

// --- IMAGE EDITING ---
export const editImageWithGemini = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: mimeType } },
        { text: prompt || "Enhance this image" },
      ],
    },
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image returned.");
};

// --- VIDEO ANALYSIS ---
export const analyzeVideoWithGemini = async (base64Video: string, mimeType: string, prompt: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Video, mimeType: mimeType } },
        { text: prompt || "Analyze this video in detail." },
      ],
    },
  });
  return response.text || "No analysis generated.";
};

// --- AUDIO TRANSCRIPTION ---
export const transcribeAudioWithGemini = async (base64Audio: string, mimeType: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: mimeType } },
        { text: "Transcribe the audio exactly as spoken." },
      ],
    },
  });
  return response.text || "Transcription failed.";
};

// --- TTS ---
export const generateSpeechWithGemini = async (text: string, voiceName: 'Kore' | 'Puck' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<void> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), outputAudioContext, 24000, 1);
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();
  } catch (e) {
    console.error("TTS Error:", e);
  }
};

// --- GAME ENGINE (OmniVerse Core) ---

export const generateSceneImage = async (prompt: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Video game concept art, cyberpunk, sci-fi, high resolution, cinematic lighting, 8k, detailed: ${prompt}` },
        ],
      },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
  } catch (e) {
    console.warn("Image Gen Error:", e);
    return "";
  }
  return ""; 
};

export const runGameTurn = async (history: any[], userAction: string, language: Language = 'en'): Promise<GameState> => {
  const ai = getAI();
  
  const langInstruction = language === 'es' 
    ? "IMPORTANT: Output language MUST be SPANISH (Español)." 
    : "Output language must be English.";

  const context = `You are the OmniVerse Core, a merciless AI Game Master running a Sci-Fi RPG.
  
  Current Action: ${userAction}
  
  Instructions:
  1. Update the game state based on the action.
  2. Keep narrative concise, edgy, and immersive (max 3 sentences).
  3. **CRITICAL**: Always end the narrative with a hook, a threat, or a question to prompt the player's next move. Do not let the story stall.
  4. 'visualPrompt' MUST be a visual description only (English), no UI text.
  5. If the player does something fatal, set gameOver to true.
  6. ${langInstruction}
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            ...history,
            { role: 'user', parts: [{ text: context }] }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              location: { type: Type.STRING },
              health: { type: Type.INTEGER },
              inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
              narrative: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
              gameOver: { type: Type.BOOLEAN },
            },
            required: ["location", "health", "inventory", "narrative", "visualPrompt", "gameOver"],
          },
        },
      });

      const jsonText = response.text || "{}";
      return JSON.parse(jsonText) as GameState;

  } catch (e) {
      console.error("Game Logic Error:", e);
      return {
          location: language === 'es' ? "Sector Desconocido" : "Unknown Sector",
          health: 50,
          inventory: ["Glitched Data"],
          narrative: language === 'es' 
            ? "ERROR DE SISTEMA // SEÑAL INTERRUMPIDA. La simulación parpadea. Reintenta tu comando." 
            : "SYSTEM ERROR // SIGNAL INTERRUPTED. The reality simulation flickered. Please retry your last command.",
          visualPrompt: "Glitch art, static noise, corrupted data, dark cyberpunk",
          gameOver: false
      };
  }
};
