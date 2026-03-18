import React, { useEffect, useState } from 'react';
import { sfx } from '../services/audio';

interface BootSequenceProps {
  onComplete: () => void;
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const sequence = [
      "INITIALIZING KERNEL...",
      "LOADING NEURAL NETWORKS...",
      "CONNECTING TO GEMINI 3.0 API...",
      "OPTIMIZING SHADERS...",
      "CALIBRATING HOLOGRAPHIC DISPLAY...",
      "SYSTEM READY."
    ];

    let delay = 0;
    sequence.forEach((line, index) => {
      setTimeout(() => {
        setLines(prev => [...prev, line]);
        sfx.playClick();
        if (index === sequence.length - 1) {
          setTimeout(onComplete, 800);
        }
      }, delay);
      delay += Math.random() * 300 + 200;
    });
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center font-mono text-neon-blue p-8 select-none cursor-wait">
      <div className="max-w-xl w-full">
        <div className="flex justify-between border-b border-neon-blue mb-4 pb-2">
            <span>OMNIVERSE BIOS v4.2</span>
            <span>MEM: 64TB OK</span>
        </div>
        <div className="space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="animate-pulse-fast">{`> ${line}`}</div>
          ))}
          <div className="w-4 h-6 bg-neon-blue animate-pulse mt-2 inline-block"></div>
        </div>
      </div>
    </div>
  );
};

export default BootSequence;
