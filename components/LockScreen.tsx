
import React, { useState, useEffect } from 'react';

interface LockScreenProps {
  isLocked: boolean;
  hasPin: boolean;
  onUnlock: (pin: string) => boolean;
  onSetPin: (pin: string) => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ isLocked, hasPin, onUnlock, onSetPin }) => {
  const [pin, setPin] = useState('');
  const [mode, setMode] = useState<'auth' | 'create' | 'confirm'>('auth');
  const [tempPin, setTempPin] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!hasPin) {
      setMode('create');
    } else {
      setMode('auth');
    }
    setPin('');
    setError(false);
    setIsSuccess(false);
  }, [isLocked, hasPin]);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => handleSubmit(newPin), 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleSubmit = (inputPin: string) => {
    if (mode === 'auth') {
      if (onUnlock(inputPin)) {
        setIsSuccess(true);
        // Animation handled by parent removing component or state change
      } else {
        triggerError();
      }
    } else if (mode === 'create') {
      setTempPin(inputPin);
      setMode('confirm');
      setPin('');
    } else if (mode === 'confirm') {
      if (inputPin === tempPin) {
        onSetPin(inputPin);
        setIsSuccess(true);
      } else {
        triggerError();
        setMode('create'); // Reset to create
        setTempPin('');
      }
    }
  };

  const triggerError = () => {
    setError(true);
    setTimeout(() => {
      setPin('');
      setError(false);
    }, 500);
  };

  if (!isLocked) return null;

  const message = {
    auth: 'أدخل رمز الحماية',
    create: 'أنشئ رمز حماية جديد',
    confirm: 'أعد كتابة الرمز للتأكيد'
  }[mode];

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center text-white font-sans select-none">
      {/* Matrix Background Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
         <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-accent to-transparent animate-pulse"></div>
         <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-accent to-transparent animate-pulse delay-700"></div>
      </div>

      <div className={`relative z-10 flex flex-col items-center transition-all duration-500 ${isSuccess ? 'scale-110 opacity-0' : 'scale-100 opacity-100'}`}>
        
        {/* Icon */}
        <div className="mb-8 relative">
           <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 ${error ? 'border-red-500 animate-shake' : 'border-accent/30'} bg-black shadow-[0_0_30px_rgba(0,212,255,0.1)] transition-all duration-300`}>
              <i className={`fas ${isSuccess ? 'fa-unlock' : 'fa-shield-alt'} text-4xl ${error ? 'text-red-500' : 'text-accent'}`}></i>
           </div>
           {mode !== 'auth' && <span className="absolute -top-2 -right-2 bg-accent text-black text-xs font-bold px-2 py-1 rounded-md">SETUP</span>}
        </div>

        {/* Message */}
        <h2 className={`text-xl mb-8 font-light tracking-[0.2em] ${error ? 'text-red-500' : 'text-gray-400'}`}>
          {error ? 'رمز خاطئ - تم رفض الوصول' : message}
        </h2>

        {/* PIN Dots */}
        <div className="flex gap-4 mb-12">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full transition-all duration-300 border border-accent/50 ${i < pin.length ? 'bg-accent shadow-[0_0_10px_#00d4ff]' : 'bg-transparent'}`}
            ></div>
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumberClick(num.toString())}
              className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/10 active:bg-accent active:text-black border border-white/5 flex items-center justify-center text-2xl font-light transition-all duration-150 active:scale-90"
            >
              {num}
            </button>
          ))}
          <div className="w-20 h-20"></div>
          <button
            onClick={() => handleNumberClick('0')}
            className="w-20 h-20 rounded-full bg-white/5 hover:bg-white/10 active:bg-accent active:text-black border border-white/5 flex items-center justify-center text-2xl font-light transition-all duration-150 active:scale-90"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-20 h-20 rounded-full text-red-400 hover:bg-red-500/10 active:scale-90 flex items-center justify-center transition-all"
          >
            <i className="fas fa-backspace text-xl"></i>
          </button>
        </div>

        <div className="mt-12 text-[10px] text-gray-600 tracking-widest">
          TAKI GUARD SECURITY PROTOCOL v3.0
        </div>

      </div>
    </div>
  );
};

export default LockScreen;
