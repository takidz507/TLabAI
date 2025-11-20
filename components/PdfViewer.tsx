import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PdfFile } from '../types';

interface PdfViewerProps {
  file: PdfFile;
  onClose: () => void;
  onSaveToNotes: (title: string, content: string) => void;
  isDark: boolean;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ file, onClose, onSaveToNotes, isDark }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `مرحباً! لقد قمت بتحليل ملف "${file.name}". أنا جاهز لمساعدتك في تلخيصه أو الإجابة على أي استفسار بخصوصه.` }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatOpen]);

  const handlePrint = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.print();
    }
  };

  const handleSaveDiscussion = () => {
    const discussionText = messages
      .map(m => `**${m.role === 'user' ? 'أنت' : 'TAKI AI'}:** ${m.text}`)
      .join('\n\n');
    
    onSaveToNotes(
      `مناقشة PDF: ${file.name}`,
      `ملف: ${file.name}\nالتاريخ: ${new Date().toLocaleDateString()}\n\n--- المناقشة ---\n${discussionText}`
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
      
      // Construct the content for Gemini 3 Pro
      // We need to send the PDF inline data in the FIRST user message effectively
      // and include the conversation history.
      
      const contentParts = [];

      // 1. Add the PDF and initial context as the first "turn"
      // Ideally, we should maintain a proper history array for the API.
      // Since we are using generateContent (stateless), we reconstruct the full history.
      
      const historyForModel = [];

      // First Message: User (contains PDF + initial prompt or just context)
      historyForModel.push({
          role: 'user',
          parts: [
              { 
                  inlineData: { 
                      mimeType: 'application/pdf', 
                      data: file.data 
                  } 
              },
              { text: "Analyze this PDF document. I will ask questions about it." }
          ]
      });

      // First Message: Model (Acknowledgment)
      historyForModel.push({
          role: 'model',
          parts: [{ text: "Understood. I have analyzed the document." }]
      });

      // Append the rest of the visible chat history (skipping the welcome message if it's local-only, but here we treat welcome as local)
      // We start mapping from index 1 (User's first actual question)
      for (let i = 1; i < messages.length; i++) {
          historyForModel.push({
              role: messages[i].role,
              parts: [{ text: messages[i].text }]
          });
      }

      // Append current user message (already added to state, so it's the last one)
      historyForModel.push({
          role: 'user',
          parts: [{ text: userMsg }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: historyForModel,
        config: {
            systemInstruction: "You are an intelligent research assistant. You are analyzing a PDF file provided by the user. Answer accurately based on the file content. Keep the conversation memory.",
        }
      });

      const reply = response.text || "لم أستطع قراءة الرد.";
      setMessages(prev => [...prev, { role: 'model', text: reply }]);

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "عذراً، حدث خطأ أثناء تحليل الملف أو الاتصال بالخادم." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const bgClass = isDark ? 'bg-[#0f0f0f]' : 'bg-[#f0f2f5]';
  const glass = isDark ? 'bg-[#1e1e1e]/90 border-white/10' : 'bg-white/90 border-gray-200';
  const text = isDark ? 'text-white' : 'text-gray-800';

  return (
    <div className={`fixed inset-0 z-[6000] flex flex-col ${bgClass} animate-fade-in`}>
      
      {/* --- Header --- */}
      <div className={`h-16 flex items-center justify-between px-6 border-b ${glass} backdrop-blur-md z-20`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
            <i className="fas fa-file-pdf text-xl"></i>
          </div>
          <div className="flex flex-col">
            <h2 className={`font-bold text-sm md:text-base ${text} truncate max-w-[200px] md:max-w-md`}>{file.name}</h2>
            <span className="text-[10px] opacity-50 font-mono">POWERED BY GEMINI 3 PRO</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={handleSaveDiscussion}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'} ${text}`}
            title="حفظ النقاش في الملاحظات"
          >
            <i className="fas fa-save"></i> <span className="hidden md:inline">حفظ النقاش</span>
          </button>
          
          <button 
            onClick={handlePrint}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'} ${text}`}
          >
            <i className="fas fa-print"></i> <span className="hidden md:inline">طباعة</span>
          </button>

          <div className="h-6 w-px bg-gray-500/20 mx-2"></div>

          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isChatOpen ? 'bg-accent text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]' : 'bg-gray-500/10 text-gray-400'}`}
          >
            <i className="fas fa-comment-alt"></i>
          </button>

          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* --- Main Content --- */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* PDF Frame */}
        <div className={`flex-1 h-full relative bg-gray-800 transition-all duration-300 ${isChatOpen ? 'w-2/3' : 'w-full'}`}>
           <iframe 
             ref={iframeRef}
             src={file.url}
             className="w-full h-full border-none"
             title="PDF Viewer"
           />
        </div>

        {/* AI Sidebar */}
        <div className={`
            absolute top-0 right-0 bottom-0 md:relative z-10
            w-full md:w-[400px] border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.3)]
            flex flex-col transition-transform duration-300 ease-in-out
            ${isChatOpen ? 'translate-x-0' : 'translate-x-full hidden md:flex md:w-0 md:border-none'}
            ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}
        `}>
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed animate-slide-up ${msg.role === 'user' ? 'bg-accent text-black rounded-br-none font-bold' : `${isDark ? 'bg-white/5 text-gray-200' : 'bg-gray-100 text-gray-800'} rounded-bl-none`}`}>
                          {msg.text}
                      </div>
                  </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                    <div className={`p-4 rounded-2xl rounded-bl-none ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <div className="flex gap-1.5">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                    </div>
                </div>
              )}
              <div ref={chatEndRef}></div>
           </div>

           <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-[#121212]' : 'border-gray-100 bg-gray-50'}`}>
              <form onSubmit={handleSend} className="relative">
                  <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="اسأل Gemini عن هذا الملف..."
                    className={`w-full pl-4 pr-12 py-4 rounded-xl text-sm outline-none transition-all ${isDark ? 'bg-black/30 text-white focus:ring-1 focus:ring-accent' : 'bg-white text-gray-800 shadow-sm border border-gray-200 focus:border-accent'}`}
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isThinking}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center transition-all ${input.trim() ? 'bg-accent text-black hover:scale-110' : 'text-gray-400'}`}
                  >
                      <i className="fas fa-paper-plane"></i>
                  </button>
              </form>
           </div>
        </div>

      </div>
    </div>
  );
};

export default PdfViewer;