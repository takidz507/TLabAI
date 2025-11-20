import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Note, Task } from '../types';

interface BrowserWidgetProps {
  initialUrl: string;
  onClose: () => void;
  isDark: boolean;
  isVisible: boolean;
  notes: Note[];
  tasks: Task[];
}

interface Tab {
  id: string;
  url: string;        
  displayUrl: string; 
  title: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  isProxyActive: boolean;
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

const QUICK_LINKS = [
  { title: 'Google', url: 'https://www.google.com', icon: 'fa-google', color: 'text-red-500' },
  { title: 'YouTube', url: 'https://www.youtube.com', icon: 'fa-youtube', color: 'text-red-600' },
  { title: 'ChatGPT', url: 'https://chatgpt.com', icon: 'fa-robot', color: 'text-green-500' },
  { title: 'Wiki', url: 'https://www.wikipedia.org', icon: 'fa-wikipedia-w', color: 'text-gray-500' },
  { title: 'News', url: 'https://news.google.com', icon: 'fa-newspaper', color: 'text-blue-400' },
  { title: 'X', url: 'https://x.com', icon: 'fa-twitter', color: 'text-black' },
];

const FORCE_PROXY_DOMAINS = [
  'chatgpt.com', 'openai.com', 'x.com', 'twitter.com', 'instagram.com', 
  'facebook.com', 'github.com', 'discord.com', 'linkedin.com'
];

const BrowserWidget: React.FC<BrowserWidgetProps> = ({ initialUrl, onClose, isDark, isVisible, notes, tasks }) => {
  // --- Browser State ---
  const [tabs, setTabs] = useLocalStorage<Tab[]>('taki_browser_tabs_v10', [
    {
      id: 'tab-1',
      url: 'about:blank',
      displayUrl: '',
      title: 'بداية جديدة',
      history: ['about:blank'],
      historyIndex: 0,
      isLoading: false,
      isProxyActive: false
    }
  ]);
  
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [showTabsGrid, setShowTabsGrid] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [isOmniboxOpen, setIsOmniboxOpen] = useState(false);
  
  // --- AI Sidekick State ---
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
      { role: 'model', text: 'أهلاً! أنا مساعد التصفح الذكي (TAKI Sidekick). يمكنني رؤية ملاحظاتك ومهامك، ومساعدتك في البحث أو التلخيص أثناء التصفح. كيف يمكنني خدمتك؟' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    if (initialUrl && initialUrl !== 'about:blank' && isVisible) {
      const currentTab = tabs.find(t => t.id === activeTabId);
      if (currentTab && currentTab.url === 'about:blank') {
        handleNavigate(initialUrl, activeTabId);
      } else {
        createNewTab(initialUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl, isVisible]);

  useEffect(() => {
      if (isAiChatOpen && chatEndRef.current) {
          chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chatMessages, isAiChatOpen]);

  // --- Core Engine ---
  const createNewTab = (url: string = 'about:blank') => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      url: url,
      displayUrl: url === 'about:blank' ? '' : url,
      title: 'صفحة جديدة',
      history: [url],
      historyIndex: 0,
      isLoading: true,
      isProxyActive: false
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    setShowTabsGrid(false);
    
    if (url !== 'about:blank') {
      setTimeout(() => handleNavigate(url, newTab.id), 100);
    }
  };

  const closeTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    if (newTabs.length === 0) {
      createNewTab(); 
    } else {
      setTabs(newTabs);
      if (activeTabId === id) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
    }
  };

  const updateTab = (id: string, updates: Partial<Tab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleNavigate = (inputUrl: string, tabId: string = activeTabId, forceProxy: boolean = false) => {
    let targetUrl = inputUrl.trim();
    let displayUrl = targetUrl;
    let useProxy = forceProxy;

    if (!targetUrl.startsWith('http') && !targetUrl.startsWith('about:')) {
      if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
         targetUrl = `https://${targetUrl}`;
         displayUrl = targetUrl;
      } else {
         targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}&igu=1`; 
         displayUrl = targetUrl;
      }
    }

    const hostname = new URL(targetUrl).hostname.toLowerCase();

    // Auto-detect blocked domains to force proxy
    if (FORCE_PROXY_DOMAINS.some(d => hostname.includes(d))) {
        useProxy = true;
    }

    let finalUrl = targetUrl;

    if (useProxy) {
        // Updated Proxy Strategy: Use Google Translate wrapper as a robust proxy for blocked sites
        finalUrl = `https://translate.google.com/translate?sl=auto&tl=ar&u=${encodeURIComponent(targetUrl)}&client=webapp`;
    } else {
        // Special handling for Google/YouTube to avoid X-Frame-Options
        if (hostname.includes('google.com') && !targetUrl.includes('igu=1') && !targetUrl.includes('translate')) {
             if (targetUrl.includes('/search')) finalUrl += '&igu=1';
             else finalUrl = 'https://www.google.com/webhp?igu=1';
        } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
             if (!targetUrl.includes('/embed/')) {
                const videoId = targetUrl.split('v=')[1]?.split('&')[0];
                if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}`;
             }
        }
    }

    setIsOmniboxOpen(false);
    setAddressInput(displayUrl);
    
    const currentTab = tabs.find(t => t.id === tabId);
    const currentHistory = currentTab?.history || [];
    const currentIndex = currentTab?.historyIndex || 0;
    const newHistory = [...currentHistory.slice(0, currentIndex + 1), displayUrl];

    updateTab(tabId, {
      url: finalUrl,
      displayUrl: displayUrl,
      isLoading: true,
      title: displayUrl,
      isProxyActive: useProxy,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  };

  const toggleMagicFix = () => {
      const currentDisplay = activeTab.displayUrl;
      // Toggle proxy state manually
      handleNavigate(currentDisplay, activeTabId, !activeTab.isProxyActive);
  };

  const handleOmniboxSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleNavigate(addressInput);
  };

  // --- AI Functionality ---
  const handleAiSendMessage = async (e?: FormEvent) => {
      if (e) e.preventDefault();
      if (!chatInput.trim()) return;

      const userMsg = chatInput;
      setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setChatInput('');
      setIsAiThinking(true);

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Prepare Context
        const notesContext = notes.slice(0, 5).map(n => `- ${n.title}: ${n.content.substring(0, 100)}...`).join('\n');
        const tasksContext = tasks.filter(t => !t.completed).map(t => `- ${t.text}`).join('\n');
        const currentUrl = activeTab.displayUrl || "New Tab";

        const systemPrompt = `
            You are Taki Sidekick, an intelligent browser assistant embedded in Taki OS.
            
            USER CONTEXT:
            - Current Page URL: ${currentUrl}
            - User Notes (Recent): 
            ${notesContext || "No notes available."}
            - Pending Tasks:
            ${tasksContext || "No pending tasks."}

            YOUR GOAL:
            Help the user organize their thoughts, answer questions about the page they might be visiting (based on URL/Topic), or manage their notes/tasks.
            
            BEHAVIOR:
            - Be conversational and friendly.
            - If the user asks about the page, infer the content from the URL and your general knowledge.
            - If the user discusses a note, reference the specific note content provided above.
            - Answer in Arabic unless the user speaks English.
        `;

        // Reconstruct chat history for the model
        const historyForModel = chatMessages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        // Append current message
        const contents = [
            { role: 'user', parts: [{ text: systemPrompt }] },
            ...historyForModel, 
            { role: 'user', parts: [{ text: userMsg }] }
        ];

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: contents
        });

        const reply = response.text || "عذراً، حدث خطأ في الاتصال.";
        setChatMessages(prev => [...prev, { role: 'model', text: reply }]);

      } catch (err) {
          console.error(err);
          setChatMessages(prev => [...prev, { role: 'model', text: "حدث خطأ أثناء المعالجة. حاول مرة أخرى." }]);
      } finally {
          setIsAiThinking(false);
      }
  };


  // --- UI Styles ---
  const bgClass = isDark ? 'bg-[#000000]' : 'bg-white';
  const textClass = isDark ? 'text-white' : 'text-black';
  const barClass = isDark ? 'bg-[#1a1a1a]/80 border-white/5' : 'bg-white/80 border-gray-200';
  const glassEffect = 'backdrop-blur-xl saturate-150';

  // --- TABS GRID ---
  if (showTabsGrid) {
    return (
      <div className={`absolute inset-0 z-50 ${bgClass} flex flex-col animate-fade-in`}>
        <div className={`p-5 flex justify-between items-center ${barClass} ${glassEffect} border-b z-10`}>
            <span className={`font-bold text-2xl ${textClass}`}>التبويبات</span>
            <button onClick={() => setShowTabsGrid(false)} className="text-black font-bold px-6 py-2 bg-accent rounded-full shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:scale-105 transition-transform">عودة</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-4 content-start pb-20">
            {tabs.map(tab => (
                <div 
                    key={tab.id} 
                    onClick={() => { setActiveTabId(tab.id); setShowTabsGrid(false); }}
                    className={`relative aspect-[3/4] rounded-3xl border overflow-hidden flex flex-col transition-all active:scale-95 duration-300 ${activeTabId === tab.id ? 'border-accent shadow-[0_0_25px_rgba(0,212,255,0.15)] scale-[1.02]' : 'border-gray-500/20 bg-gray-500/5 scale-100 opacity-80'}`}
                >
                    <div className="flex-1 bg-white relative overflow-hidden">
                         <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                             <i className={`fas ${tab.isProxyActive ? 'fa-bolt text-yellow-500' : 'fa-globe text-blue-500'} text-5xl drop-shadow-xl`}></i>
                         </div>
                         {tab.displayUrl && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                                <p className="text-white text-xs truncate opacity-80">{tab.displayUrl}</p>
                            </div>
                         )}
                    </div>
                    <div className={`p-4 ${isDark ? 'bg-[#252525]' : 'bg-white'} flex items-center justify-between gap-2 border-t border-gray-500/10`}>
                        <span className={`text-sm font-bold truncate flex-1 ${textClass}`}>{tab.title || 'صفحة جديدة'}</span>
                        <button 
                            onClick={(e) => closeTab(e, tab.id)}
                            className="w-7 h-7 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                        >
                            <i className="fas fa-times text-xs"></i>
                        </button>
                    </div>
                </div>
            ))}
            <button 
                onClick={() => createNewTab()}
                className="aspect-[3/4] rounded-3xl border-2 border-dashed border-gray-500/30 flex flex-col items-center justify-center gap-3 hover:bg-white/5 active:scale-95 transition-all group cursor-pointer"
            >
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform shadow-lg shadow-accent/10">
                    <i className="fas fa-plus text-3xl"></i>
                </div>
                <span className="text-base opacity-50 font-bold group-hover:opacity-100 transition-opacity">تبويب جديد</span>
            </button>
        </div>
      </div>
    );
  }

  // --- BROWSER RENDER ---
  return (
    <div className={`absolute inset-0 flex flex-col ${bgClass} transition-colors duration-500`}>
      
      {/* --- Browser Content --- */}
      <div className="flex-1 relative overflow-hidden bg-white">
        {/* Close Button */}
        <button 
           onClick={onClose}
           className="absolute top-safe left-4 z-[100] w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg border border-white/10 mt-4 group"
        >
            <i className="fas fa-times text-sm group-hover:rotate-90 transition-transform duration-300"></i>
        </button>

        {/* AI Chat Sidekick Overlay */}
        <div className={`absolute top-0 right-0 bottom-0 w-full md:w-[400px] z-[200] pointer-events-none overflow-hidden transition-transform duration-500 ease-out ${isAiChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className={`h-full w-full flex flex-col ${isDark ? 'bg-[#1a1a1a]/95' : 'bg-white/95'} backdrop-blur-2xl border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] pointer-events-auto`}>
               {/* Chat Header */}
               <div className="p-5 border-b border-white/5 flex justify-between items-center bg-accent/5">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black shadow-[0_0_15px_rgba(0,212,255,0.4)]">
                          <i className="fas fa-robot animate-pulse-slow"></i>
                      </div>
                      <div>
                          <h3 className={`font-bold text-lg ${textClass}`}>TAKI Sidekick</h3>
                          <p className="text-[10px] opacity-60 uppercase tracking-wider">Smart Browser Assistant</p>
                      </div>
                  </div>
                  <button onClick={() => setIsAiChatOpen(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                      <i className={`fas fa-chevron-right ${textClass}`}></i>
                  </button>
               </div>

               {/* Chat Messages */}
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                   {chatMessages.map((msg, idx) => (
                       <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-accent text-black rounded-br-none font-medium' : `${isDark ? 'bg-white/10 text-gray-200' : 'bg-gray-100 text-gray-800'} rounded-bl-none`}`}>
                               {msg.text}
                           </div>
                       </div>
                   ))}
                   {isAiThinking && (
                       <div className="flex justify-start">
                           <div className={`p-3 rounded-2xl rounded-bl-none ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                               <div className="flex gap-1">
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                               </div>
                           </div>
                       </div>
                   )}
                   <div ref={chatEndRef} />
               </div>

               {/* Chat Input */}
               <div className="p-4 border-t border-white/5">
                   <form onSubmit={handleAiSendMessage} className="relative">
                       <input 
                          type="text" 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="اسأل عن الصفحة أو ملاحظاتك..."
                          className={`w-full pl-4 pr-12 py-3 rounded-xl text-sm outline-none transition-all ${isDark ? 'bg-black/30 text-white focus:bg-black/50' : 'bg-gray-100 text-gray-800 focus:bg-white border border-transparent focus:border-accent'}`}
                       />
                       <button 
                          type="submit"
                          disabled={!chatInput.trim()}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${chatInput.trim() ? 'bg-accent text-black hover:scale-105' : 'text-gray-500 opacity-50'}`}
                       >
                           <i className="fas fa-paper-plane text-xs"></i>
                       </button>
                   </form>
               </div>
           </div>
        </div>

        {activeTab.url === 'about:blank' ? (
            // --- NEW TAB PAGE ---
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 animate-fade-in overflow-y-auto ${isDark ? 'bg-[#121212]' : 'bg-[#f8f9fa]'}`}>
                <div className="text-center mb-16 relative group">
                     <div className="absolute -inset-10 bg-accent/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                     <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-400 to-gray-600 select-none relative z-10 drop-shadow-lg">
                        TAKI <span className="text-accent">OS</span>
                     </h1>
                     <div className="flex items-center justify-center gap-3">
                        <span className="px-3 py-1 rounded-full border border-gray-500/20 text-[10px] font-mono opacity-50 uppercase tracking-widest">Secure</span>
                        <span className="px-3 py-1 rounded-full border border-gray-500/20 text-[10px] font-mono opacity-50 uppercase tracking-widest">Fast</span>
                        <span className="px-3 py-1 rounded-full border border-gray-500/20 text-[10px] font-mono opacity-50 uppercase tracking-widest">Intelligent</span>
                     </div>
                </div>
                
                <div className="w-full max-w-3xl px-4 relative z-10">
                     <div className="grid grid-cols-3 sm:grid-cols-6 gap-6">
                        {QUICK_LINKS.map((link, idx) => (
                            <button 
                                key={idx}
                                onClick={() => handleNavigate(link.url)}
                                className="flex flex-col items-center gap-4 group"
                            >
                                <div className={`w-20 h-20 rounded-[2rem] ${isDark ? 'bg-[#1e1e1e] border-white/5' : 'bg-white border-gray-100'} shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-center text-3xl transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,212,255,0.15)] ${link.color} group-active:scale-95 border`}>
                                    <i className={`fab ${link.icon} fas`}></i>
                                </div>
                                <span className={`text-xs font-bold opacity-60 group-hover:opacity-100 group-hover:text-accent transition-all ${textClass}`}>{link.title}</span>
                            </button>
                        ))}
                     </div>
                     
                     <div className={`mt-16 p-1 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-black/5'} backdrop-blur-sm flex items-center`}>
                         <div className="w-10 h-10 flex items-center justify-center opacity-50">
                             <i className="fas fa-search"></i>
                         </div>
                         <input 
                            type="text"
                            placeholder="ابحث في الويب أو أدخل رابطاً..."
                            className="flex-1 bg-transparent border-none outline-none text-lg p-2 text-center placeholder-gray-500 opacity-80"
                            onKeyDown={(e) => { if(e.key === 'Enter') handleNavigate(e.currentTarget.value); }}
                         />
                     </div>
                </div>
            </div>
        ) : (
            // --- ACTIVE PAGE FRAME ---
            <>
                {activeTab.isLoading && (
                    <div className="absolute top-0 left-0 w-full h-1 z-30 bg-accent/10 overflow-hidden">
                         <div className="h-full bg-accent animate-shimmer-loading shadow-[0_0_15px_#00d4ff]"></div>
                    </div>
                )}

                <iframe
                    ref={iframeRef}
                    src={activeTab.url}
                    className="w-full h-full border-none bg-white"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation allow-top-navigation-by-user-activation"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; camera; microphone; geolocation"
                    onLoad={() => updateTab(activeTabId, { isLoading: false })}
                    title="browser-frame"
                />
            </>
        )}
      </div>

      {/* --- Omnibox Sheet (Pull-up) --- */}
      <div 
        className={`absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-all duration-300 flex flex-col justify-end ${isOmniboxOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsOmniboxOpen(false)}
      >
         <div 
            className={`w-full ${isDark ? 'bg-[#1e1e1e] border-t border-white/10' : 'bg-white'} rounded-t-[2.5rem] p-6 pb-12 shadow-[0_-20px_80px_rgba(0,0,0,0.6)] transform transition-transform duration-300 ease-out ${isOmniboxOpen ? 'translate-y-0' : 'translate-y-full'}`} 
            onClick={e => e.stopPropagation()}
         >
             <div className="w-12 h-1.5 bg-gray-500/20 rounded-full mx-auto mb-8"></div>
             
             <form onSubmit={handleOmniboxSubmit} className="relative mb-4">
                 <div className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${isDark ? 'bg-black/30 border-white/5 focus-within:border-accent/50' : 'bg-gray-50 border-gray-200 focus-within:border-accent/50'}`}>
                     <i className="fas fa-globe text-gray-500 text-xl"></i>
                     <input 
                        autoFocus={isOmniboxOpen}
                        type="text" 
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="أدخل رابطاً أو كلمات بحث..."
                        className={`flex-1 bg-transparent border-none outline-none text-xl dir-ltr font-medium ${textClass} placeholder-gray-500`}
                     />
                     {addressInput && (
                        <button type="button" onClick={() => setAddressInput('')} className="w-8 h-8 flex items-center justify-center bg-gray-500/20 rounded-full hover:bg-gray-500/40 transition-colors">
                            <i className="fas fa-times text-gray-400 text-xs"></i>
                        </button>
                     )}
                 </div>
             </form>
             <button 
                onClick={handleOmniboxSubmit} 
                className="w-full py-4 bg-accent text-black font-bold text-lg rounded-2xl shadow-[0_10px_30px_rgba(0,212,255,0.2)] hover:scale-[1.02] active:scale-95 transition-all"
             >
                الذهاب <i className="fas fa-arrow-left mr-2"></i>
             </button>
         </div>
      </div>

      {/* --- Bottom Navigation Bar (Modern Dock) --- */}
      <div className={`h-[90px] ${barClass} ${glassEffect} border-t flex items-center justify-between px-4 pb-6 pt-2 relative z-50`}>
         
         {/* Navigation */}
         <div className="flex items-center gap-4 w-[20%] justify-start">
            <button 
                onClick={() => {
                    if (activeTab.historyIndex > 0) {
                        const idx = activeTab.historyIndex - 1;
                        const prevUrl = activeTab.history[idx];
                        handleNavigate(prevUrl, activeTabId); 
                    }
                }} 
                disabled={activeTab.historyIndex <= 0} 
                className={`w-11 h-11 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-transform rounded-full hover:bg-gray-500/10 ${textClass}`}
            >
                <i className="fas fa-chevron-right text-xl"></i>
            </button>
         </div>

         {/* Address Bar (Floating Capsule) */}
         <div className="flex-1 max-w-[60%] mx-2 perspective-[1000px]">
            <div 
                className={`h-[50px] rounded-[1.5rem] ${isDark ? 'bg-black/20 hover:bg-black/40' : 'bg-gray-100 hover:bg-gray-200'} backdrop-blur-md flex items-center justify-between px-1 pl-4 cursor-text active:scale-95 transition-all border border-transparent hover:border-accent/20 shadow-sm`}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => { setAddressInput(activeTab.url === 'about:blank' ? '' : activeTab.displayUrl); setIsOmniboxOpen(true); }}>
                    {activeTab.url.includes('https') && <i className="fas fa-lock text-[10px] text-green-500"></i>}
                    <span className={`text-sm font-bold opacity-90 truncate dir-ltr flex-1 text-center ${textClass}`}>
                        {activeTab.displayUrl ? new URL(activeTab.displayUrl).hostname.replace('www.','') : 'بحث أو رابط'}
                    </span>
                </div>
                
                {/* Actions Group */}
                <div className="flex items-center gap-1 bg-gray-500/10 rounded-full p-1 ml-1">
                    {/* Magic Fix */}
                    <button 
                        onClick={(e) => { e.stopPropagation(); toggleMagicFix(); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${activeTab.isProxyActive ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'hover:bg-black/10 text-gray-400'}`}
                    >
                        <i className={`fas ${activeTab.isProxyActive ? 'fa-bolt' : 'fa-magic'} text-xs`}></i>
                    </button>
                    
                    {/* AI Sidekick Trigger */}
                     <button 
                        onClick={(e) => { e.stopPropagation(); setIsAiChatOpen(!isAiChatOpen); }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isAiChatOpen ? 'bg-accent text-black shadow-[0_0_10px_rgba(0,212,255,0.5)]' : 'hover:bg-black/10 text-gray-400 hover:text-accent'}`}
                    >
                        <i className="fas fa-robot text-xs"></i>
                    </button>
                </div>
            </div>
         </div>

         {/* Tabs Trigger */}
         <div className="flex items-center gap-4 w-[20%] justify-end">
            <button onClick={() => setShowTabsGrid(true)} className={`w-11 h-11 flex items-center justify-center active:scale-90 transition-transform relative ${textClass} hover:bg-gray-500/10 rounded-full`}>
                <div className="w-6 h-6 border-[2.5px] border-current rounded-[0.5rem] flex items-center justify-center text-[10px] font-black pt-0.5">
                    {tabs.length}
                </div>
            </button>
         </div>

      </div>
    </div>
  );
};

export default BrowserWidget;