import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Image as ImageIcon, Sparkles, Download, RefreshCw, X, Paintbrush } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const PRESETS = [
  { label: "望月けい风 (Kei Mochizuki Style)", prompt: "art style of Kei Mochizuki, sharp bold lineart, thick outlines, angular features, vibrant high-contrast colors, extremely flat colors, hard edge cel shading, pop art anime aesthetic, stylish and cool. NO soft shading, NO gradients, NO 3d render, NO glowing." },
  { label: "赛璐璐平涂 (Cel Shading)", prompt: "clean lineart, cel shading, flat color, simple shading, retro 90s anime style, matte painting, simple background. DO NOT over-render, NO glowing, NO complex lighting." },
  { label: "90年代复古 (90s Retro)", prompt: "retro 90s anime style, VHS filter, muted colors, nostalgic anime aesthetic, cel shading, slightly blurry edges, amateur photography feel." },
  { label: "铅笔草稿风 (Pencil Sketch)", prompt: "pencil sketch, rough doodle, visible paper texture, monochrome, unfinished anime sketch, messy lines, traditional media." },
  { label: "吉卜力水彩 (Ghibli Watercolor)", prompt: "Studio Ghibli style, watercolor painting, natural lighting, soft edges, traditional media, visible brush strokes, earthy tones." }
];

const ACTION_PRESETS = [
  { label: "开心大笑 (Laughing)", prompt: "laughing out loud, big smile, happy expression, dynamic pose" },
  { label: "害羞转头 (Shy)", prompt: "looking away shyly, blushing, slightly embarrassed" },
  { label: "战斗姿态 (Combat)", prompt: "dynamic combat pose, intense expression, action shot" },
  { label: "慵懒趴着 (Lazy)", prompt: "resting head on arms, sleepy expression, lazy posture" }
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [prompt, setPrompt] = useState<string>(PRESETS[0].prompt);
  const [actionPrompt, setActionPrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImage(result);
      setBase64Data(result.split(',')[1]);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImage(null);
    setBase64Data(null);
    setResultImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!base64Data || !prompt) return;

    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      
      const finalPrompt = actionPrompt.trim() 
        ? `Based on the character in the reference image, redraw them with a COMPLETELY NEW pose and expression: "${actionPrompt}". Do not just trace the original image. Apply this art style: ${prompt}`
        : `Redraw and style transfer this image according to the following description: ${prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: finalPrompt,
            },
          ],
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResultImage(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        setError("AI did not return an image. Please try a different prompt or image.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = 'de-ai-fied-anime.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-zinc-950">
              <Paintbrush size={18} strokeWidth={2.5} />
            </div>
            <h1 className="font-semibold tracking-tight text-lg">Anime De-AI-fier</h1>
          </div>
          <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Gemini 2.5 Flash Image
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Upload Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">1. Original Image</h2>
                {image && (
                  <button onClick={clearImage} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
              
              {!image ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-zinc-800 rounded-2xl h-64 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-emerald-500/50 hover:bg-zinc-900/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="text-zinc-400 group-hover:text-emerald-400" size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Click to upload image</p>
                    <p className="text-xs text-zinc-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 group">
                  <img src={image} alt="Original" className="w-full h-auto max-h-64 object-contain" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-full flex items-center gap-2 transition-colors"
                    >
                      <RefreshCw size={16} /> Replace Image
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/png, image/jpeg, image/webp" 
                className="hidden" 
              />
            </section>

            {/* Action & Expression Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">2. Action & Expression (Optional)</h2>
                {actionPrompt && (
                  <button onClick={() => setActionPrompt('')} className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
                    <X size={14} /> Clear
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {ACTION_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActionPrompt(p.prompt)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      actionPrompt === p.prompt 
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={actionPrompt}
                onChange={(e) => setActionPrompt(e.target.value)}
                placeholder="e.g., smiling, waving hand, looking up..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </section>

            {/* Prompt Section */}
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">3. De-AI Style Prompt</h2>
              
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(p.prompt)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      prompt === p.prompt 
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your custom prompt here..."
                className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              />
            </section>

            {/* Action Button */}
            <button
              onClick={handleGenerate}
              disabled={!image || !prompt || isGenerating}
              className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-400 text-zinc-950"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="animate-spin" size={18} />
                  Processing Image...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  De-AI-fy Image
                </>
              )}
            </button>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-3">4. Result</h2>
            
            <div className="border border-zinc-800 bg-zinc-900/50 rounded-2xl min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden">
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4 text-zinc-500"
                  >
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm font-mono animate-pulse">Applying human touch...</p>
                  </motion.div>
                ) : resultImage ? (
                  <motion.div 
                    key="result"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full h-full flex flex-col"
                  >
                    <div className="flex-1 p-4 flex items-center justify-center">
                      <img 
                        src={resultImage} 
                        alt="De-AI-fied result" 
                        className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex justify-end">
                      <button 
                        onClick={handleDownload}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                      >
                        <Download size={16} />
                        Download Result
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-3 text-zinc-600"
                  >
                    <ImageIcon size={48} strokeWidth={1} />
                    <p className="text-sm">Your de-AI-fied image will appear here</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
