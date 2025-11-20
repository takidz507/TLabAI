
import React, { useState, useEffect, useRef } from 'react';
import { Position } from '../types';

interface FloatingPlayerProps {
  videoId: string | null;
  onClose: () => void;
  isDark: boolean;
}

const FloatingPlayer: React.FC<FloatingPlayerProps> = ({ videoId, onClose, isDark }) => {
  const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState<Position>({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
       setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Initial desktop position
    if (window.innerWidth >= 768) {
        setPosition({ x: 30, y: window.innerHeight - 320 });
    }

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return; // Disable custom drag logic on mobile to rely on CSS layout

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, offset, isMobile]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isMobile) return;

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      const mouse = e as React.MouseEvent;
      clientX = mouse.clientX;
      clientY = mouse.clientY;
    }

    if (playerRef.current) {
        const rect = playerRef.current.getBoundingClientRect();
        setOffset({
            x: clientX - rect.left,
            y: clientY - rect.top
        });
    }
    setIsDragging(true);
  };

  if (!videoId) return null;

  const containerStyle = isMobile 
    ? { 
        bottom: '100px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: '92%',
        maxWidth: '400px',
        position: 'fixed' as const,
        zIndex: 2000
      } 
    : {
        top: `${position.y}px`,
        left: `${position.x}px`,
        position: 'fixed' as const,
        zIndex: 2000,
        width: '400px'
      };

  // Fix for Error 153: Use youtube-nocookie, add origin, and robust params
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${origin}`;

  return (
    <div
      ref={playerRef}
      style={containerStyle}
      className={`rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] border transition-shadow duration-300 ${isDark ? 'bg-[#000] border-gray-800' : 'bg-white border-gray-200'}`}
    >
      <div
        className={`${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-100'} p-3 flex justify-between items-center ${!isMobile ? 'cursor-move' : ''} select-none`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <span className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            {isMobile ? 'مشغل الفيديو' : ':: اسحب من هنا'}
        </span>
        <div 
            className="w-7 h-7 rounded-full bg-red-500/10 flex items-center justify-center cursor-pointer hover:bg-red-500 hover:text-white transition-colors text-red-500"
            onClick={onClose}
        >
            <i className="fas fa-times text-sm" />
        </div>
      </div>
      <div className="relative pb-[56.25%] h-0 bg-black">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={embedUrl}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
};

export default FloatingPlayer;
