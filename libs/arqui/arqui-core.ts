// arqui-core.ts
// Ensamblador que usa IsolationCore, StabilityCore y MemoryEngine.
// Importa desde la misma carpeta: ./IsolationCore, ./StabilityCore, ./MemoryEngine.v4

import { IsolationCore } from "./IsolationCore";
import { StabilityCore } from "./StabilityCore";
import { MemoryEngine } from "./MemoryEngine.v4";

export const Arqui = {
  procesar(orden: string, datos?: any) {
    // Ejecuta orden básica, la idea es extender con CommandExecutor local.
    switch (orden) {
      case "crear_salon":
        MemoryEngine.set("salon", datos);
        return IsolationCore.aislar({ resultado: StabilityCore.enforce("Salón creado.") });
        
      case "agregar_mesas":
        MemoryEngine.push("mobiliario", { tipo: "mesa", ...datos });
        return IsolationCore.aislar({ resultado: StabilityCore.enforce("Mesas agregadas.") });
        
      case "agregar_sillas":
        MemoryEngine.push("mobiliario", { tipo: "silla", ...datos });
        return IsolationCore.aislar({ resultado: StabilityCore.enforce("Sillas agregadas.") });
        
      case "dump_state":
        return IsolationCore.aislar({ resultado: StabilityCore.enforce(JSON.stringify(MemoryEngine.data)) });
        
      default:
        return IsolationCore.aislar({ resultado: StabilityCore.enforce("Orden ejecutada.") });
    }
  },
  
  estado() {
    // Retorna copia segura del estado
    return JSON.parse(JSON.stringify(MemoryEngine.data));
  },
  
  clear() {
    MemoryEngine.clear();
  }
};
