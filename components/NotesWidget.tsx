
import React, { useState, useEffect } from 'react';
import { Note } from '../types';

interface NotesWidgetProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string | null) => void;
  onUpdateNote: (id: string, title: string, content: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  isDark: boolean;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ 
  notes, 
  activeNoteId, 
  onSelectNote, 
  onUpdateNote, 
  onCreateNote, 
  onDeleteNote,
  isDark 
}) => {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Mobile view state: 'list' or 'editor'
  const activeNote = notes.find(n => n.id === activeNoteId);
  
  // Reset confirmation state when switching notes
  useEffect(() => {
    setIsConfirmingDelete(false);
  }, [activeNoteId]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ar-EG', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const bgClass = isDark ? 'bg-[#1e1e1e]/80 border-white/10' : 'bg-white/80 border-black/5';
  const itemHover = isDark ? 'hover:bg-white/10' : 'hover:bg-black/5';
  const itemActive = isDark ? 'bg-accent/20 border-accent/50' : 'bg-accent/20 border-accent/50';
  const textPrimary = isDark ? 'text-gray-100' : 'text-gray-800';
  const textSecondary = isDark ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className={`${bgClass} backdrop-blur-2xl rounded-[2.5rem] border flex flex-col md:flex-row h-[650px] shadow-[0_20px_50px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-300`}>
      
      {/* --- LEFT PANEL: Notes List --- */}
      <div className={`
        md:w-[35%] w-full flex flex-col border-l border-gray-500/10 bg-black/5
        ${activeNoteId ? 'hidden md:flex' : 'flex'} 
      `}>
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-gray-500/10">
          <span className={`font-bold text-xl flex items-center gap-3 ${textPrimary}`}>
            <i className="fas fa-book text-accent"></i> دفتري
          </span>
          <button 
            onClick={onCreateNote}
            className="w-10 h-10 rounded-full bg-accent text-black flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-accent/20"
          >
            <i className="fas fa-plus"></i>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
          {notes.length === 0 && (
             <div className="text-center mt-10 opacity-50">
                <i className="fas fa-feather-alt text-5xl mb-4 block text-gray-500"></i>
                <span className="text-base">لا توجد ملاحظات</span>
             </div>
          )}
          {notes.map(note => (
            <div 
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={`
                p-4 rounded-2xl cursor-pointer transition-all border border-transparent
                ${activeNoteId === note.id ? itemActive : `${itemHover} border-gray-500/5`}
              `}
            >
              <h3 className={`font-bold text-base truncate mb-2 ${textPrimary}`}>{note.title || 'بدون عنوان'}</h3>
              <p className={`text-sm truncate ${textSecondary}`}>
                {note.content || 'لا يوجد محتوى نصي...'}
              </p>
              <span className="text-[10px] opacity-50 mt-2 block text-left dir-ltr font-mono">
                {formatDate(note.updatedAt)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* --- RIGHT PANEL: Editor --- */}
      <div className={`
        flex-1 flex flex-col bg-transparent relative
        ${!activeNoteId ? 'hidden md:flex' : 'flex'}
      `}>
        {activeNote ? (
          <>
            {/* Editor Toolbar */}
            <div className="p-6 flex justify-between items-center border-b border-gray-500/10">
              <div className="flex items-center gap-4">
                 {/* Mobile Back Button */}
                 <button 
                   onClick={() => onSelectNote(null)}
                   className="md:hidden w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center text-sm"
                 >
                   <i className="fas fa-arrow-right"></i>
                 </button>
                 <span className={`text-xs font-mono opacity-50 hidden md:block tracking-wider`}>LAST EDITED: {formatDate(activeNote.updatedAt)}</span>
              </div>
              
              {isConfirmingDelete ? (
                <div className="flex items-center gap-3 animate-fade-in">
                  <span className="text-sm text-red-400 font-bold">حذف نهائي؟</span>
                  <button 
                    onClick={() => onDeleteNote(activeNote.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-colors"
                  >
                    نعم
                  </button>
                  <button 
                    onClick={() => setIsConfirmingDelete(false)}
                    className="bg-gray-500/20 text-gray-400 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-500/40 transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <i className="fas fa-trash"></i> <span className="hidden md:inline">حذف</span>
                </button>
              )}
            </div>

            {/* Editor Inputs - The "Comfort" Zone */}
            <div className="flex-1 flex flex-col p-6 md:p-10 overflow-hidden">
              <input 
                type="text"
                value={activeNote.title}
                onChange={(e) => onUpdateNote(activeNote.id, e.target.value, activeNote.content)}
                placeholder="عنوان الملاحظة"
                className={`text-3xl md:text-4xl font-bold bg-transparent border-none outline-none mb-6 placeholder-gray-500/30 w-full ${textPrimary} tracking-tight`}
              />
              <textarea 
                value={activeNote.content}
                onChange={(e) => onUpdateNote(activeNote.id, activeNote.title, e.target.value)}
                placeholder="اكتب أفكارك هنا..."
                className={`flex-1 bg-transparent border-none outline-none resize-none text-lg md:text-xl leading-8 custom-scrollbar ${textSecondary}`}
              />
            </div>
          </>
        ) : (
          /* Empty State (Desktop) */
          <div className="flex-1 flex flex-col items-center justify-center opacity-20 select-none">
            <i className="fas fa-pencil-alt text-8xl mb-6"></i>
            <p className="text-2xl font-light tracking-widest">TAKI NOTES</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesWidget;
