'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { getSocket } from '@/lib/socket/client';

// Generate or retrieve unique session user ID
const getUserSessionId = (): string => {
    if (typeof window === 'undefined') return '';

    const existingId = sessionStorage.getItem('userSessionId');
    if (existingId) return existingId;

    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('userSessionId', newId);
    return newId;
};

interface LobbyProps {
    sessionId: string;
    isTeacher: boolean;
    onJoin: (userName: string, stream: MediaStream) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
    sessionId,
    isTeacher,
    onJoin,
}) => {
    const [userName, setUserName] = useState('');
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [waitingForApproval, setWaitingForApproval] = useState(false);
    const [waitingMessage, setWaitingMessage] = useState('Öğretmenin onayı bekleniyor...');
    const [isDenied, setIsDenied] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const userSessionId = useRef<string>('');

    // Initialize unique session ID
    useEffect(() => {
        userSessionId.current = getUserSessionId();
    }, []);

    const {
        stream,
        isMuted,
        isCameraOff,
        toggleAudio,
        toggleVideo,
        initializeStream,
        error: mediaError,
    } = useMediaDevices();

    // Auto-initialize media stream on mount
    useEffect(() => {
        initializeStream();
    }, [initializeStream]);

    // Connect video preview
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Listen for admission events (Students only)
    useEffect(() => {
        if (isTeacher) return;

        const socket = getSocket();

        const handleWaitingForApproval = (data: { message: string }) => {
            setWaitingForApproval(true);
            setWaitingMessage(data.message);
        };

        const handleAdmissionApproved = (data: { message: string }) => {
            setWaitingForApproval(false);
            if (stream && userName) {
                onJoin(userName, stream);
            }
        };

        const handleAdmissionDenied = (data: { message: string }) => {
            setWaitingForApproval(false);
            setIsDenied(true);
            setError(data.message);
        };

        socket.on('waiting-for-approval', handleWaitingForApproval);
        socket.on('admission-approved', handleAdmissionApproved);
        socket.on('admission-denied', handleAdmissionDenied);

        socket.on('join-error', (data: { message: string }) => {
            alert(data.message);
            setWaitingForApproval(false);
        });

        return () => {
            socket.off('waiting-for-approval', handleWaitingForApproval);
            socket.off('admission-approved', handleAdmissionApproved);
            socket.off('admission-denied', handleAdmissionDenied);
        };
    }, [isTeacher, stream, userName, onJoin]);

    // Check readiness
    useEffect(() => {
        setIsReady(!!stream && userName.trim().length >= 2);
    }, [stream, userName]);

    // Handle join click
    const handleJoin = () => {
        if (!isReady || !stream) return;

        if (isTeacher) {
            onJoin(userName, stream);
        } else {
            const socket = getSocket();
            setWaitingForApproval(true);
            setWaitingMessage('Öğretmenin onayı bekleniyor...');

            socket.emit('join-room', {
                sessionId,
                userName,
                isTeacher: false,
            });
        }
    };

    // Show denied state
    if (isDenied) {
        return (
            <div className="min-h-screen science-lab-bg science-lab-gradient flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel rounded-3xl p-8 max-w-md w-full text-center border-2 border-red-500/30"
                >
                    <div className="w-20 h-20 bg-red-500/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <span className="text-4xl">🚫</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main heading-display mb-4">
                        Katılım Reddedildi
                    </h1>
                    <p className="text-text-muted">{error || 'Derse katılım isteğiniz reddedildi.'}</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen science-lab-bg science-lab-gradient flex items-center justify-center p-4">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-accent/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="glass-panel rounded-3xl p-8 max-w-lg w-full border border-white/10 relative z-10"
            >
                {/* Branded Header - The Portal */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-4xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent drop-shadow-lg heading-display">
                            Derya Hoca
                        </h1>
                        <p className="text-brand-accent/80 text-sm tracking-widest uppercase mt-2">
                            Dijital Fen Bilimleri Sınıfı
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4"
                    >
                        <p className="text-text-muted text-sm">
                            {isTeacher ? '🔬 Laboratuvarı Aç' : '🧪 Deneye Katıl'}
                        </p>
                    </motion.div>
                </div>

                {/* Video Preview - Lightboard Style */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="relative aspect-video bg-brand-dark rounded-xl overflow-hidden mb-6 border-2 border-brand-accent/50 shadow-[0_0_25px_rgba(16,185,129,0.2)] neon-pulse"
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
                    />

                    {isCameraOff && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-dark to-brand-panel">
                            <div className="w-24 h-24 bg-brand-primary/20 rounded-full flex items-center justify-center border-2 border-brand-primary/30">
                                <svg className="w-12 h-12 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Lightboard Corner Accents */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-brand-accent/60" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-brand-accent/60" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-brand-accent/60" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-brand-accent/60" />

                    {/* Device Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleAudio}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${isMuted
                                ? 'bg-red-500/90 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                : 'bg-brand-panel/80 border border-white/10 hover:border-brand-accent/50'
                                }`}
                        >
                            {isMuted ? (
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={toggleVideo}
                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm ${isCameraOff
                                ? 'bg-red-500/90 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                                : 'bg-brand-panel/80 border border-white/10 hover:border-brand-accent/50'
                                }`}
                        >
                            {isCameraOff ? (
                                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Error message */}
                <AnimatePresence>
                    {(error || mediaError) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                        >
                            <p className="text-red-400 text-sm text-center flex items-center justify-center gap-2">
                                <span>⚠️</span> {error || mediaError}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Waiting Overlay - Science Lab Style */}
                <AnimatePresence>
                    {waitingForApproval && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="glass-panel rounded-3xl p-10 max-w-sm w-full text-center mx-4 border-2 border-brand-primary/30"
                            >
                                {/* DNA Helix Animation */}
                                <div className="w-24 h-24 mx-auto mb-6 relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-0"
                                    >
                                        <div className="w-full h-full border-4 border-brand-primary/30 border-t-brand-primary rounded-full" />
                                    </motion.div>
                                    <motion.div
                                        animate={{ rotate: -360 }}
                                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                        className="absolute inset-2"
                                    >
                                        <div className="w-full h-full border-4 border-brand-accent/30 border-t-brand-accent rounded-full" />
                                    </motion.div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl">🧬</span>
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-text-main heading-display mb-2">
                                    Bekleme Odasında
                                </h2>
                                <p className="text-text-muted">{waitingMessage}</p>
                                <p className="text-sm text-brand-accent/70 mt-4">
                                    Öğretmen sizi derse kabul edene kadar bekleyiniz...
                                </p>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Name Input - Science Style */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6"
                >
                    <label className="block text-sm text-brand-accent mb-2 font-medium tracking-wide">
                        {isTeacher ? '👨‍🔬 Görüntülenecek İsim' : '🧪 Adınız'}
                    </label>
                    <input
                        type="text"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder={isTeacher ? 'Öğretmen' : 'Adınızı yazın...'}
                        className="w-full px-4 py-4 bg-brand-dark border-2 border-brand-primary/30 rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:border-brand-primary focus:shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-300"
                    />
                </motion.div>

                {/* Join Button - Neon Glow */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    whileHover={isReady ? { scale: 1.02 } : {}}
                    whileTap={isReady ? { scale: 0.98 } : {}}
                    onClick={handleJoin}
                    disabled={!isReady || waitingForApproval}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 heading-display ${isReady && !waitingForApproval
                        ? 'bg-gradient-to-r from-brand-primary to-violet-600 text-white shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:shadow-[0_0_35px_rgba(139,92,246,0.6)]'
                        : 'bg-brand-panel text-text-muted cursor-not-allowed border border-white/10'
                        }`}
                >
                    {waitingForApproval ? (
                        <span className="flex items-center justify-center gap-2">
                            <motion.span
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                                ⏳
                            </motion.span>
                            Bekleniyor...
                        </span>
                    ) : isTeacher ? (
                        <span className="flex items-center justify-center gap-2">
                            🔬 Laboratuvarı Aç
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            🚀 Derse Katıl
                        </span>
                    )}
                </motion.button>

                {/* Info */}
                {!isTeacher && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center text-text-muted text-sm mt-4 flex items-center justify-center gap-2"
                    >
                        <span className="text-brand-accent">●</span>
                        Katıldığınızda öğretmenin onayı alınacak
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
};
