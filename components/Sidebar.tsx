
import React from 'react';
import { Theme } from '../types';

interface SidebarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onAnalyzeVideo: () => void;
  onToggleTheme: () => void;
  onClearData: () => void;
  onOpenSync: () => void;
  onLockSystem: () => void;
  theme: Theme;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onNavigate, 
  onAnalyzeVideo, 
  onToggleTheme, 
  onClearData,
  onOpenSync,
  onLockSystem,
  theme
}) => {
  
  const isDark = theme === 'dark';

  const navItemClass = (isActive: boolean, color: string = 'accent') => `
    relative group w-[50px] h-[50px] rounded-2xl flex justify-center items-center text-xl transition-all duration-300 cursor-pointer
    ${isActive 
      ? `bg-${color} text-black shadow-[0_0_15px_rgba(0,212,255,0.4)] scale-110` 
      : `text-gray-400 hover:bg-white/10 hover:text-white hover:scale-105`
    }
  `;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-[90px] h-screen bg-white/5 backdrop-blur-xl border-l border-white/10 flex-col items-center py-10 z-50 shadow-2xl">
        <div className="mb-10">
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-black font-bold text-xs">OS</div>
        </div>
        
        <div className="flex flex-col gap-6 flex-1 w-full items-center">
          <div 
            className={navItemClass(activeSection === 'home')} 
            onClick={() => onNavigate('home')} 
            title="الرئيسية"
          >
            <i className="fas fa-home"></i>
          </div>
          <div 
            className={navItemClass(activeSection === 'search', 'accent')} 
            onClick={() => onNavigate('search')} 
            title="البحث الذكي"
          >
            <i className="fas fa-search"></i>
          </div>
           <div 
            className={navItemClass(activeSection === 'browser', 'green-400')} 
            onClick={() => onNavigate('browser')} 
            title="المتصفح السيادي"
          >
            <i className="fas fa-globe text-green-400 group-hover:text-black"></i>
          </div>
          <div 
            className={navItemClass(false)} 
            onClick={onAnalyzeVideo} 
            title="تحليل الفيديو"
          >
            <i className="fas fa-play-circle"></i>
          </div>
          <div 
            className={navItemClass(false, 'purple-400')} 
            onClick={onOpenSync} 
            title="TAKI Link (المزامنة)"
          >
            <i className="fas fa-sync-alt text-purple-400 group-hover:text-white group-hover:rotate-180 transition-transform duration-500"></i>
          </div>
        </div>

        <div className="flex flex-col gap-6 w-full items-center pb-5">
           <div 
            className="relative group w-[50px] h-[50px] rounded-2xl flex justify-center items-center text-xl transition-all duration-300 cursor-pointer text-gray-400 hover:bg-white/10 hover:text-accent hover:scale-105"
            onClick={onLockSystem} 
            title="قفل النظام (TAKI GUARD)"
          >
            <i className="fas fa-shield-alt"></i>
          </div>
           <div 
            className={navItemClass(false)} 
            onClick={onToggleTheme} 
            title="النمط"
          >
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
          </div>
          <div 
            className={navItemClass(false)} 
            onClick={onClearData} 
            title="حذف"
          >
            <i className="fas fa-trash-alt text-red-400 hover:text-red-500"></i>
          </div>
        </div>
      </nav>

      {/* Mobile Floating Dock */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1a1a1a]/90 backdrop-blur-2xl border border-white/10 px-5 py-3 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-5 w-[92%] max-w-[400px] justify-between">
         <div 
            className={`text-xl ${activeSection === 'home' ? 'text-accent' : 'text-gray-400'} active:scale-90 transition-transform`} 
            onClick={() => onNavigate('home')}
          >
            <i className="fas fa-home"></i>
          </div>
           <div 
            className={`text-xl ${activeSection === 'search' ? 'text-accent' : 'text-gray-400'} active:scale-90 transition-transform`} 
            onClick={() => onNavigate('search')}
          >
            <i className="fas fa-search"></i>
          </div>
          <div 
            className="text-2xl text-accent -mt-8 bg-[#2a2a2a] w-14 h-14 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(0,212,255,0.2)] border border-accent/20 active:scale-90 transition-transform" 
            onClick={onAnalyzeVideo}
          >
            <i className="fas fa-play ml-1"></i>
          </div>
           <div 
            className={`text-xl ${activeSection === 'browser' ? 'text-green-400' : 'text-gray-400'} active:scale-90 transition-transform`} 
            onClick={() => onNavigate('browser')}
          >
            <i className="fas fa-globe"></i>
          </div>
          <div 
            className="text-xl text-gray-400 active:text-accent active:scale-90 transition-transform" 
            onClick={onLockSystem}
          >
            <i className="fas fa-shield-alt"></i>
          </div>
      </nav>
    </>
  );
};

export default Sidebar;
