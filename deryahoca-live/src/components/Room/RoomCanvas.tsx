import React, { useRef, useEffect, useState } from 'react';
import { PDFViewer } from './PDFViewer';
import { Whiteboard } from './Whiteboard';
import type { PDFState } from '@/types';

interface RoomCanvasProps {
    sessionId: string;
    isTeacher: boolean;
    pdfState: PDFState | null;
    drawingEnabled: boolean;
    setDrawingEnabled: (enabled: boolean) => void;
    clearTrigger: number;
    setClearTrigger: React.Dispatch<React.SetStateAction<number>>; // Corrected type
    focusMode: boolean;
    onToggleFocusMode: () => void;
    onClearBoard: () => void;
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

    // PDF Handlers
    onPageChange: (page: number) => void;
    onZoomChange: (zoom: number) => void;

    // Shared State
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

    // Socket
    emit: any;
    on: any;
    off: any;
}

export const RoomCanvas: React.FC<RoomCanvasProps> = ({
    sessionId,
    isTeacher,
    pdfState,
    drawingEnabled,
    setDrawingEnabled,
    clearTrigger,
    setClearTrigger,
    focusMode,
    onToggleFocusMode,
    onClearBoard,
    isMuted,
    isCameraOff,
    onToggleMute,
    onToggleCamera,
    onSelectPdf,
    onLeave,
    onScreenshot,
    onScreenRecord,
    isRecording,
    onPageChange,
    onZoomChange,
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
    emit,
    on,
    off,
}) => {
    const boardContainerRef = useRef<HTMLDivElement>(null);
    const [boardSize, setBoardSize] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateSize = () => {
            if (boardContainerRef.current) {
                setBoardSize({
                    width: boardContainerRef.current.clientWidth,
                    height: boardContainerRef.current.clientHeight,
                });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    return (
        <div className="flex-1 min-w-0 relative h-full" ref={boardContainerRef}>
            <div className="h-full glass-panel rounded-2xl overflow-hidden border border-brand-accent/20">
                <PDFViewer
                    pdfUrl={pdfState?.pdfUrl || null}
                    currentPage={pdfState?.currentPage || 1}
                    zoom={pdfState?.zoom || 100}
                    isTeacher={isTeacher}
                    onPageChange={onPageChange}
                    onZoomChange={onZoomChange}
                    // Annotation props
                    sessionId={sessionId}
                    drawingEnabled={drawingEnabled}
                    clearTrigger={clearTrigger}
                    currentColor={currentColor}
                    lineWidth={lineWidth}
                    isEraser={isEraser}
                    textMode={textMode}
                    setTextMode={setTextMode}
                    selectedSymbol={selectedSymbol}
                    onSymbolPlaced={() => setSelectedSymbol(null)}
                    // Socket props
                    emit={emit}
                    on={on}
                    off={off}
                />

                {/* Whiteboard Overlay - Toolbar Only */}
                <Whiteboard
                    sessionId={sessionId}
                    isTeacher={isTeacher}
                    width={boardSize.width}
                    height={boardSize.height}
                    drawingEnabled={drawingEnabled}
                    pageIndex={pdfState ? pdfState.currentPage - 1 : 0}
                    clearTrigger={clearTrigger}
                    focusMode={focusMode}
                    onToggleFocusMode={onToggleFocusMode}
                    onToggleDrawing={() => setDrawingEnabled(!drawingEnabled)}
                    onClearBoard={onClearBoard}
                    isMuted={isMuted}
                    isCameraOff={isCameraOff}
                    onToggleMute={onToggleMute}
                    onToggleCamera={onToggleCamera}
                    onSelectPdf={onSelectPdf}
                    onLeave={onLeave}
                    onScreenshot={onScreenshot}
                    onScreenRecord={onScreenRecord}
                    isRecording={isRecording}
                    // Shared State Props
                    currentColor={currentColor}
                    setCurrentColor={setCurrentColor}
                    lineWidth={lineWidth}
                    setLineWidth={setLineWidth}
                    isEraser={isEraser}
                    setIsEraser={setIsEraser}
                    textMode={textMode}
                    setTextMode={setTextMode}
                    selectedSymbol={selectedSymbol}
                    setSelectedSymbol={setSelectedSymbol}
                />

                {/* Lightboard Corner Accents */}
                <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 border-brand-accent/40 pointer-events-none" />
                <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 border-brand-accent/40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 border-brand-accent/40 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 border-brand-accent/40 pointer-events-none" />
            </div>
        </div>
    );
};
