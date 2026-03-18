// StabilityCore.ts
// Normaliza y garantiza que las respuestas no contengan variaciones indeseadas ni ruido emocional.
// Uso: StabilityCore.enforce(texto) antes de devolver el resultado a la UI o a otros módulos.

export const StabilityCore = {
  stable: true,
  maxLength: 10000, // límite seguro

  enforce(input: any) {
    if (input === null || input === undefined) return "Operación completada.";
    
    let texto = typeof input === "string" ? input : JSON.stringify(input);
    texto = texto.trim();
    
    if (texto.length === 0) return "Operación completada.";
    
    // Escape básico y truncado seguro
    if (texto.length > this.maxLength) texto = texto.slice(0, this.maxLength) + "…";
    
    // Eliminamos saltos excesivos y normalizamos espacios
    texto = texto.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
    
    return texto;
  }
};
