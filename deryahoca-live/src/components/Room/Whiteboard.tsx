'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { getSocket } from '@/lib/socket/client';
import type { DrawingPoint, DrawingEvent } from '@/types';

interface WhiteboardProps {
    sessionId: string;
    isTeacher: boolean;
    width: number;
    height: number;
    drawingEnabled: boolean;
    pageIndex: number;
    clearTrigger: number;
    focusMode: boolean;
    onToggleFocusMode: () => void;
    onToggleDrawing: () => void;
    onClearBoard: () => void; // Fixed type
    // Media controls
    isMuted: boolean;
    isCameraOff: boolean;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onSelectPdf: () => void;
    onLeave: () => void;
    // New props for screen capture
    onScreenshot?: () => void;
    onScreenRecord?: () => void;
    isRecording?: boolean;
    // Shared State Props
    currentColor: string;
    setCurrentColor: (color: string) => void;
    lineWidth: number;
    setLineWidth: (width: number) => void;
    isEraser: boolean;
    setIsEraser: (eraser: boolean) => void;
    textMode: boolean;
    setTextMode: (mode: boolean) => void;
    selectedSymbol: string | null;
    setSelectedSymbol: (symbol: string | null) => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
    sessionId,
    isTeacher,
    width,
    height,
    drawingEnabled = true,
    pageIndex,
    clearTrigger = 0,
    focusMode = false,
    onToggleFocusMode,
    onToggleDrawing,
    onClearBoard,
    isMuted = false,
    isCameraOff = false,
    onToggleMute,
    onToggleCamera,
    onSelectPdf,
    onLeave,
    onScreenshot,
    onScreenRecord,
    isRecording = false,
    // Shared State Props
    currentColor,
    setCurrentColor,
    lineWidth,
    setLineWidth,
    isEraser,
    setIsEraser,
    textMode,
    setTextMode,
    selectedSymbol,
    setSelectedSymbol,
}) => {
    // Shared state is now passed via props
    const [showColorPalette, setShowColorPalette] = useState(false);
    const [showSymbolPicker, setShowSymbolPicker] = useState(false);


    // Drawing logic removed - handled in PDFViewer

    // Timer Logic Removed (Moved to ClassTimer)

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 6 main colors for compact palette
    const paletteColors = [
        { name: 'Kırmızı', value: '#FF0000' },
        { name: 'Mavi', value: '#0066FF' },
        { name: 'Yeşil', value: '#00CC00' },
        { name: 'Sarı', value: '#FFCC00' },
        { name: 'Turuncu', value: '#FF6600' },
        { name: 'Beyaz', value: '#FFFFFF' },
    ];

    // Symbols list
    const symbols = [
        { emoji: '✓', name: 'Onay' },
        { emoji: '✗', name: 'Red' },
        { emoji: '→', name: 'Sağ Ok' },
        { emoji: '←', name: 'Sol Ok' },
        { emoji: '↑', name: 'Yukarı Ok' },
        { emoji: '↓', name: 'Aşağı Ok' },
        { emoji: '⭐', name: 'Yıldız' },
        { emoji: '❤️', name: 'Kalp' },
        { emoji: '❗', name: 'Ünlem' },
        { emoji: '❓', name: 'Soru' },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Canvas removed - Drawing handled in PDFViewer */}

            {/* Selected Symbol Indicator - Kept for visibility */}
            {selectedSymbol && (
                <div className="absolute top-4 right-4 bg-brand-dark/95 backdrop-blur-xl rounded-lg px-3 py-2 border border-white/20 shadow-xl z-[100] pointer-events-auto flex items-center gap-2">
                    <span className="text-2xl">{selectedSymbol}</span>
                    <span className="text-xs text-text-muted">Yerleştirmek için tıkla</span>
                    <button
                        onClick={() => setSelectedSymbol(null)}
                        className="text-red-400 hover:text-red-300 text-sm"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Timer moved to Room Header */}


            {/* Unified Left Toolbar - Teacher Only */}
            {isTeacher && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-3 top-20 flex flex-col gap-1 p-1.5 bg-gradient-to-b from-brand-panel/95 to-brand-dark/95 backdrop-blur-xl rounded-xl border border-white/10 pointer-events-auto shadow-2xl z-50"
                >
                    {/* Media Controls */}
                    <button
                        onClick={onToggleMute}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isMuted
                            ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                            : 'bg-brand-dark/60 text-brand-accent hover:bg-brand-dark/80'
                            }`}
                        title={isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
                    >
                        {isMuted ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={onToggleCamera}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isCameraOff
                            ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.4)]'
                            : 'bg-brand-dark/60 text-brand-accent hover:bg-brand-dark/80'
                            }`}
                        title={isCameraOff ? 'Kamerayı Aç' : 'Kamerayı Kapat'}
                    >
                        {isCameraOff ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={onSelectPdf}
                        className="w-9 h-9 rounded-lg bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30 flex items-center justify-center transition-all"
                        title="PDF Seç"
                    >
                        <span className="text-sm">📄</span>
                    </button>

                    <div className="h-px bg-white/10 mx-1" />

                    {/* Screenshot & Record */}
                    <button
                        onClick={onScreenshot}
                        className="w-9 h-9 rounded-lg bg-brand-dark/60 text-brand-primary hover:bg-brand-dark/80 flex items-center justify-center transition-all"
                        title="Ekran Görüntüsü Al"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    <button
                        onClick={onScreenRecord}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${isRecording
                            ? 'bg-red-500/20 text-red-500 border border-red-500 shadow-[0_0_8px_rgba(239,68,68,0.3)] animate-pulse'
                            : 'bg-brand-dark/60 text-brand-primary hover:bg-brand-dark/80'
                            }`}
                        title={isRecording ? 'Kaydı Durdur' : 'Ekran Kaydı Başlat'}
                    >
                        {isRecording ? (
                            <div className="w-3 h-3 bg-red-500 rounded-sm" />
                        ) : (
                            <div className="w-3 h-3 bg-current rounded-full" />
                        )}
                    </button>

                    <div className="h-px bg-white/10 mx-1" />

                    {/* Drawing Controls */}
                    <button
                        onClick={onToggleDrawing}
                        className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${drawingEnabled
                            ? 'bg-brand-accent text-white shadow-glow-accent'
                            : 'bg-brand-dark/60 text-text-muted hover:bg-brand-dark/80'
                            }`}
                        title={drawingEnabled ? 'Çizimi Kapat' : 'Çiz'}
                    >
                        <span className="text-sm">✏️</span>
                    </button>

                    <button
                        onClick={onToggleFocusMode}
                        className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${focusMode
                            ? 'bg-brand-highlight text-brand-dark shadow-glow-highlight'
                            : 'bg-brand-dark/60 text-text-muted hover:bg-brand-dark/80'
                            }`}
                        title={focusMode ? 'Odak Kapat' : 'Odak'}
                    >
                        <span className="text-sm">🎯</span>
                    </button>

                    <button
                        onClick={() => setIsEraser(false)}
                        className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${!isEraser && drawingEnabled
                            ? 'bg-primary-500 text-white'
                            : 'bg-brand-dark/60 text-gray-400 hover:bg-brand-dark/80'
                            }`}
                        title="Kalem"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                    </button>

                    <button
                        onClick={() => setIsEraser(true)}
                        className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${isEraser && drawingEnabled
                            ? 'bg-primary-500 text-white'
                            : 'bg-brand-dark/60 text-gray-400 hover:bg-brand-dark/80'
                            }`}
                        title="Silgi"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83l3.85 3.85c.78.78 2.05.78 2.83 0L20.41 10.27c.78-.78.78-2.05 0-2.83L16.55 3.59c-.39-.39-.9-.59-1.41-.59zm-3.56 14.12L6.12 11.66l7.07-7.07 5.46 5.46-7.07 7.07z" />
                        </svg>
                    </button>

                    <div className="h-px bg-white/10 mx-1" />

                    {/* Color Button with Popup Palette */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColorPalette(!showColorPalette)}
                            className="w-9 h-9 rounded-lg flex items-center justify-center border-2 border-white/30 hover:border-white/50 transition-all"
                            style={{ backgroundColor: currentColor }}
                            title="Renk Seç"
                        />
                        {showColorPalette && (
                            <div className="absolute left-full ml-2 top-0 bg-brand-dark/95 backdrop-blur-xl rounded-lg p-2 border border-white/20 shadow-xl flex flex-wrap gap-1 w-24 z-[100]">
                                {paletteColors.map((color) => (
                                    <button
                                        key={color.value}
                                        onClick={() => {
                                            setCurrentColor(color.value);
                                            setIsEraser(false);
                                            setShowColorPalette(false);
                                        }}
                                        className={`w-6 h-6 rounded border-2 transition-all ${currentColor === color.value
                                            ? 'border-white scale-110'
                                            : 'border-transparent hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Text Button */}
                    <button
                        onClick={() => {
                            setTextMode(!textMode);
                            setShowSymbolPicker(false);
                        }}
                        className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${textMode
                            ? 'bg-primary-500 text-white'
                            : 'bg-brand-dark/60 text-gray-400 hover:bg-brand-dark/80'
                            }`}
                        title="Metin Ekle"
                    >
                        <span className="text-sm font-bold">T</span>
                    </button>

                    {/* Symbol Button with Popup */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setShowSymbolPicker(!showSymbolPicker);
                                setTextMode(false);
                            }}
                            className={`w-9 h-9 rounded-lg transition-all flex items-center justify-center ${showSymbolPicker
                                ? 'bg-primary-500 text-white'
                                : 'bg-brand-dark/60 text-gray-400 hover:bg-brand-dark/80'
                                }`}
                            title="Sembol Damgası"
                        >
                            <span className="text-sm">✓</span>
                        </button>
                        {showSymbolPicker && (
                            <div className="absolute left-full ml-2 top-0 bg-brand-dark/95 backdrop-blur-xl rounded-lg p-2 border border-white/20 shadow-xl grid grid-cols-5 gap-1 w-32 z-[100]">
                                {symbols.map((sym) => (
                                    <button
                                        key={sym.name}
                                        onClick={() => {
                                            setSelectedSymbol(sym.emoji);
                                            setShowSymbolPicker(false);
                                        }}
                                        className="w-6 h-6 rounded hover:bg-white/20 flex items-center justify-center text-lg transition-colors"
                                        title={`${sym.name} - Tıkla ve PDF'e yerleştir`}
                                    >
                                        {sym.emoji}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-white/10 mx-1" />

                    {/* Line Width */}
                    <div className="px-1 py-1">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="w-full h-1 accent-brand-accent"
                            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)', height: '30px' }}
                        />
                    </div>

                    <div className="h-px bg-white/10 mx-1" />

                    {/* Clear */}
                    <button
                        onClick={onClearBoard}
                        className="w-9 h-9 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center justify-center transition-all border border-red-500/30"
                        title="Temizle"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                    </button>

                    <div className="h-px bg-white/10 mx-1" />

                    {/* Leave */}
                    <button
                        onClick={onLeave}
                        className="w-9 h-9 rounded-lg bg-red-500 text-white hover:shadow-[0_0_8px_rgba(239,68,68,0.5)] flex items-center justify-center transition-all"
                        title="Dersi Bitir"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </motion.div>
            )}
        </div>
    );
};
