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
    drawingEnabled?: boolean;
    pageIndex: number;
    clearTrigger?: number;
    focusMode?: boolean;
    onToggleFocusMode?: () => void;
    onToggleDrawing?: () => void;
    onClearBoard?: () => void;
    // Media controls
    isMuted?: boolean;
    isCameraOff?: boolean;
    onToggleMute?: () => void;
    onToggleCamera?: () => void;
    onSelectPdf?: () => void;
    onLeave?: () => void;
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
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentColor, setCurrentColor] = useState('#FF0000');
    const [isEraser, setIsEraser] = useState(false);
    const [lineWidth, setLineWidth] = useState(3);
    const lastPointRef = useRef<DrawingPoint | null>(null);

    const getContext = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.getContext('2d');
    }, []);

    const draw = useCallback((
        from: DrawingPoint,
        to: DrawingPoint,
        color: string,
        width: number,
        eraser: boolean
    ) => {
        const ctx = getContext();
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);

        if (eraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = width * 5;
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.closePath();
        ctx.globalCompositeOperation = 'source-over';
    }, [getContext]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = getContext();
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, [getContext]);

    useEffect(() => {
        if (clearTrigger > 0) {
            clearCanvas();
        }
    }, [clearTrigger, clearCanvas]);

    useEffect(() => {
        const socket = getSocket();

        const handleDrawingEvent = (event: DrawingEvent & { from?: DrawingPoint }) => {
            if (event.pageIndex !== undefined && event.pageIndex !== pageIndex) return;
            if (event.type === 'draw' && event.from) {
                draw(event.from, event.point, event.color, event.lineWidth, event.isEraser);
            }
        };

        const handleClearCanvas = (data?: { pageIndex?: number }) => {
            if (data?.pageIndex !== undefined && data.pageIndex !== pageIndex) return;
            clearCanvas();
        };

        const handleWhiteboardSync = (strokes: (DrawingEvent & { from?: DrawingPoint })[]) => {
            const pageStrokes = strokes.filter(s => s.pageIndex === undefined || s.pageIndex === pageIndex);
            pageStrokes.forEach(stroke => {
                if (stroke.type === 'draw' && stroke.from) {
                    draw(stroke.from, stroke.point, stroke.color, stroke.lineWidth, stroke.isEraser);
                }
            });
        };

        socket.on('whiteboard-draw', handleDrawingEvent);
        socket.on('whiteboard-clear', handleClearCanvas);
        socket.on('whiteboard-sync', handleWhiteboardSync);

        return () => {
            socket.off('whiteboard-draw', handleDrawingEvent);
            socket.off('whiteboard-clear', handleClearCanvas);
            socket.off('whiteboard-sync', handleWhiteboardSync);
        };
    }, [draw, clearCanvas, pageIndex]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent): DrawingPoint | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        if ('touches' in e) {
            const touch = e.touches[0];
            return {
                x: (touch.clientX - rect.left) * scaleX,
                y: (touch.clientY - rect.top) * scaleY,
            };
        } else {
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY,
            };
        }
    };

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isTeacher || !drawingEnabled) return;
        const point = getPoint(e);
        if (!point) return;

        setIsDrawing(true);
        lastPointRef.current = point;

        const socket = getSocket();
        socket.emit('whiteboard-draw', {
            sessionId,
            event: { type: 'start', point, color: currentColor, lineWidth, isEraser, pageIndex },
        });
    };

    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isTeacher || !isDrawing) return;
        const point = getPoint(e);
        if (!point || !lastPointRef.current) return;

        draw(lastPointRef.current, point, currentColor, lineWidth, isEraser);

        const socket = getSocket();
        socket.emit('whiteboard-draw', {
            sessionId,
            event: { type: 'draw', from: lastPointRef.current, point, color: currentColor, lineWidth, isEraser, pageIndex },
        });

        lastPointRef.current = point;
    };

    const handleEnd = () => {
        if (!isTeacher) return;
        setIsDrawing(false);
        lastPointRef.current = null;
    };

    const colors = [
        { name: 'Kırmızı', value: '#FF0000' },
        { name: 'Mavi', value: '#0066FF' },
        { name: 'Yeşil', value: '#00CC00' },
        { name: 'Sarı', value: '#FFCC00' },
        { name: 'Beyaz', value: '#FFFFFF' },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className={`absolute inset-0 w-full h-full ${isTeacher && drawingEnabled ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            />

            {/* Unified Left Toolbar - Teacher Only */}
            {isTeacher && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-3 top-20 flex flex-col gap-1 p-1.5 bg-gradient-to-b from-brand-panel/95 to-brand-dark/95 backdrop-blur-xl rounded-xl border border-white/10 pointer-events-auto shadow-2xl z-50 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
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

                    {/* Colors */}
                    {colors.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => { setCurrentColor(color.value); setIsEraser(false); }}
                            className={`w-7 h-7 mx-auto rounded-md border-2 transition-all ${currentColor === color.value && !isEraser
                                ? 'border-white scale-110 shadow-lg'
                                : 'border-transparent hover:scale-105'
                                }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                        />
                    ))}

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
