
import React, { useState } from 'react';
import { Note, Task, Theme } from '../types';
import { encryptData, decryptData } from '../utils/encryption';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  tasks: Task[];
  theme: Theme;
  onImportData: (data: any) => void;
  isDark: boolean;
}

const SyncModal: React.FC<SyncModalProps> = ({ 
  isOpen, 
  onClose, 
  notes, 
  tasks, 
  theme,
  onImportData,
  isDark 
}) => {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importString, setImportString] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [status, setStatus] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  if (!isOpen) return null;

  // --- Export Logic ---
  const generateSmartKey = () => {
    try {
      const data = {
        notes,
        tasks,
        theme,
        timestamp: Date.now(),
        version: '3.0'
      };
      // Encrypt the data structure to create a secure key
      // This ensures the shared key is not just Base64 but fully encrypted
      const encryptedKey = encryptData(data);
      
      if (encryptedKey) {
          setGeneratedKey(encryptedKey);
          setStatus({ msg: 'تم توليد المفتاح المشفر بنجاح! 🔐', type: 'success' });
      } else {
          throw new Error("Encryption failed");
      }
    } catch (err) {
      setStatus({ msg: 'حدث خطأ أثناء التشفير.', type: 'error' });
    }
  };

  const downloadCapsule = () => {
    const data = { notes, tasks, theme, timestamp: Date.now(), version: '3.0' };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `TAKI_SECURE_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatus({ msg: 'تم تحميل الكبسولة بنجاح.', type: 'success' });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedKey);
    setStatus({ msg: 'تم النسخ للحافظة!', type: 'success' });
  };

  // --- Import Logic ---
  const handleImport = () => {
    if (!importString) return;
    
    try {
      // Try Decrypting (TAKI GUARD V3 Format)
      let data = decryptData(importString, null);
      
      // Fallback for old format or raw JSON
      if (!data) {
          try {
             // Try plain base64
             const jsonString = decodeURIComponent(escape(window.atob(importString)));
             data = JSON.parse(jsonString);
          } catch {
             // Try raw JSON
             data = JSON.parse(importString);
          }
      }

      if (!data || (!data.notes && !data.tasks)) throw new Error("Invalid Data");
      
      onImportData(data);
      setStatus({ msg: 'تم فك التشفير واستعادة البيانات! 🔓', type: 'success' });
      setTimeout(onClose, 1500);
    } catch (err) {
        setStatus({ msg: 'المفتاح غير صالح أو تالف.', type: 'error' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const data = JSON.parse(json);
        onImportData(data);
        setStatus({ msg: 'تم استيراد الملف بنجاح!', type: 'success' });
        setTimeout(onClose, 1500);
      } catch (err) {
        setStatus({ msg: 'الملف تالف أو غير مدعوم.', type: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const bgClass = isDark ? 'bg-[#121212]/95 border-white/10' : 'bg-white/95 border-black/10';
  const textClass = isDark ? 'text-white' : 'text-gray-800';

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative w-full max-w-lg ${bgClass} border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up`}>
        
        {/* Header */}
        <div className="p-6 border-b border-gray-500/20 flex justify-between items-center bg-accent/5">
          <div>
            <h2 className={`text-2xl font-bold ${textClass} flex items-center gap-2`}>
              <i className="fas fa-sync-alt text-accent animate-spin-slow"></i> TAKI Link
            </h2>
            <p className="text-xs opacity-60 mt-1 text-gray-400">مزامنة مشفرة (End-to-End Encryption)</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center transition-colors text-gray-400">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 gap-2 bg-black/10">
          <button 
            onClick={() => { setMode('export'); setStatus(null); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'export' ? 'bg-accent text-black shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
          >
            إرسال (تشفير)
          </button>
          <button 
            onClick={() => { setMode('import'); setStatus(null); }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'import' ? 'bg-accent text-black shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
          >
            استلام (فك تشفير)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          
          {status && (
            <div className={`mb-4 p-3 rounded-xl text-sm font-bold text-center ${status.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {status.msg}
            </div>
          )}

          {mode === 'export' ? (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center text-accent text-2xl mb-2">
                   <i className="fas fa-file-contract"></i>
                </div>
                <p className={`text-sm opacity-80 ${textClass}`}>
                  سيتم تشفير بياناتك بمفتاح النظام الفريد قبل توليد الرابط.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button onClick={generateSmartKey} className={`p-4 rounded-2xl border border-dashed border-gray-500/30 hover:border-accent hover:bg-accent/5 transition-all group flex flex-col items-center gap-2`}>
                    <i className="fas fa-key text-2xl text-gray-400 group-hover:text-accent transition-colors"></i>
                    <span className={`text-sm font-bold ${textClass}`}>مفتاح مشفر</span>
                    <span className="text-[10px] opacity-50">نص مشفر (Secure Key)</span>
                 </button>
                 <button onClick={downloadCapsule} className={`p-4 rounded-2xl border border-dashed border-gray-500/30 hover:border-purple-500 hover:bg-purple-500/5 transition-all group flex flex-col items-center gap-2`}>
                    <i className="fas fa-file-archive text-2xl text-gray-400 group-hover:text-purple-500 transition-colors"></i>
                    <span className={`text-sm font-bold ${textClass}`}>كبسولة JSON</span>
                    <span className="text-[10px] opacity-50">ملف نسخ احتياطي</span>
                 </button>
              </div>

              {generatedKey && (
                <div className="animate-fade-in">
                  <label className="text-xs opacity-50 block mb-1">المفتاح المشفر (انسخ هذا):</label>
                  <div className="relative">
                    <textarea 
                      readOnly 
                      value={generatedKey} 
                      className={`w-full h-24 p-3 rounded-xl text-xs font-mono break-all resize-none ${isDark ? 'bg-black/30 text-green-400' : 'bg-gray-100 text-green-700'} outline-none focus:ring-1 ring-accent`}
                    />
                    <button 
                      onClick={copyToClipboard}
                      className="absolute top-2 left-2 bg-accent text-black text-xs px-3 py-1 rounded-lg font-bold hover:bg-white transition-colors"
                    >
                      نسخ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
               <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center text-purple-400 text-2xl mb-2">
                   <i className="fas fa-unlock-alt"></i>
                </div>
                <p className={`text-sm opacity-80 ${textClass}`}>
                  أدخل المفتاح المشفر لاستعادة بياناتك بأمان.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                    <label className="text-xs opacity-50 block mb-1">المفتاح المشفر:</label>
                    <textarea 
                        value={importString}
                        onChange={(e) => setImportString(e.target.value)}
                        placeholder="ألصق النص الذي يبدأ بـ ENC:: هنا..."
                        className={`w-full h-24 p-3 rounded-xl text-xs font-mono break-all resize-none ${isDark ? 'bg-black/30 text-white' : 'bg-gray-100 text-gray-800'} outline-none border border-gray-500/20 focus:border-accent`}
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-gray-500/20"></div>
                    <span className="text-xs opacity-50">أو</span>
                    <div className="h-px flex-1 bg-gray-500/20"></div>
                </div>

                <label className={`flex items-center justify-center w-full p-3 rounded-xl border border-dashed border-gray-500/30 cursor-pointer hover:bg-white/5 transition-colors ${textClass}`}>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                    <i className="fas fa-folder-open mr-2"></i> اختيار ملف
                </label>

                <button 
                    onClick={handleImport}
                    disabled={!importString}
                    className={`w-full py-3 rounded-xl font-bold text-black transition-all ${importString ? 'bg-accent hover:bg-white shadow-lg cursor-pointer' : 'bg-gray-500/20 cursor-not-allowed opacity-50'}`}
                >
                    فك التشفير والاستعادة
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
