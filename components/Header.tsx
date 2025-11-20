
import React, { useState, FormEvent } from 'react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onSmartSearch: (query: string) => void;
  isDark: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onSmartSearch, isDark }) => {
  const [query, setQuery] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSmartSearch(query);
  };

  const startVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'ar-SA';
      
      recognition.onstart = () => {
        setIsRecording(true);
        setQuery('');
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        onSmartSearch(transcript);
      };
      
      recognition.start();
    } else {
      alert("عذراً، متصفحك لا يدعم البحث الصوتي.");
    }
  };

  const bgInput = isDark ? 'bg-white/5 focus:bg-white/10 text-white' : 'bg-black/5 focus:bg-black/10 text-gray-800';
  const borderColor = isDark ? 'border-white/10' : 'border-black/5';

  return (
    <header className="text-center mb-8 relative z-20">
      <div className="flex items-center justify-center gap-3 mb-6">
        <h1 className={`text-3xl md:text-4xl font-light tracking-widest uppercase bg-gradient-to-r ${isDark ? 'from-white to-gray-500' : 'from-gray-800 to-gray-500'} bg-clip-text text-transparent`}>
            TAKI <span className="text-[0.5em] font-bold bg-accent text-black px-1 rounded align-top opacity-80">OS</span>
        </h1>
      </div>

      <div className="relative max-w-[600px] mx-auto mb-6 group">
        <div className={`absolute inset-0 bg-accent/20 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500`}></div>
        <i className="fas fa-search absolute right-5 top-1/2 -translate-y-1/2 text-accent z-10"></i>
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full py-4 pr-[55px] pl-[50px] rounded-3xl border ${borderColor} ${bgInput} text-lg backdrop-blur-md outline-none transition-all duration-300 shadow-lg focus:scale-[1.02] placeholder-gray-500`}
            placeholder={isRecording ? "جاري الاستماع..." : "اسأل TAKI عن أي شيء (بحث ذكي)..."}
            autoComplete="off"
          />
        </form>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
             {query && (
                <i 
                    className="fas fa-times-circle text-gray-400 hover:text-white cursor-pointer p-2"
                    onClick={() => setQuery('')}
                ></i>
             )}
            <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-white/10 text-gray-400'}`}
                onClick={startVoiceSearch}
            >
                <i className="fas fa-microphone"></i>
            </div>
        </div>
      </div>

      <div className="flex justify-center gap-3 flex-wrap">
        <button 
          onClick={() => onSmartSearch(query)}
          className="px-6 py-2.5 rounded-xl bg-accent text-black font-bold shadow-[0_4px_20px_rgba(0,212,255,0.2)] hover:shadow-[0_4px_25px_rgba(0,212,255,0.4)] hover:-translate-y-0.5 transition-all active:scale-95 text-sm"
        >
          <i className="fas fa-bolt ml-2"></i>بحث شامل
        </button>
        <button 
          onClick={() => onSmartSearch("لخص لي أهم الأخبار التقنية اليوم")}
          className={`px-6 py-2.5 rounded-xl border ${borderColor} ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-all active:scale-95 text-sm flex items-center`}
        >
           <i className="fas fa-newspaper ml-2 text-blue-400"></i> أخبار اليوم
        </button>
         <button 
          onClick={() => onSmartSearch("اقترح لي صورة لخلفية سطح مكتب هادئة")}
          className={`px-6 py-2.5 rounded-xl border ${borderColor} ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-white text-gray-700 hover:bg-gray-50'} transition-all active:scale-95 text-sm flex items-center`}
        >
           <i className="fas fa-image ml-2 text-purple-400"></i> صور
        </button>
      </div>
    </header>
  );
};

export default Header;
