import React, { useState } from 'react';
import { analyzeVideoWithGemini, transcribeAudioWithGemini, generateSpeechWithGemini } from '../services/gemini';
import { fileToBase64 } from '../services/utils';
import { Video, Mic, FileAudio, PlayCircle, FileText, Volume2, Upload } from 'lucide-react';

const MediaLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'tts'>('video');
  const [file, setFile] = useState<File | null>(null);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ttsText, setTtsText] = useState('');

  const handleAnalyze = async () => {
    if (!file && activeTab !== 'tts') return;
    setLoading(true);
    setOutput('');

    try {
      if (activeTab === 'video' && file) {
        const base64 = await fileToBase64(file);
        // Calls gemini-3-pro-preview
        const text = await analyzeVideoWithGemini(base64, file.type, "Describe the key events and visual style of this video.");
        setOutput(text);
      } else if (activeTab === 'audio' && file) {
        const base64 = await fileToBase64(file);
        // Calls gemini-3-flash-preview
        const text = await transcribeAudioWithGemini(base64, file.type);
        setOutput(text);
      } else if (activeTab === 'tts') {
        // Calls gemini-2.5-flash-preview-tts
        if(!ttsText) return;
        await generateSpeechWithGemini(ttsText);
      }
    } catch (e) {
      console.error(e);
      setOutput("An error occurred during processing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-6 flex flex-col gap-6">
      
      {/* Navigation Tabs */}
      <div className="flex p-1 bg-white/10 rounded-xl w-fit">
        <button
          onClick={() => { setActiveTab('video'); setFile(null); setOutput(''); }}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'video' ? 'bg-neon-blue text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          <Video size={18} /> Video Intelligence
        </button>
        <button
          onClick={() => { setActiveTab('audio'); setFile(null); setOutput(''); }}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'audio' ? 'bg-neon-pink text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          <Mic size={18} /> Audio Transcriber
        </button>
        <button
          onClick={() => { setActiveTab('tts'); setFile(null); setOutput(''); }}
          className={`px-6 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${activeTab === 'tts' ? 'bg-neon-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          <Volume2 size={18} /> Voice Synthesis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        {/* Input Section */}
        <div className="bg-glass border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xl font-bold mb-4">
                {activeTab === 'video' && 'Analyze Gameplay Footage'}
                {activeTab === 'audio' && 'Transcribe Voice Notes'}
                {activeTab === 'tts' && 'Text to Holographic Speech'}
            </h3>

            {activeTab !== 'tts' ? (
                <label className="flex-1 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-white transition-colors bg-black/20">
                    {file ? (
                        <div className="text-center">
                            {activeTab === 'video' ? <Video size={48} className="mx-auto mb-2 text-neon-blue"/> : <FileAudio size={48} className="mx-auto mb-2 text-neon-pink"/>}
                            <p className="font-bold">{file.name}</p>
                            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500">
                            <Upload className="mx-auto mb-2" />
                            <p>Upload {activeTab === 'video' ? 'Video (MP4)' : 'Audio (MP3/WAV)'}</p>
                        </div>
                    )}
                    <input 
                        type="file" 
                        className="hidden" 
                        accept={activeTab === 'video' ? "video/*" : "audio/*"}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                </label>
            ) : (
                <textarea 
                    className="flex-1 bg-black/40 border border-gray-700 rounded-xl p-4 resize-none focus:border-neon-purple outline-none"
                    placeholder="Type something for the AI to say..."
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                />
            )}

            <button
                onClick={handleAnalyze}
                disabled={loading || (activeTab !== 'tts' && !file) || (activeTab === 'tts' && !ttsText)}
                className="w-full py-4 bg-white text-black font-bold rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Processing with Gemini...' : (activeTab === 'tts' ? 'Speak Now' : 'Analyze Media')}
            </button>
        </div>

        {/* Output Section */}
        {activeTab !== 'tts' && (
            <div className="bg-glass border border-white/10 rounded-2xl p-6 relative overflow-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink" />
                <h3 className="text-lg font-bold mb-4 text-gray-300 flex items-center gap-2">
                    <FileText size={18} /> Analysis Result
                </h3>
                {output ? (
                    <div className="prose prose-invert max-w-none text-gray-200 whitespace-pre-wrap leading-relaxed">
                        {output}
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-600 italic">
                        Results will appear here...
                    </div>
                )}
            </div>
        )}
         {activeTab === 'tts' && (
             <div className="bg-glass border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                 <div className="w-32 h-32 rounded-full bg-neon-purple/20 flex items-center justify-center mb-4 animate-pulse">
                    <Volume2 size={48} className="text-neon-purple" />
                 </div>
                 <h3 className="text-xl font-bold">Audio Synthesis</h3>
                 <p className="text-gray-400 mt-2">Using Gemini 2.5 TTS to generate lifelike speech.</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default MediaLab;