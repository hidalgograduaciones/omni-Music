import React, { useState } from 'react';
import { editImageWithGemini } from '../services/gemini';
import { fileToBase64 } from '../services/utils';
import { Upload, Sparkles, Wand2, Image as ImageIcon } from 'lucide-react';

const ImageStudio: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const base64 = await fileToBase64(file);
      setPreview(`data:${file.type};base64,${base64}`);
      setResultImage(null);
    }
  };

  const handleGenerate = async () => {
    if (!selectedFile || !prompt) return;

    setIsLoading(true);
    try {
      const base64 = await fileToBase64(selectedFile);
      // Calls gemini-2.5-flash-image
      const editedImage = await editImageWithGemini(base64, selectedFile.type, prompt);
      setResultImage(editedImage);
    } catch (error) {
      console.error("Error editing image:", error);
      alert("Failed to edit image. Try a different prompt.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-6">
      
      {/* Controls */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Wand2 className="text-neon-purple" /> Avatar Studio
          </h2>
          <p className="text-gray-400 text-sm">Upload an asset and use AI to transform it.</p>
        </div>

        <div className="space-y-4">
          <label className="block w-full cursor-pointer group">
            <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center transition-colors group-hover:border-neon-purple bg-black/20">
              <Upload className="text-gray-400 mb-2 group-hover:text-neon-purple" />
              <span className="text-gray-400 text-sm group-hover:text-white">Click to upload image</span>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Magic Prompt</label>
            <textarea
              className="w-full bg-black/40 border border-gray-700 rounded-lg p-3 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all resize-none"
              rows={3}
              placeholder="e.g., Make it look like a retro 8-bit game character, or Add a neon glowing aura"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!selectedFile || !prompt || isLoading}
            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              !selectedFile || !prompt || isLoading
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-neon-purple to-neon-pink text-white hover:shadow-[0_0_20px_rgba(188,19,254,0.4)]'
            }`}
          >
            {isLoading ? <span className="animate-spin">⏳</span> : <Sparkles size={18} />}
            {isLoading ? 'Transforming...' : 'Magic Edit'}
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-[2] bg-black/40 rounded-2xl border border-white/10 p-6 flex items-center justify-center relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full h-full">
            {/* Original */}
            <div className="relative rounded-xl overflow-hidden bg-black/50 flex items-center justify-center border border-white/5">
                {preview ? (
                    <img src={preview} alt="Original" className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="text-gray-600 flex flex-col items-center">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span>Original Asset</span>
                    </div>
                )}
                <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">Input</div>
            </div>

            {/* Result */}
            <div className="relative rounded-xl overflow-hidden bg-black/50 flex items-center justify-center border border-white/5">
                 {resultImage ? (
                    <img src={resultImage} alt="Edited" className="max-h-full max-w-full object-contain" />
                ) : (
                    <div className="text-gray-600 flex flex-col items-center">
                         <Sparkles size={48} className="mb-2 opacity-50 text-neon-purple" />
                        <span>AI Result</span>
                    </div>
                )}
                 <div className="absolute top-2 left-2 bg-neon-purple/80 px-2 py-1 rounded text-xs text-white">Output</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ImageStudio;
