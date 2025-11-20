
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI } from "@google/genai";
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import NotesWidget from './components/NotesWidget';
import TodoWidget from './components/TodoWidget';
import FloatingPlayer from './components/FloatingPlayer';
import SyncModal from './components/SyncModal';
import SearchResults from './components/SearchResults';
import BrowserWidget from './components/BrowserWidget';
import PdfViewer from './components/PdfViewer';
import VideoStudio from './components/VideoStudio';
import LockScreen from './components/LockScreen';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Task, Theme, Note, PdfFile, VideoFile } from './types';

function App() {
  // --- Security State ---
  // Initialize lock state synchronously to prevent "flash of unlocked content"
  const getInitialLockState = () => {
    if (typeof window === 'undefined') return false;
    // Check directly if the encrypted pin exists in storage
    const pin = window.localStorage.getItem('taki_security_pin');
    return !!pin;
  };

  const [securityPin, setSecurityPin] = useLocalStorage<string>('taki_security_pin', '');
  const [isLocked, setIsLocked] = useState<boolean>(getInitialLockState());

  const handleLockSystem = () => {
    setIsLocked(true);
  };

  const handleUnlock = (pin: string) => {
    if (pin === securityPin) {
      setIsLocked(false);
      return true;
    }
    return false;
  };

  const handleSetPin = (pin: string) => {
    setSecurityPin(pin);
    showNotification("تم تفعيل الحماية السيادية وتشفير البيانات 🛡️");
    setIsLocked(false); 
  };


  const [activeSection, setActiveSection] = useState('home');
  
  // --- Notes State Management (Encrypted automatically by hook) ---
  const [notes, setNotes] = useLocalStorage<Note[]>('taki_notes_v3', []);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  useEffect(() => {
    const oldNotes = localStorage.getItem('taki_notes_v2');
    if (oldNotes) {
      try {
        const currentV3 = localStorage.getItem('taki_notes_v3');
        if (!currentV3 || (currentV3.startsWith('[') && JSON.parse(currentV3).length === 0)) {
           const migratedNote: Note = {
             id: Date.now().toString(),
             title: 'ملاحظة مؤرشفة',
             content: oldNotes.replace(/^"|"$/g, ''),
             updatedAt: Date.now()
           };
           setNotes([migratedNote]);
        }
      } catch (e) {
        console.error("Migration failed", e);
      }
    }
  }, []);

  const [tasks, setTasks] = useLocalStorage<Task[]>('taki_tasks_v2', []);
  const [theme, setTheme] = useState<Theme>('dark');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // --- Files State ---
  const [currentPdf, setCurrentPdf] = useState<PdfFile | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // --- Search & Browser State ---
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [browserUrl, setBrowserUrl] = useState<string>('https://www.google.com');
  const [searchResult, setSearchResult] = useState<{
    text: string;
    sources: Array<{ title: string; url: string }>;
    related: string[];
  } | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Drag & Drop Handlers ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
        if (file.type === 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                const base64Data = result.split(',')[1];
                const blobUrl = URL.createObjectURL(file);
                
                setCurrentPdf({
                    name: file.name,
                    data: base64Data,
                    url: blobUrl
                });
                setActiveSection('pdf');
                showNotification(`تم فتح الملف: ${file.name}`);
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
             // Handle Local Video Drop
             const reader = new FileReader();
             reader.onload = (event) => {
                 const result = event.target?.result as string;
                 const base64Data = result.split(',')[1];
                 const blobUrl = URL.createObjectURL(file);
                 
                 setCurrentVideo({
                     type: 'local',
                     name: file.name,
                     url: blobUrl,
                     data: base64Data,
                     mimeType: file.type
                 });
                 setActiveSection('video_studio');
                 showNotification(`تم فتح الفيديو: ${file.name} في الاستوديو 🎬`);
             };
             reader.readAsDataURL(file);
        } else {
            showNotification("نوع الملف غير مدعوم حالياً.");
        }
    }
  }, []);


  // --- Notes Handlers ---
  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: '',
      content: '',
      updatedAt: Date.now()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const handleUpdateNote = (id: string, title: string, content: string) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, title, content, updatedAt: Date.now() } : note
    );
    setNotes(updatedNotes);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
    showNotification("تم حذف الملاحظة 🗑️");
  };

  // --- Sync Handler ---
  const handleImportData = (data: any) => {
    if (data.notes) setNotes(data.notes);
    if (data.tasks) setTasks(data.tasks);
    if (data.theme) setTheme(data.theme);
    showNotification("تمت المزامنة بنجاح! أهلاً بك في جهازك الجديد 🚀");
  };

  // --- Video Helper ---
  const extractVideoId = (text: string): string | null => {
    if (!text) return null;
    // Robust Regex for YouTube Links including share, shorts, live, etc.
    // This matches standard, shortened, and embedded links, and shared links with parameters
    const regExp = /(?:https?:\/\/)?(?:www\.|m\.|music\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([\w-]{11})(?:[&?].*)?/;
    const match = text.match(regExp);
    return match ? match[1] : null;
  };

  const triggerVideoCheck = () => {
    let textToSearch = "";
    if (activeNoteId) {
      const note = notes.find(n => n.id === activeNoteId);
      if (note) textToSearch = note.content;
    } else {
      textToSearch = notes.map(n => n.content).join(" ");
    }

    const foundVideoId = extractVideoId(textToSearch);
    if (foundVideoId) {
      // Open in Studio instead of Floating Player for better experience
      setCurrentVideo({
          type: 'youtube',
          id: foundVideoId,
          url: `https://www.youtube.com/watch?v=${foundVideoId}`,
          name: 'فيديو من الملاحظات'
      });
      setActiveSection('video_studio');
      showNotification("تم نقل الفيديو إلى الاستوديو 🎬");
    } else {
      showNotification("لم يتم العثور على رابط في الملاحظات 🚫");
    }
  };

  // --- Browser Logic ---
  const handleOpenBrowser = (url: string) => {
    setBrowserUrl(url);
    setActiveSection('browser');
  };

  // --- AI Search Logic ---
  const performAiSearch = async (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    setActiveSection('search');
    setSearchResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `User Query: "${query}". Use Google Search. Provide a direct answer with headings. End with "---RELATED---" and 3 topics.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });

      const fullText = response.text || "لم يتم العثور على نتائج.";
      const [mainText, relatedPart] = fullText.split('---RELATED---');
      const relatedTopics = relatedPart ? relatedPart.split('\n').map(s => s.trim()).filter(s => s.length > 0) : [];

      const groundingChunks = (response.candidates?.[0]?.groundingMetadata as any)?.groundingChunks || [];
      const sources: Array<{ title: string; url: string }> = [];
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
           sources.push({ title: chunk.web.title, url: chunk.web.uri });
        }
      });

      setSearchResult({
        text: mainText.trim(),
        sources: sources.slice(0, 8), 
        related: relatedTopics
      });

    } catch (error) {
      console.error(error);
      setSearchResult({
        text: "### خطأ في الاتصال",
        sources: [],
        related: []
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSmartSearch = (query: string) => {
    if (!query) return;
    
    // Check for YouTube Link FIRST
    const foundVideoId = extractVideoId(query);
    if (foundVideoId) {
      setCurrentVideo({
          type: 'youtube',
          id: foundVideoId,
          url: `https://www.youtube.com/watch?v=${foundVideoId}`,
          name: 'YouTube Video'
      });
      setActiveSection('video_studio');
      showNotification("جارٍ فتح الاستوديو السينمائي... 🍿");
      return;
    }

    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (urlPattern.test(query) && !query.includes(' ')) {
        let targetUrl = query;
        if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
        handleOpenBrowser(targetUrl);
        return;
    }

    performAiSearch(query);
  };

  const handleSaveSearchToNote = (text: string, sources: Array<{ title: string; url: string }>) => {
    const sourceText = sources.length > 0 
      ? `\n\n--- المصادر ---\n${sources.map(s => `- ${s.title}: ${s.url}`).join('\n')}`
      : '';
    
    const newNote: Note = {
      id: Date.now().toString(),
      title: `بحث: ${searchQuery}`,
      content: `${text}${sourceText}`,
      updatedAt: Date.now()
    };

    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id); 
    showNotification("تم الحفظ في دفتر الملاحظات 📔");
  };

  const handleSaveDiscussion = (title: string, content: string) => {
      const newNote: Note = {
          id: Date.now().toString(),
          title: title,
          content: content,
          updatedAt: Date.now()
      };
      setNotes([newNote, ...notes]);
      setActiveNoteId(newNote.id);
      showNotification("تم حفظ الجلسة 💾");
  };

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  
  const clearData = () => {
    if (window.confirm("تحذير: سيتم حذف جميع الملاحظات والمهام وتصفير الحماية!")) {
      setNotes([]);
      setTasks([]);
      setActiveNoteId(null);
      setSecurityPin('');
      setIsLocked(false);
      // We need to manually clear local storage keys as well to remove the encrypted strings
      localStorage.removeItem('taki_notes_v3');
      localStorage.removeItem('taki_tasks_v2');
      localStorage.removeItem('taki_security_pin');
      localStorage.removeItem('taki_browser_tabs_v10');
      showNotification("تم تصفير البيانات والحماية 🧹");
    }
  };

  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#0f0f0f] text-gray-100' : 'bg-[#f0f2f5] text-gray-800';
  const gradientOverlay = isDark
    ? { backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(0, 212, 255, 0.12) 0%, transparent 25%), radial-gradient(circle at 85% 75%, rgba(255, 0, 128, 0.08) 0%, transparent 25%)' }
    : { backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(0, 212, 255, 0.08) 0%, transparent 25%), radial-gradient(circle at 85% 75%, rgba(255, 0, 128, 0.05) 0%, transparent 25%)' };

  return (
    <div 
        className={`min-h-screen w-full overflow-hidden transition-colors duration-500 ${bgClass} relative`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
      {/* --- SECURITY LAYER --- */}
      <LockScreen 
        isLocked={isLocked}
        hasPin={!!securityPin}
        onUnlock={handleUnlock}
        onSetPin={handleSetPin}
      />

      <div className="fixed inset-0 pointer-events-none z-0" style={gradientOverlay} />

      {/* Drop Zone Overlay */}
      {isDragging && (
          <div className="fixed inset-0 z-[5000] bg-accent/20 backdrop-blur-sm border-4 border-accent border-dashed m-4 rounded-[3rem] flex items-center justify-center pointer-events-none animate-pulse">
              <div className="bg-black/80 p-8 rounded-3xl text-center">
                  <i className="fas fa-cloud-upload-alt text-6xl text-accent mb-4"></i>
                  <h2 className="text-2xl font-bold text-white">أفلت ملف (PDF أو فيديو) هنا</h2>
                  <p className="text-gray-400 mt-2">لفتح الاستوديو أو العارض الذكي</p>
              </div>
          </div>
      )}

      {/* Notifications */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 bg-accent text-black px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(0,212,255,0.3)] font-bold z-[2000] transition-all duration-300 pointer-events-none flex items-center gap-2 backdrop-blur-md ${notification ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <i className="fas fa-info-circle"></i> {notification}
      </div>

      {/* Browser Layer */}
      <div 
        className={`fixed inset-0 z-[5000] transition-all duration-300 bg-black ${activeSection === 'browser' ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-[100vh] opacity-0 pointer-events-none'}`}
      >
         <BrowserWidget 
            initialUrl={browserUrl}
            onClose={() => setActiveSection('home')}
            isDark={isDark}
            isVisible={activeSection === 'browser'}
            notes={notes}
            tasks={tasks}
        />
      </div>
      
      {/* PDF Viewer Layer */}
       {currentPdf && activeSection === 'pdf' && (
          <PdfViewer 
            file={currentPdf}
            onClose={() => { setActiveSection('home'); setCurrentPdf(null); }}
            onSaveToNotes={handleSaveDiscussion}
            isDark={isDark}
          />
       )}

       {/* Video Studio Layer */}
       {currentVideo && activeSection === 'video_studio' && (
           <VideoStudio
              video={currentVideo}
              onClose={() => { setActiveSection('home'); setCurrentVideo(null); }}
              onSaveToNotes={handleSaveDiscussion}
              isDark={isDark}
           />
       )}


      <div className="relative z-10 flex flex-col h-screen md:flex-row">
        <Sidebar 
          activeSection={activeSection}
          onNavigate={(section) => { setActiveSection(section); }}
          onAnalyzeVideo={triggerVideoCheck}
          onToggleTheme={toggleTheme}
          onClearData={clearData}
          onOpenSync={() => setIsSyncModalOpen(true)}
          onLockSystem={handleLockSystem}
          theme={theme}
        />

        <main className="flex-1 relative overflow-y-auto overflow-x-hidden pb-32 md:pb-0 h-full">
          {activeSection === 'search' ? (
             <SearchResults 
                query={searchQuery}
                isLoading={isSearching}
                result={searchResult}
                isDark={isDark}
                onClose={() => setActiveSection('home')}
                onRelatedClick={performAiSearch}
                onSaveToNote={handleSaveSearchToNote}
                onOpenBrowser={handleOpenBrowser}
             />
          ) : (
            <div className="max-w-[1800px] w-[94%] md:w-[90%] mx-auto py-12 md:py-16">
              <div className="animate-fade-in mb-12 md:mb-16">
                <Header onSearch={handleSmartSearch} onSmartSearch={handleSmartSearch} isDark={isDark} />
              </div>

              {/* THE ZEN GRID */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 md:gap-12">
                <div className="xl:col-span-7 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                  <NotesWidget 
                    notes={notes}
                    activeNoteId={activeNoteId}
                    onSelectNote={setActiveNoteId}
                    onCreateNote={handleCreateNote}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    isDark={isDark}
                  />
                </div>
                
                <div className="xl:col-span-5 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                  <TodoWidget 
                    tasks={tasks} 
                    setTasks={setTasks} 
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      
      <SyncModal 
        isOpen={isSyncModalOpen} 
        onClose={() => setIsSyncModalOpen(false)}
        notes={notes}
        tasks={tasks}
        theme={theme}
        onImportData={handleImportData}
        isDark={isDark}
      />
      
      <FloatingPlayer
         videoId={videoId}
         onClose={() => setVideoId(null)}
         isDark={isDark}
      />
    </div>
  );
}

export default App;
