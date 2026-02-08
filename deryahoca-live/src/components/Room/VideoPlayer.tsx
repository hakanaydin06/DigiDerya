'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Participant } from '@/types';

interface VideoPlayerProps {
    participant: Participant;
    stream?: MediaStream;
    isLocal: boolean;
    isSpeaking: boolean;
    isTeacher?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    participant,
    stream,
    isLocal,
    isSpeaking,
    isTeacher = false,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const { userName, isMuted, isCameraOff, isHandRaised } = participant;

    return (
        <div className="relative w-full aspect-video bg-brand-dark rounded-xl overflow-hidden group">
            {/* Video Element */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal}
                className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`}
            />

            {/* Camera Off State */}
            {isCameraOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand-dark to-brand-panel">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isTeacher
                            ? 'bg-brand-primary/20 border-2 border-brand-primary/40'
                            : 'bg-brand-accent/20 border-2 border-brand-accent/40'
                        }`}>
                        <span className="text-2xl">{isTeacher ? '👨‍🔬' : '🧪'}</span>
                    </div>
                </div>
            )}

            {/* Speaking Indicator - Neon Pulse */}
            {isSpeaking && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 pointer-events-none"
                >
                    <div className={`absolute inset-0 border-2 rounded-xl animate-pulse-ring ${isTeacher ? 'border-brand-primary' : 'border-brand-accent'
                        }`} />
                </motion.div>
            )}

            {/* Bottom Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-brand-dark/80 via-brand-dark/40 to-transparent" />

            {/* User Info Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* Username */}
                    <span className={`text-sm font-medium truncate max-w-[120px] ${isTeacher ? 'text-brand-primary' : 'text-text-main'
                        }`}>
                        {userName}
                    </span>

                    {/* Status Indicators */}
                    <div className="flex items-center gap-1">
                        {/* Muted Indicator */}
                        {isMuted && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 bg-red-500/90 rounded-full flex items-center justify-center"
                            >
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            </motion.div>
                        )}

                        {/* Camera Off Indicator */}
                        {isCameraOff && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-6 h-6 bg-red-500/90 rounded-full flex items-center justify-center"
                            >
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Hand Raised (compact) */}
                {isHandRaised && (
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-6 h-6 bg-brand-highlight/90 rounded-full flex items-center justify-center"
                    >
                        <span className="text-xs">✋</span>
                    </motion.div>
                )}
            </div>

            {/* Corner Accents for Teacher */}
            {isTeacher && (
                <>
                    <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-brand-primary/60 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-brand-primary/60 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-brand-primary/60 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-brand-primary/60 rounded-br-lg" />
                </>
            )}

            {/* Local indicator */}
            {isLocal && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs text-text-muted bg-brand-dark/80 px-2 py-1 rounded backdrop-blur-sm">
                        Sen
                    </span>
                </div>
            )}
        </div>
    );
};
