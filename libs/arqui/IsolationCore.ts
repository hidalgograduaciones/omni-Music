// IsolationCore.ts
// Añade una identidad única al objeto y evita que los módulos propaguen comportamiento global.

export const IsolationCore = {
  identidad: "ARQUI_4",
  
  aislar(obj: any) {
    // No mutamos objetos externos directamente; devolvemos copia con identidad.
    try {
      const copia = JSON.parse(JSON.stringify(obj));
      copia.__arqui_identity = this.identidad;
      return copia;
    } catch (e) {
      // Si no se puede clonar, adjuntamos campo seguro sin romper referencias en tiempo de ejecución.
      (obj as any).__arqui_identity = this.identidad;
      return obj;
    }
  },
  
  esArqui(obj: any) {
    return !!(obj && (obj.__arqui_identity === this.identidad));
  }
};
