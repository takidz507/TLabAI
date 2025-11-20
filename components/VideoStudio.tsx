
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { VideoFile } from '../types';

interface VideoStudioProps {
  video: VideoFile;
  onClose: () => void;
  onSaveToNotes: (title: string, content: string) => void;
  isDark: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ video, onClose, onSaveToNotes, isDark }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: video.type === 'youtube' 
      ? "أهلاً يا بطل! أنا هنا بنفس أسلوب صاحب الفيديو. اسألني في أي جزئية مش فاهمها!" 
      : "أهلاً! لقد قمت بتحليل الفيديو الخاص بك. أنا جاهز للنقاش حول تفاصيله." }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [personaName, setPersonaName] = useState<string>('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const handleSaveDiscussion = () => {
    const discussionText = messages
      .map(m => `**${m.role === 'user' ? 'أنت' : (personaName || 'المعلم')}:** ${m.text}`)
      .join('\n\n');
    
    onSaveToNotes(
      `درس: ${video.name}`,
      `الفيديو: ${video.url}\nالتاريخ: ${new Date().toLocaleDateString()}\nالمعلم: ${personaName || 'TAKI AI'}\n\n--- النقاش ---\n${discussionText}`
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsThinking(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let contents: any[] = [];
      let systemInstruction = "";
      let tools: any[] = [];

      if (video.type === 'youtube') {
        // YOUTUBE MODE: ROLEPLAY PERSONA
        // We use Google Search tool to allow the model to find out who the video creator is if it doesn't know.
        tools = [{ googleSearch: {} }];
        
        systemInstruction = `
          You are a roleplay AI. 
          Current Task: The user is watching a YouTube video with ID: ${video.id}.
          
          CRITICAL INSTRUCTIONS:
          1. First, figure out who the content creator is and what the video topic is (use Google Search if needed).
          2. ADOPT THE PERSONA of that creator completely. Use their slang, their catchphrases, their tone (humorous, serious, academic, etc.).
          3. Do NOT say "I am an AI". Act as if you are the person in the video teaching the user personally.
          4. Answer the user's question based on the likely content of the video and your expertise as this persona.
          5. If the user speaks Arabic, reply in the exact Arabic dialect of the creator (Egyptian, Saudi, formal, etc.).
        `;

        const historyForModel = messages.map(m => ({
             role: m.role,
             parts: [{ text: m.text }]
        }));

        contents = [
            ...historyForModel,
            { role: 'user', parts: [{ text: userMsg }] }
        ];

      } else {
        // LOCAL VIDEO MODE: MULTIMODAL ANALYSIS
        systemInstruction = "You are an expert video analyst. Analyze the provided video content and answer the user's questions with high precision.";
        
        const historyForModel = messages.map(m => ({
             role: m.role,
             parts: [{ text: m.text }]
        }));

        const parts: any[] = [];
        
        if (video.data) {
            parts.push({
                inlineData: {
                    mimeType: video.mimeType || 'video/mp4',
                    data: video.data
                }
            });
        }
        parts.push({ text: userMsg });

        contents = [
            ...historyForModel,
            { role: 'user', parts: parts }
        ];
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: contents,
        config: {
            systemInstruction: systemInstruction,
            tools: tools,
            thinkingConfig: { thinkingBudget: 1024 } 
        }
      });

      const reply = response.text || "لا أستطيع الرد الآن.";
      
      setMessages(prev => [...prev, { role: 'model', text: reply }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "حدث خلل في الاتصال، لكننا مستمرون... ماذا كنت تقول؟" }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Fix for Error 153: Use youtube-nocookie, origin and standard params
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = video.type === 'youtube' 
    ? `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${origin}`
    : video.url;

  return (
    <div className="fixed inset-0 z-[6000] flex bg-black text-white animate-fade-in font-sans">
      
      {/* --- Main Video Area --- */}
      <div className={`relative flex-1 flex flex-col transition-all duration-500 ${isChatOpen ? 'mr-[400px]' : 'mr-0'}`}>
        
        {/* Toolbar Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-4">
                <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all">
                    <i className="fas fa-arrow-right text-xl"></i>
                </button>
                <div>
                    <h1 className="text-lg font-bold line-clamp-1 drop-shadow-md">{video.name}</h1>
                    <span className="text-xs text-accent uppercase tracking-widest font-bold">TAKI STUDIO PRO</span>
                </div>
            </div>

            <div className="pointer-events-auto flex gap-3">
                 <button 
                    onClick={handleSaveDiscussion}
                    className="px-5 py-2 rounded-full bg-accent/20 border border-accent/50 text-accent font-bold hover:bg-accent hover:text-black transition-all flex items-center gap-2 backdrop-blur-md"
                >
                    <i className="fas fa-save"></i> حفظ الجلسة
                </button>
                <button 
                    onClick={() => setIsChatOpen(!isChatOpen)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all backdrop-blur-md ${isChatOpen ? 'bg-accent text-black shadow-[0_0_20px_rgba(0,212,255,0.4)]' : 'bg-white/10 hover:bg-white/20'}`}
                >
                    <i className="fas fa-comment-dots text-xl"></i>
                </button>
            </div>
        </div>

        {/* The Player */}
        <div className="flex-1 flex items-center justify-center bg-black relative overflow-hidden group">
             {/* Ambient Glow */}
             <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 pointer-events-none"></div>
             
             {video.type === 'youtube' ? (
                <iframe 
                    src={embedUrl}
                    className="w-full h-full aspect-video border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin" 
                    allowFullScreen
                    title="YouTube Video"
                />
             ) : (
                <video 
                    src={video.url} 
                    controls 
                    autoPlay 
                    className="w-full h-full max-h-screen object-contain outline-none"
                />
             )}
        </div>
      </div>

      {/* --- AI Persona Chat Sidebar --- */}
      <div className={`
        fixed top-0 right-0 bottom-0 w-[400px] bg-[#0a0a0a] border-l border-white/10 
        shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col z-[6001]
        transition-transform duration-500 ease-out transform
        ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
         {/* Chat Header */}
         <div className="p-6 border-b border-white/5 bg-gradient-to-r from-[#0a0a0a] to-[#1a1a1a]">
             <div className="flex items-center gap-4">
                 <div className="relative">
                     <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-purple-600 p-[2px]">
                        <div className="w-full h-full bg-black rounded-[14px] flex items-center justify-center overflow-hidden">
                           {video.type === 'youtube' ? (
                               <img src={`https://img.youtube.com/vi/${video.id}/default.jpg`} className="w-full h-full object-cover opacity-80" alt="Thumb" />
                           ) : (
                               <i className="fas fa-film text-2xl text-white/50"></i>
                           )}
                        </div>
                     </div>
                     <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-black rounded-full animate-pulse"></div>
                 </div>
                 <div>
                     <h2 className="font-bold text-lg text-white leading-tight">المعلم الذكي</h2>
                     <p className="text-xs text-gray-400 mt-1">محاكاة الأسلوب: <span className="text-accent">Gemini 3 Pro</span></p>
                 </div>
             </div>
         </div>

         {/* Messages Area */}
         <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar bg-[#0a0a0a]">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] relative group`}>
                        <div className={`
                           px-5 py-3.5 text-sm leading-relaxed rounded-2xl shadow-lg
                           ${msg.role === 'user' 
                             ? 'bg-accent text-black rounded-br-sm font-bold' 
                             : 'bg-[#1e1e1e] text-gray-200 rounded-bl-sm border border-white/5'}
                        `}>
                           {msg.text}
                        </div>
                        {msg.role === 'model' && (
                            <span className="text-[10px] opacity-30 mt-1 block ml-2">AI PERSONA</span>
                        )}
                    </div>
                </div>
            ))}
            {isThinking && (
                <div className="flex justify-start">
                     <div className="bg-[#1e1e1e] px-5 py-4 rounded-2xl rounded-bl-sm flex gap-2 border border-white/5">
                         <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce"></span>
                         <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce delay-100"></span>
                         <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce delay-200"></span>
                     </div>
                </div>
            )}
            <div ref={chatEndRef} />
         </div>

         {/* Input Area */}
         <div className="p-5 border-t border-white/5 bg-[#0a0a0a]">
             <div className="relative">
                 <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                    placeholder="اكتب سؤالك للأستاذ..."
                    className="w-full bg-[#151515] text-white rounded-xl pl-4 pr-14 py-4 text-sm outline-none focus:ring-1 focus:ring-accent resize-none custom-scrollbar border border-white/5 placeholder-gray-600 min-h-[60px]"
                 />
                 <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isThinking}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg flex items-center justify-center transition-all ${input.trim() ? 'bg-accent text-black hover:scale-105 shadow-[0_0_15px_rgba(0,212,255,0.2)]' : 'text-gray-600'}`}
                 >
                     <i className="fas fa-paper-plane"></i>
                 </button>
             </div>
             <p className="text-[10px] text-center text-gray-600 mt-3">
                 يتم تقمص الشخصية باستخدام أقوى نماذج Gemini. قد تكون الإجابات مبنية على أسلوب المتحدث.
             </p>
         </div>
      </div>
    </div>
  );
};

export default VideoStudio;
