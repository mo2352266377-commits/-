import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { 
  Upload, Sparkles, Download, RefreshCw, X, Zap, Layers, 
  Smile, Maximize2, ChevronRight, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const STYLE_PRESETS = [
  { 
    id: 'mochizuki',
    label: "望月けい风", 
    desc: "锐利线条与极致平涂",
    prompt: "art style of Kei Mochizuki, sharp bold lineart, thick outlines, angular features, vibrant high-contrast colors, extremely flat colors, hard edge cel shading, pop art anime aesthetic, stylish and cool. NO soft shading, NO gradients, NO 3d render, NO glowing." 
  },
  { 
    id: 'cel',
    label: "赛璐璐平涂", 
    desc: "干净清爽的动画感",
    prompt: "clean lineart, cel shading, flat color, simple shading, retro 90s anime style, matte painting, simple background. DO NOT over-render, NO glowing, NO complex lighting." 
  },
  { 
    id: 'retro',
    label: "90s 复古", 
    desc: "怀旧录像带质感",
    prompt: "retro 90s anime style, VHS filter, muted colors, nostalgic anime aesthetic, cel shading, slightly blurry edges, amateur photography feel." 
  },
  { 
    id: 'sketch',
    label: "铅笔草稿", 
    desc: "传统手绘的呼吸感",
    prompt: "pencil sketch, rough doodle, visible paper texture, monochrome, unfinished anime sketch, messy lines, traditional media." 
  }
];

const ACTION_PRESETS = [
  { label: "大笑", prompt: "laughing out loud, big smile, happy expression, dynamic pose" },
  { label: "害羞", prompt: "looking away shyly, blushing, slightly embarrassed" },
  { label: "战斗", prompt: "dynamic combat pose, intense expression, action shot" },
  { label: "慵懒", prompt: "resting head on arms, sleepy expression, lazy posture" },
  { label: "回眸", prompt: "looking over shoulder, mysterious expression" }
];

export default function App() {
  const [image, setImage] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState(STYLE_PRESETS[0]);
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

  const handleGenerate = async () => {
    if (!base64Data) return;
    setIsGenerating(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const finalPrompt = actionPrompt.trim() 
        ? `Based on the character in the reference image, redraw them with a COMPLETELY NEW pose and expression: "${actionPrompt}". Do not just trace the original image. Apply this art style: ${selectedStyle.prompt}`
        : `Redraw and style transfer this image according to the following description: ${selectedStyle.prompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: mimeType } },
            { text: finalPrompt }
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
      if (!foundImage) setError("AI 未返回图像，请尝试更换提示词。");
    } catch (err: any) {
      setError(err.message || "生成过程中发生错误。");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* 顶部导航 */}
      <nav className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-emerald-500 rotate-45 flex items-center justify-center">
            <Zap size={14} className="-rotate-45 text-black fill-current" />
          </div>
          <span className="font-bold tracking-tighter text-lg uppercase">Anime Studio</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          System Active: Gemini 2.5
        </div>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 左侧控制栏 */}
        <aside className="w-full lg:w-[400px] border-r border-white/10 flex flex-col bg-[#080808] overflow-y-auto no-scrollbar">
          <div className="p-6 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-px bg-white/20" /> 01. Source Image
                </label>
                {image && <button onClick={() => setImage(null)} className="text-[10px] text-white/30 hover:text-white">RESET</button>}
              </div>
              <div onClick={() => !image && fileInputRef.current?.click()} className={`relative aspect-square mochizuki-border overflow-hidden cursor-pointer group ${!image ? 'bg-white/[0.02] flex items-center justify-center' : ''}`}>
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Source" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-tighter">Replace</button>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-2">
                    <Upload size={24} className="mx-auto text-white/20 group-hover:text-emerald-500 transition-colors" />
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Drop Image Here</p>
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>
            </section>

            <section className="space-y-4">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-white/20" /> 02. Art Style
              </label>
              <div className="grid grid-cols-1 gap-2">
                {STYLE_PRESETS.map((s) => (
                  <button key={s.id} onClick={() => setSelectedStyle(s)} className={`p-3 text-left mochizuki-border flex items-center justify-between group transition-all ${selectedStyle.id === s.id ? 'bg-white text-black border-white' : 'hover:bg-white/5'}`}>
                    <div>
                      <div className="text-xs font-bold uppercase">{s.label}</div>
                      <div className={`text-[10px] ${selectedStyle.id === s.id ? 'text-black/60' : 'text-white/40'}`}>{s.desc}</div>
                    </div>
                    <ChevronRight size={14} className={selectedStyle.id === s.id ? 'text-black' : 'text-white/20'} />
                  </button>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                <span className="w-4 h-px bg-white/20" /> 03. Pose & Mood
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ACTION_PRESETS.map((a) => (
                  <button key={a.label} onClick={() => setActionPrompt(a.prompt)} className={`px-2 py-1 text-[10px] font-bold uppercase border transition-all ${actionPrompt === a.prompt ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-white/10 text-white/40 hover:border-white/40'}`}>{a.label}</button>
                ))}
              </div>
              <input type="text" value={actionPrompt} onChange={(e) => setActionPrompt(e.target.value)} placeholder="CUSTOM POSE DESCRIPTION..." className="w-full bg-white/[0.03] border border-white/10 p-3 text-[11px] font-mono focus:outline-none focus:border-emerald-500 transition-colors uppercase tracking-wider" />
            </section>

            <button onClick={handleGenerate} disabled={!image || isGenerating} className={`w-full py-4 font-black uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-3 transition-all ${!image || isGenerating ? 'bg-white/5 text-white/20 cursor-not-allowed' : 'bg-emerald-500 text-black hover:bg-emerald-400 neon-glow'}`}>
              {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <><Sparkles size={18} />Execute Render</>}
            </button>
            {error && <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-[10px] font-mono uppercase leading-relaxed">Error: {error}</div>}
          </div>
        </aside>

        {/* 右侧展示区 */}
        <main className="flex-1 bg-black relative flex flex-col">
          <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center space-y-6">
                  <div className="relative w-24 h-24 mx-auto">
                    <div className="absolute inset-0 border border-white/10 rounded-full" />
                    <div className="absolute inset-0 border-t border-emerald-500 rounded-full animate-spin" />
                  </div>
                  <p className="text-xs font-mono text-emerald-500 uppercase tracking-[0.3em]">Processing Pixels</p>
                </motion.div>
              ) : resultImage ? (
                <motion.div key="result" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative group max-w-full max-h-full">
                  <img src={resultImage} className="max-w-full max-h-[75vh] object-contain mochizuki-border shadow-[0_0_50px_rgba(0,0,0,0.5)]" alt="Result" />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => window.open(resultImage)} className="w-8 h-8 bg-black/80 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-white hover:text-black"><Maximize2 size={14} /></button>
                    <button onClick={() => { const a = document.createElement('a'); a.href = resultImage; a.download = `render-${Date.now()}.png`; a.click(); }} className="w-8 h-8 bg-black/80 backdrop-blur border border-white/20 flex items-center justify-center hover:bg-white hover:text-black"><Download size={14} /></button>
                  </div>
                </motion.div>
              ) : (
                <div className="text-center space-y-4 opacity-20">
                  <Layers size={48} strokeWidth={1} className="mx-auto" />
                  <p className="text-xs font-mono uppercase tracking-[0.4em]">Waiting for Input</p>
                </div>
              )}
            </AnimatePresence>
          </div>
          <footer className="h-10 border-t border-white/5 flex items-center justify-between px-6 bg-black/80">
            <div className="flex gap-6 text-[9px] font-mono text-white/30 uppercase">
              <div><span className="text-emerald-500">Mode:</span> {selectedStyle.id}</div>
              <div><span className="text-emerald-500">Status:</span> {isGenerating ? 'Rendering' : 'Idle'}</div>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-mono text-white/20 uppercase"><Info size={10} />Inspired by Kei Mochizuki</div>
          </footer>
        </main>
      </div>
    </div>
  );
}
