// MemoryEngine.v4.ts
// Memoria persistente y encapsulada para Arqui.
// Guarda en localStorage bajo la clave "arqui_memory_v4".
// API mínima: set(key, value), push(key, value), get(key), save(), load(), clear().

const STORAGE_KEY = "arqui_memory_v4";

type MemoryShape = {
  salon?: any | null;
  mobiliario?: any[];
  [k: string]: any;
};

export const MemoryEngine = {
  data: { salon: null, mobiliario: [] } as MemoryShape,
  
  set(key: string, value: any) {
    this.data[key] = value;
    this.save();
  },
  
  push(key: string, value: any) {
    if (!this.data[key]) this.data[key] = [];
    if (!Array.isArray(this.data[key])) this.data[key] = [this.data[key]];
    (this.data[key] as any[]).push(value);
    this.save();
  },
  
  get(key: string) {
    return this.data[key];
  },
  
  save() {
    try {
      const s = JSON.stringify(this.data);
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, s);
      }
    } catch (e) {
      // Fallback silencioso: si el entorno no tiene localStorage, no petamos.
      // Podríamos añadir un fallback en memoria si se requiere.
      // console.warn("MemoryEngine.save failed", e);
    }
  },
  
  load() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.data = JSON.parse(raw);
        }
      }
    } catch (e) {
      // Ignore parse errors; mantenemos estructura por defecto.
      // console.warn("MemoryEngine.load failed", e);
    }
  },
  
  clear() {
    this.data = { salon: null, mobiliario: [] };
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) { /* noop */ }
  }
};

// Auto-load al importar (útil para la mayoría de apps web)
try {
  MemoryEngine.load();
} catch (_) { /* noop */ }
