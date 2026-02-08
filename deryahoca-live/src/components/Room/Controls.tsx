'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ControlsProps {
    isMuted: boolean;
    isCameraOff: boolean;
    isHandRaised: boolean;
    isTeacher: boolean;
    onToggleMute: () => void;
    onToggleCamera: () => void;
    onToggleHand: () => void;
    onLeave: () => void;
    onSelectPdf?: () => void;
    onEndSession?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
    isMuted,
    isCameraOff,
    isHandRaised,
    isTeacher,
    onToggleMute,
    onToggleCamera,
    onToggleHand,
    onLeave,
    onSelectPdf,
    onEndSession,
}) => {
    // Confirm before leaving
    const handleLeaveClick = () => {
        const message = isTeacher
            ? 'Dersi bitirmek istediğinize emin misiniz? Tüm öğrenciler dersten çıkarılacak.'
            : 'Dersten çıkmak istediğinize emin misiniz?';

        if (window.confirm(message)) {
            isTeacher ? onEndSession?.() : onLeave();
        }
    };

    return (
        <div className="flex items-center gap-2">
            {/* Microphone toggle */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleMute}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isMuted
                    ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'bg-brand-panel/80 border border-white/10 hover:border-brand-accent/50'
                    }`}
                title={isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
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

            {/* Camera toggle */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isCameraOff
                    ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'bg-brand-panel/80 border border-white/10 hover:border-brand-accent/50'
                    }`}
                title={isCameraOff ? 'Kamerayı Aç' : 'Kamerayı Kapat'}
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

            {/* Raise hand (students only) */}
            {!isTeacher && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onToggleHand}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isHandRaised
                        ? 'bg-brand-highlight shadow-glow-highlight'
                        : 'bg-brand-panel/80 border border-white/10 hover:border-brand-highlight/50'
                        }`}
                    title={isHandRaised ? 'Eli İndir' : 'El Kaldır'}
                >
                    <motion.span
                        animate={isHandRaised ? { y: [0, -3, 0] } : {}}
                        transition={{ repeat: isHandRaised ? Infinity : 0, duration: 0.5 }}
                        className="text-xl"
                    >
                        ✋
                    </motion.span>
                </motion.button>
            )}

            {/* Teacher controls */}
            {isTeacher && (
                <>
                    {/* PDF Select */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onSelectPdf}
                        className="px-4 py-2.5 bg-brand-accent/20 text-brand-accent border border-brand-accent/30 rounded-xl font-medium text-sm hover:bg-brand-accent/30 transition-all flex items-center gap-2"
                        title="PDF Seç"
                    >
                        📄 PDF Seç
                    </motion.button>
                </>
            )}

            {/* Leave / End Session button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLeaveClick}
                className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                title={isTeacher ? 'Dersi Bitir' : 'Dersten Çık'}
            >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </motion.button>
        </div>
    );
};
