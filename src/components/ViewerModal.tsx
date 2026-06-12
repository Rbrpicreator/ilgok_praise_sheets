import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet } from '../types';

interface ViewerModalProps {
  sheets: Sheet[];
  initialIndex: number;
  onClose: () => void;
}

export default function ViewerModal({ sheets, initialIndex, onClose }: ViewerModalProps) {
  const [zoom, setZoom] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoom(1);
  }, [initialIndex, sheets]);

  useEffect(() => {
    if (sheets.length > 0) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [sheets]);

  if (sheets.length === 0) return null;

  const sheet = sheets[currentIndex];

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
    }
  };

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < sheets.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 animate-in fade-in duration-200">
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 px-3 py-1 rounded-full font-bold text-sm backdrop-blur">
            {sheet.chord}
          </div>
          <h3 className="font-bold text-lg md:text-xl truncate max-w-[200px] md:max-w-md">
            {sheet.title} 
            {sheets.length > 1 && <span className="ml-2 font-normal text-white/50 text-base">({currentIndex + 1} / {sheets.length})</span>}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 hover:bg-white/20 rounded-full transition-colors hidden md:block">
            <ZoomIn size={24} />
          </button>
          <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 hover:bg-white/20 rounded-full transition-colors hidden md:block">
            <ZoomOut size={24} />
          </button>
          <div className="w-px h-6 bg-white/30 mx-2 hidden md:block"></div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      {sheets.length > 1 && (
        <>
          <button 
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full disabled:opacity-0 transition-all z-20"
          >
            <ChevronLeft size={32} />
          </button>
          <button 
            onClick={goNext}
            disabled={currentIndex === sheets.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full disabled:opacity-0 transition-all z-20"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Sheet Image Container */}
      <div 
        className="w-full h-full p-4 md:p-12 overflow-auto flex items-center justify-center relative touch-pan-y"
        onClick={onClose}
      >
        <img 
          src={sheet.imageUrl} 
          alt={sheet.title} 
          className="max-w-full max-h-full transition-transform duration-200 ease-out shadow-2xl bg-white"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
          onClick={(e) => {
             e.stopPropagation();
          }}
        />
      </div>
      
    </div>
  );
}
