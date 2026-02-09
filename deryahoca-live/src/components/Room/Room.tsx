'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { getSocket } from '@/lib/socket/client';
import { VideoGrid } from './VideoGrid';
import { PDFViewer } from './PDFViewer';
import { Controls } from './Controls';
import { ClassTimer } from './ClassTimer';
import { Whiteboard } from './Whiteboard';
import type { Participant, PDFState, WaitingStudent } from '@/types';

interface RoomProps {
    sessionId: string;
    userName: string;
    isTeacher: boolean;
    localStream: MediaStream | null;
    onLeave: () => void;
}

export const Room: React.FC<RoomProps> = ({
    sessionId,
    userName,
    isTeacher,
    localStream,
    onLeave,
}) => {
    // Debug: Log stream info at Room level
    console.log('🏠 Room component render:', {
        hasLocalStream: !!localStream,
        localStreamId: localStream?.id,
        localStreamActive: localStream?.active,
        videoTracks: localStream?.getVideoTracks().length,
        audioTracks: localStream?.getAudioTracks().length,
    });

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
    const [pdfState, setPdfState] = useState<PDFState | null>(null);
    const [showPdfSelector, setShowPdfSelector] = useState(false);
    const [availablePdfs, setAvailablePdfs] = useState<{ name: string; url: string }[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [isHandRaised, setIsHandRaised] = useState(false);

    // New features state
    const [waitingStudents, setWaitingStudents] = useState<WaitingStudent[]>([]);
    const [focusMode, setFocusMode] = useState(false);
    const [drawingEnabled, setDrawingEnabled] = useState(false); // Drawing mode toggle (whiteboard always visible)
    const [clearTrigger, setClearTrigger] = useState(0);
    const boardContainerRef = useRef<HTMLDivElement>(null);
    const [boardSize, setBoardSize] = useState({ width: 800, height: 600 });

    // Lifted drawing state
    const [currentColor, setCurrentColor] = useState('#FF0000');
    const [lineWidth, setLineWidth] = useState(3);
    const [isEraser, setIsEraser] = useState(false);
    const [textMode, setTextMode] = useState(false);
    const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

    // Update board size
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

    // Prevent accidental page leave/refresh
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Dersten çıkmak istediğinize emin misiniz?';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Initialize local participant
    useEffect(() => {
        setLocalParticipant({
            id: 'local',
            userName,
            isTeacher,
            sessionId,
            isMuted: false, // Default state, irrelevant if no stream
            isCameraOff: !localStream, // If no stream, camera is effectively off
            isHandRaised: false,
            stream: localStream,
        });
    }, [userName, isTeacher, sessionId, localStream]);

    // Socket handlers
    const handleParticipantJoined = useCallback((participant: Participant) => {
        const socket = getSocket();
        if (participant.id === socket.id) return; // Ignore self to prevent ghost participant

        // Also remove from waiting list if was there
        setWaitingStudents(prev => prev.filter(s => s.id !== participant.id));

        setParticipants(prev => {
            if (prev.some(p => p.id === participant.id)) return prev;
            return [...prev, participant];
        });
    }, []);



    const handleParticipantLeft = useCallback((participantId: string) => {
        setParticipants(prev => {
            const newParticipants = prev.filter(p => p.id !== participantId);
            return newParticipants;
        });
    }, []);

    const handleExistingParticipants = useCallback((existingParticipants: Participant[]) => {
        setParticipants(existingParticipants);
    }, []);

    // Use socket hook
    const { isConnected, emit, on, off } = useSocket({
        sessionId,
        userName,
        isTeacher,
        onParticipantJoined: handleParticipantJoined,
        onParticipantLeft: handleParticipantLeft,
        onExistingParticipants: handleExistingParticipants,
    });

    // Request initial sync
    useEffect(() => {
        if (isConnected && sessionId) {
            emit('request-sync', { sessionId });
        }
    }, [isConnected, sessionId, emit]);

    // Use WebRTC hook
    const { remoteStreams } = useWebRTC({
        sessionId,
        localStream,
        isTeacher,
    });

    // Listen for waiting room events (Teacher only)
    useEffect(() => {
        if (!isTeacher) return;

        const handleStudentWaiting = (student: WaitingStudent) => {
            setWaitingStudents(prev => {
                if (prev.some(s => s.id === student.id)) return prev;
                return [...prev, student];
            });
        };

        const handleWaitingStudents = (students: WaitingStudent[]) => {
            setWaitingStudents(students);
        };

        const handleWaitingStudentLeft = (data: { id: string }) => {
            setWaitingStudents(prev => prev.filter(s => s.id !== data.id));
        };

        on('student-waiting', handleStudentWaiting);
        on('waiting-students', handleWaitingStudents);
        on('waiting-student-left', handleWaitingStudentLeft);

        return () => {
            off('student-waiting', handleStudentWaiting);
            off('waiting-students', handleWaitingStudents);
            off('waiting-student-left', handleWaitingStudentLeft);
        };
    }, [isTeacher, on, off]);

    // Listen for focus mode sync
    useEffect(() => {
        const handleFocusModeSync = (data: { enabled: boolean }) => {
            setFocusMode(data.enabled);
        };

        on('focus-mode-sync', handleFocusModeSync);

        return () => {
            off('focus-mode-sync', handleFocusModeSync);
        };
    }, [on, off]);

    // Listen for PDF sync events
    useEffect(() => {
        const handlePdfSync = (state: PDFState) => {
            setPdfState(state);
        };

        const handlePageSync = (data: { page: number }) => {
            setPdfState(prev => prev ? { ...prev, currentPage: data.page } : null);
        };

        const handleZoomSync = (data: { zoom: number }) => {
            setPdfState(prev => prev ? { ...prev, zoom: data.zoom } : null);
        };

        const handleParticipantUpdated = (data: { id: string; isMuted?: boolean; isCameraOff?: boolean }) => {
            setParticipants(prev => prev.map(p =>
                p.id === data.id
                    ? { ...p, isMuted: data.isMuted ?? p.isMuted, isCameraOff: data.isCameraOff ?? p.isCameraOff }
                    : p
            ));
        };

        const handleHandRaised = (data: { id: string; isHandRaised: boolean }) => {
            setParticipants(prev => prev.map(p =>
                p.id === data.id ? { ...p, isHandRaised: data.isHandRaised } : p
            ));
        };

        on('pdf-sync', handlePdfSync);
        on('pdf-page-sync', handlePageSync);
        on('pdf-zoom-sync', handleZoomSync);
        on('participant-updated', handleParticipantUpdated);
        on('hand-raised', handleHandRaised);

        return () => {
            off('pdf-sync', handlePdfSync);
            off('pdf-page-sync', handlePageSync);
            off('pdf-zoom-sync', handleZoomSync);
            off('participant-updated', handleParticipantUpdated);
            off('hand-raised', handleHandRaised);
        };
    }, [on, off]);

    // Fetch available PDFs for teacher
    useEffect(() => {
        if (isTeacher) {
            fetch('/api/pdfs/list')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setAvailablePdfs(data.data);
                    }
                })
                .catch(err => console.error('Error fetching PDFs:', err));
        }
    }, [isTeacher]);

    // Admit student handler (Teacher only)
    const handleAdmitStudent = (studentId: string) => {
        emit('admit-student', { studentSocketId: studentId, sessionId });
        setWaitingStudents(prev => prev.filter(s => s.id !== studentId));
    };

    // Deny student handler (Teacher only)
    const handleDenyStudent = (studentId: string) => {
        emit('deny-student', { studentSocketId: studentId, sessionId });
        setWaitingStudents(prev => prev.filter(s => s.id !== studentId));
    };

    // Toggle focus mode (Teacher only)
    const handleToggleFocusMode = () => {
        const newState = !focusMode;
        setFocusMode(newState);
        emit('toggle-focus-mode', { sessionId, enabled: newState });
    };

    // Clear whiteboard (Teacher only)
    const handleClearBoard = () => {
        if (window.confirm('Bu sayfadaki tüm çizimleri silmek istediğinize emin misiniz?')) {
            const pageIndex = pdfState ? pdfState.currentPage - 1 : 0;
            emit('whiteboard-clear', { sessionId, pageIndex });
            setClearTrigger(prev => prev + 1); // Trigger local clear
        }
    };

    // Control handlers
    const handleToggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
            emit('toggle-audio', { isMuted: !isMuted });
            setLocalParticipant(prev => prev ? { ...prev, isMuted: !isMuted } : null);
        }
    };

    const handleToggleCamera = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsCameraOff(!isCameraOff);
            emit('toggle-video', { isCameraOff: !isCameraOff });
            setLocalParticipant(prev => prev ? { ...prev, isCameraOff: !isCameraOff } : null);
        }
    };

    // Teacher lowers student hand
    const handleLowerHand = (targetId: string) => {
        if (isTeacher) {
            emit('lower-hand', { targetId });
        }
    };

    const handleToggleHand = () => {
        const newState = !isHandRaised;
        setIsHandRaised(newState);
        emit('raise-hand', { isHandRaised: newState });
        setLocalParticipant(prev => prev ? { ...prev, isHandRaised: newState } : null);
    };

    const handleSelectPdf = (pdf: { name: string; url: string }) => {
        const newPdfState: PDFState = {
            pdfUrl: pdf.url,
            pdfName: pdf.name,
            currentPage: 1,
            totalPages: 0,
            zoom: 100,
        };
        setPdfState(newPdfState);
        emit('pdf-change', { sessionId, pdfState: newPdfState });
        setShowPdfSelector(false);
    };

    const handlePageChange = (page: number) => {
        setPdfState(prev => prev ? { ...prev, currentPage: page } : null);
        emit('pdf-page-change', { sessionId, page });
    };

    const handleZoomChange = (zoom: number) => {
        setPdfState(prev => prev ? { ...prev, zoom } : null);
        emit('pdf-zoom-change', { sessionId, zoom });
    };

    const handleLeave = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        onLeave();
    };

    const handleEndSession = () => {
        handleLeave();
    };

    // Filter participants based on focus mode
    const getFilteredParticipants = () => {
        if (!focusMode || isTeacher) {
            return participants;
        } else {
            return participants.filter(p => p.isTeacher);
        }
    };

    const filteredParticipants = getFilteredParticipants();

    return (
        <div className="h-screen science-lab-bg science-lab-gradient flex flex-col overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-brand-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/4 w-[600px] h-[600px] bg-brand-accent/5 rounded-full blur-3xl" />
            </div>

            {/* Header - Control Center Style */}
            <div className="h-16 px-6 flex items-center justify-between glass-panel border-b border-white/5 relative z-10">
                <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-accent rounded-xl flex items-center justify-center shadow-glow-sm">
                            <span className="text-xl">🔬</span>
                        </div>
                        <div>
                            <h1 className="text-text-main font-bold heading-display text-sm">
                                Derya Hoca
                            </h1>
                            <p className="text-xs text-brand-accent">
                                Fen Bilimleri Laboratuvarı
                            </p>
                        </div>
                    </div>
                </div>

                {/* Class Timer - Centered */}
                {isTeacher && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <ClassTimer />
                    </div>
                )}

                {/* Status Bar */}
                <div className="flex items-center gap-4">
                    {/* Student Controls (Moved from bottom) */}
                    {!isTeacher && (
                        <div className="flex items-center gap-2 mr-2 border-r border-white/10 pr-4">
                            <Controls
                                isMuted={isMuted}
                                isCameraOff={isCameraOff}
                                isHandRaised={isHandRaised}
                                isTeacher={isTeacher}
                                onToggleMute={handleToggleMute}
                                onToggleCamera={handleToggleCamera}
                                onToggleHand={handleToggleHand}
                                onLeave={handleLeave}
                                onSelectPdf={() => setShowPdfSelector(true)}
                                onEndSession={handleEndSession}
                            />
                        </div>
                    )}

                    {/* Connection Status */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-panel/50 rounded-full border border-white/5">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-brand-accent animate-pulse' : 'bg-red-500'}`} />
                        <span className="text-xs text-text-muted">
                            {isConnected ? 'Bağlı' : 'Bağlanıyor...'}
                        </span>
                    </div>

                    {/* Focus Mode Indicator */}
                    {focusMode && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-highlight/20 rounded-full border border-brand-highlight/30"
                        >
                            <span className="text-brand-highlight">🎯</span>
                            <span className="text-xs text-brand-highlight font-medium">Odak Modu</span>
                        </motion.div>
                    )}

                    {/* Waiting Students Badge */}
                    {isTeacher && waitingStudents.length > 0 && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/20 rounded-full border border-brand-primary/30 animate-pulse"
                        >
                            <span className="text-brand-primary">⏳</span>
                            <span className="text-xs text-brand-primary font-medium">
                                {waitingStudents.length} bekliyor
                            </span>
                        </motion.div>
                    )}

                    {/* Participants Count */}
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-panel/50 rounded-full border border-white/5">
                        <span className="text-brand-accent">👥</span>
                        <span className="text-xs text-text-muted">
                            {participants.length + 1} katılımcı
                        </span>
                    </div>
                </div>
            </div>

            {/* Waiting Students Panel (Teacher only) */}
            <AnimatePresence>
                {/* Filter out students who are already participants */}
                {isTeacher && waitingStudents.filter(ws => !participants.some(p => p.id === ws.id)).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -20, height: 0 }}
                        className="mx-4 mt-3 glass-panel rounded-xl border border-brand-primary/30 overflow-hidden relative z-10"
                    >
                        <div className="p-4">
                            <h3 className="text-text-main font-semibold mb-3 flex items-center gap-2 heading-display text-sm">
                                <span className="text-brand-primary">⏳</span> Bekleme Odasında
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {waitingStudents.filter(ws => !participants.some(p => p.id === ws.id)).map((student) => (
                                    <motion.div
                                        key={student.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-3 p-3 bg-brand-dark/50 rounded-xl border border-white/5"
                                    >
                                        <div className="w-10 h-10 bg-brand-accent/20 rounded-full flex items-center justify-center border border-brand-accent/30">
                                            <span className="text-lg">🧪</span>
                                        </div>
                                        <span className="text-text-main font-medium">{student.userName}</span>
                                        <div className="flex gap-2 ml-2">
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleAdmitStudent(student.id)}
                                                className="px-3 py-1.5 bg-brand-accent text-white text-sm rounded-lg font-medium hover:shadow-glow-accent transition-all"
                                            >
                                                ✓ Kabul
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleDenyStudent(student.id)}
                                                className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-lg font-medium hover:bg-red-500/30 transition-all"
                                            >
                                                ✕ Reddet
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden p-4 gap-4 relative z-10">
                {/* PDF/Whiteboard Area (70%) */}
                <div className="flex-1 min-w-0 relative" ref={boardContainerRef}>
                    <div className="h-full glass-panel rounded-2xl overflow-hidden border border-brand-accent/20">
                        <PDFViewer
                            pdfUrl={pdfState?.pdfUrl || null}
                            currentPage={pdfState?.currentPage || 1}
                            zoom={pdfState?.zoom || 100}
                            isTeacher={isTeacher}
                            onPageChange={handlePageChange}
                            onZoomChange={handleZoomChange}
                            // Annotation props
                            sessionId={sessionId}
                            drawingEnabled={drawingEnabled}
                            clearTrigger={clearTrigger}
                            currentColor={currentColor}
                            lineWidth={lineWidth}
                            isEraser={isEraser}
                            textMode={textMode}
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
                            onToggleFocusMode={handleToggleFocusMode}
                            onToggleDrawing={() => setDrawingEnabled(!drawingEnabled)}
                            onClearBoard={handleClearBoard}
                            isMuted={isMuted}
                            isCameraOff={isCameraOff}
                            onToggleMute={handleToggleMute}
                            onToggleCamera={handleToggleCamera}
                            onSelectPdf={() => setShowPdfSelector(true)}
                            onLeave={handleEndSession}
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

                {/* Video Sidebar (30%) */}
                <div className="w-80 flex-shrink-0">
                    <div className="h-full glass-panel rounded-2xl p-3 border border-white/5">
                        <VideoGrid
                            participants={filteredParticipants}
                            remoteStreams={remoteStreams}
                            localStream={localStream}
                            localParticipant={localParticipant}
                            onLowerHand={handleLowerHand}
                        />

                        {/* Focus Mode Message for Students */}
                        {focusMode && !isTeacher && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-3 p-3 bg-brand-highlight/10 rounded-xl text-center border border-brand-highlight/20"
                            >
                                <p className="text-brand-highlight text-sm flex items-center justify-center gap-2">
                                    <span>🎯</span> Odak modu aktif
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>



            {/* PDF Selector Modal */}
            <AnimatePresence>
                {showPdfSelector && isTeacher && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPdfSelector(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-panel rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden border-2 border-brand-primary/30"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold text-text-main mb-4 heading-display flex items-center gap-2">
                                <span>📄</span> PDF Seçin
                            </h2>

                            {availablePdfs.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-brand-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center border border-brand-primary/30">
                                        <span className="text-3xl">📄</span>
                                    </div>
                                    <p className="text-text-muted">Henüz yüklenmiş PDF yok</p>
                                    <p className="text-sm text-text-muted/70 mt-2">
                                        <code className="bg-brand-dark px-2 py-1 rounded">/uploads/pdfs</code> klasörüne PDF dosyaları ekleyin
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {availablePdfs.map((pdf, index) => (
                                        <motion.button
                                            key={index}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => handleSelectPdf(pdf)}
                                            className="w-full p-4 bg-brand-dark hover:bg-brand-primary/10 rounded-xl text-left transition-colors flex items-center gap-3 border border-white/5 hover:border-brand-primary/30"
                                        >
                                            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center border border-red-500/30">
                                                <span className="text-red-400 font-bold text-xs">PDF</span>
                                            </div>
                                            <span className="text-text-main truncate">{pdf.name}</span>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={() => setShowPdfSelector(false)}
                                className="mt-4 w-full py-3 bg-brand-panel text-text-muted rounded-xl hover:bg-brand-panel/80 transition-colors border border-white/10"
                            >
                                İptal
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
