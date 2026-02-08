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
    drawingEnabled?: boolean; // When false, pointer events are disabled
    pageIndex: number;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
    sessionId,
    isTeacher,
    width,
    height,
    drawingEnabled = true, // Defaults to true for backwards compatibility
    pageIndex,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentColor, setCurrentColor] = useState('#FF0000');
    const [isEraser, setIsEraser] = useState(false);
    const [lineWidth, setLineWidth] = useState(3);
    const lastPointRef = useRef<DrawingPoint | null>(null);

    // Get canvas context
    const getContext = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        return canvas.getContext('2d');
    }, []);

    // Draw on canvas
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
            // Use destination-out to actually erase
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

        // Reset composite operation
        ctx.globalCompositeOperation = 'source-over';
    }, [getContext]);

    // Clear canvas
    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = getContext();
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, [getContext]);

    // Handle socket events for drawing sync
    useEffect(() => {
        const socket = getSocket();

        const handleDrawingEvent = (event: DrawingEvent & { from?: DrawingPoint }) => {
            // Only draw if event is for current page or global (undefined pageIndex)
            if (event.pageIndex !== undefined && event.pageIndex !== pageIndex) return;

            if (event.type === 'draw' && event.from) {
                draw(event.from, event.point, event.color, event.lineWidth, event.isEraser);
            }
        };

        const handleClearCanvas = (data?: { pageIndex?: number }) => {
            // Only clear if no pageIndex provided (global clear) or matches current page
            if (data?.pageIndex !== undefined && data.pageIndex !== pageIndex) return;
            clearCanvas();
        };

        // Handle sync of existing strokes for late joiners
        const handleWhiteboardSync = (strokes: (DrawingEvent & { from?: DrawingPoint })[]) => {
            // Filter strokes for current page
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
    }, [draw, clearCanvas]);

    // Get point from mouse/touch event
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

    // Handle drawing start
    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isTeacher || !drawingEnabled) return;

        const point = getPoint(e);
        if (!point) return;

        setIsDrawing(true);
        lastPointRef.current = point;

        const socket = getSocket();
        socket.emit('whiteboard-draw', {
            sessionId,
            event: {
                type: 'start',
                point,
                color: currentColor,
                lineWidth,
                isEraser,
                pageIndex,
            },
        });
    };

    // Handle drawing move
    const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isTeacher || !isDrawing) return;

        const point = getPoint(e);
        if (!point || !lastPointRef.current) return;

        // Draw locally
        draw(lastPointRef.current, point, currentColor, lineWidth, isEraser);

        // Emit to others
        const socket = getSocket();
        socket.emit('whiteboard-draw', {
            sessionId,
            event: {
                type: 'draw',
                from: lastPointRef.current,
                point,
                color: currentColor,
                lineWidth,
                isEraser,
                pageIndex,
            },
        });

        lastPointRef.current = point;
    };

    // Handle drawing end
    const handleEnd = () => {
        if (!isTeacher) return;
        setIsDrawing(false);
        lastPointRef.current = null;
    };

    // Handle clear
    const handleClear = () => {
        if (!isTeacher) return;
        clearCanvas();

        const socket = getSocket();
        socket.emit('whiteboard-clear', { sessionId, pageIndex });
    };

    // Color options
    const colors = [
        { name: 'Kırmızı', value: '#FF0000' },
        { name: 'Mavi', value: '#0066FF' },
        { name: 'Yeşil', value: '#00CC00' },
        { name: 'Sarı', value: '#FFCC00' },
        { name: 'Beyaz', value: '#FFFFFF' },
    ];

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Drawing canvas overlay */}
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

            {/* Teacher toolbar */}
            {isTeacher && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2 bg-dark-300/90 backdrop-blur-sm rounded-xl border border-white/10 pointer-events-auto max-h-[80vh] overflow-y-auto"
                >
                    {/* Pen tool */}
                    <button
                        onClick={() => setIsEraser(false)}
                        className={`p-3 rounded-lg transition-all ${!isEraser ? 'bg-primary-500 text-white' : 'bg-dark-400 text-gray-400 hover:bg-dark-200'
                            }`}
                        title="Kalem"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                    </button>

                    {/* Eraser tool */}
                    <button
                        onClick={() => setIsEraser(true)}
                        className={`p-3 rounded-lg transition-all ${isEraser ? 'bg-primary-500 text-white' : 'bg-dark-400 text-gray-400 hover:bg-dark-200'
                            }`}
                        title="Silgi"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83l3.85 3.85c.78.78 2.05.78 2.83 0L20.41 10.27c.78-.78.78-2.05 0-2.83L16.55 3.59c-.39-.39-.9-.59-1.41-.59zm-3.56 14.12L6.12 11.66l7.07-7.07 5.46 5.46-7.07 7.07z" />
                        </svg>
                    </button>

                    {/* Divider */}
                    <div className="border-t border-white/10 my-1" />

                    {/* Color palette */}
                    {colors.map((color) => (
                        <button
                            key={color.value}
                            onClick={() => {
                                setCurrentColor(color.value);
                                setIsEraser(false);
                            }}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${currentColor === color.value && !isEraser
                                ? 'border-white scale-110'
                                : 'border-transparent hover:scale-105'
                                }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                        />
                    ))}

                    {/* Divider */}
                    <div className="border-t border-white/10 my-1" />

                    {/* Line width */}
                    <div className="flex flex-col gap-1 px-1">
                        <span className="text-xs text-gray-400 text-center">Kalınlık</span>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

                    {/* Divider */}
                    <div className="border-t border-white/10 my-1" />

                    {/* Clear button */}
                    <button
                        onClick={handleClear}
                        className="flex flex-col items-center gap-1 p-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/30"
                        title="Tahtayı Temizle"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        <span className="text-[10px]">Temizle</span>
                    </button>
                </motion.div>
            )}
        </div>
    );
};
