
import React, { useState, useEffect } from 'react';

interface SearchResultProps {
  query: string;
  isLoading: boolean;
  result: {
    text: string;
    sources: Array<{ title: string; url: string }>;
    related: string[];
  } | null;
  isDark: boolean;
  onClose: () => void;
  onRelatedClick: (query: string) => void;
  onSaveToNote: (text: string, sources: Array<{ title: string; url: string }>) => void;
  onOpenBrowser: (url: string) => void;
}

const SearchResults: React.FC<SearchResultProps> = ({ 
  query, 
  isLoading, 
  result, 
  isDark, 
  onClose, 
  onRelatedClick,
  onSaveToNote,
  onOpenBrowser
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const bgClass = isDark ? 'bg-[#0f0f0f]' : 'bg-[#f0f2f5]';
  const cardBg = isDark ? 'bg-[#1e1e1e]/80 border-white/10' : 'bg-white/80 border-gray-200';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';

  // Handle Speech Synthesis
  useEffect(() => {
    // Stop speaking when component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeech = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Strip Markdown chars for better speech
      const cleanText = text.replace(/[*#]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ar-SA'; // Arabic
      utterance.rate = 1;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Markdown parser with improved typography
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Headers
      if (line.startsWith('## ')) return <h3 key={i} className="text-xl md:text-2xl font-bold mt-8 mb-4 text-accent border-r-4 border-accent pr-3">{line.replace('## ', '')}</h3>;
      if (line.startsWith('### ')) return <h4 key={i} className={`text-lg font-bold mt-6 mb-2 ${textPrimary}`}>{line.replace('### ', '')}</h4>;
      
      // Lists
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <div key={i} className="flex items-start gap-2 mb-2 mr-4">
            <span className="text-accent mt-1.5 text-[8px]"><i className="fas fa-circle"></i></span>
            <p className={`leading-relaxed ${textSecondary}`}>
                 {line.replace(/^[\*\-] /, '').split(/(\*\*.*?\*\*)/).map((part, j) => 
                    part.startsWith('**') && part.endsWith('**') 
                    ? <strong key={j} className={`${isDark ? 'text-white' : 'text-black'} font-bold`}>{part.slice(2, -2)}</strong> 
                    : part
                )}
            </p>
          </div>
        );
      }

      // Empty lines
      if (line.trim() === '') return <div key={i} className="h-3"></div>;

      // Paragraphs with Bold support
      const parts = line.split(/(\*\*.*?\*\*)/);
      return (
        <p key={i} className={`mb-3 text-lg leading-8 ${textSecondary}`}>
          {parts.map((part, j) => 
            part.startsWith('**') && part.endsWith('**') 
              ? <strong key={j} className={`${isDark ? 'text-white' : 'text-black'} font-bold`}>{part.slice(2, -2)}</strong> 
              : part
          )}
        </p>
      );
    });
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className={`absolute inset-0 z-40 ${bgClass} overflow-y-auto custom-scrollbar animate-fade-in pb-20 md:pb-0`}>
      <div className="max-w-6xl mx-auto p-4 md:p-8 pt-24 md:pt-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg group ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-gray-50'}`}
            >
              <i className="fas fa-arrow-right transform group-hover:-translate-x-1 transition-transform"></i>
            </button>
            <div>
                <h2 className={`text-2xl md:text-3xl font-bold ${textPrimary} line-clamp-1`}>
                {isLoading ? 'جاري البحث...' : query}
                </h2>
                {!isLoading && <p className="text-xs text-gray-500 mt-1">تم البحث باستخدام Gemini 2.5 Flash</p>}
            </div>
          </div>
          {!isLoading && (
            <div className="flex gap-2">
                <button className={`px-4 py-2 rounded-xl text-xs font-bold border border-accent/20 bg-accent/5 text-accent flex items-center gap-2`}>
                   <i className="fas fa-check-circle"></i> بحث موثق
                </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-accent/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-t-accent animate-spin"></div>
              <div className="absolute inset-4 rounded-full bg-accent/10 animate-pulse flex items-center justify-center">
                 <i className="fas fa-search text-accent text-2xl"></i>
              </div>
            </div>
            <p className={`${textPrimary} text-xl font-bold mb-2`}>جاري استيعاب الويب...</p>
            <p className={`${textSecondary} text-sm`}>نبحث في ملايين المصادر للإجابة على سؤالك</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-slide-up">
            
            {/* Main Content (Left - 8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              <div className={`p-6 md:p-10 rounded-[2rem] ${cardBg} backdrop-blur-xl shadow-xl min-h-[500px]`}>
                <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-500/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-black font-bold">
                        <i className="fas fa-robot"></i>
                    </div>
                    <div>
                        <span className={`font-bold block ${textPrimary}`}>الملخص الذكي</span>
                        <span className="text-[10px] opacity-50">تم التوليد بواسطة TAKI AI</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={() => toggleSpeech(result.text)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-red-500 text-white animate-pulse' : 'bg-accent/10 text-accent hover:bg-accent hover:text-black'}`}
                        title="قراءة صوتية"
                    >
                        <i className={`fas ${isSpeaking ? 'fa-stop' : 'fa-volume-up'}`}></i>
                    </button>
                  </div>
                </div>
                
                <div className="prose prose-lg max-w-none dir-rtl">
                  {renderContent(result.text)}
                </div>

                {/* Action Buttons inside content */}
                <div className="mt-10 pt-6 border-t border-gray-500/10 flex flex-wrap gap-3">
                   <button 
                    onClick={() => navigator.clipboard.writeText(result.text)}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 ${isDark ? 'hover:bg-white/10 bg-white/5 text-gray-300' : 'hover:bg-black/5 bg-gray-100 text-gray-600'}`}
                   >
                     <i className="fas fa-copy"></i> نسخ
                   </button>
                   
                   <button 
                    onClick={() => onSaveToNote(result.text, result.sources)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 bg-accent text-black`}
                   >
                     <i className="fas fa-save"></i> حفظ في دفتري
                   </button>
                </div>
              </div>

              {/* Related Topics Section */}
              {result.related && result.related.length > 0 && (
                <div className="mt-8">
                  <h3 className={`text-lg font-bold mb-4 ${textPrimary} flex items-center gap-2`}>
                    <i className="fas fa-lightbulb text-yellow-400"></i> مواضيع قد تهمك أيضاً
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {result.related.map((topic, idx) => (
                      <button
                        key={idx}
                        onClick={() => onRelatedClick(topic)}
                        className={`text-right px-5 py-3 rounded-2xl text-sm transition-all duration-300 border ${isDark ? 'bg-[#1a1a1a] border-gray-800 hover:border-accent text-gray-300 hover:text-accent' : 'bg-white border-gray-200 hover:border-accent text-gray-700 hover:text-accent'} shadow-sm hover:shadow-md flex items-center gap-2 group`}
                      >
                        <span>{topic}</span>
                        <i className="fas fa-arrow-left opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:-translate-x-1"></i>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: Sources (Right - 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Sources List */}
              <div className={`p-5 rounded-3xl ${cardBg} backdrop-blur-xl shadow-lg sticky top-6`}>
                <h3 className={`font-bold text-base mb-5 ${textPrimary} flex items-center gap-2`}>
                  <i className="fas fa-globe-americas text-blue-400"></i> المصادر والمراجع
                </h3>
                <div className="space-y-3">
                  {result.sources.length > 0 ? (
                    result.sources.map((source, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => onOpenBrowser(source.url)}
                        className={`block p-3 rounded-2xl transition-all duration-300 border border-transparent cursor-pointer ${isDark ? 'hover:bg-white/5 bg-black/20 hover:border-gray-700' : 'hover:bg-black/5 bg-white hover:border-gray-200'} group relative overflow-hidden`}
                      >
                        <div className="relative z-10">
                            <div className="flex items-start justify-between gap-2">
                                <span className={`text-xs font-bold leading-tight line-clamp-2 ${textPrimary}`}>{source.title}</span>
                                <i className="fas fa-arrow-left text-[10px] opacity-30 group-hover:text-accent group-hover:opacity-100 transition-all transform group-hover:-translate-x-1"></i>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-4 h-4 rounded-full bg-gray-500/20 flex items-center justify-center text-[8px]">
                                    <i className="fas fa-link text-gray-400"></i>
                                </div>
                                <span className="text-[10px] opacity-50 truncate dir-ltr">{getDomain(source.url)}</span>
                            </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 opacity-50">
                        <i className="fas fa-search-minus text-2xl mb-2 block"></i>
                        <span className="text-xs">معلومات عامة (غير موثقة برابط)</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
