'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPlayer } from './VideoPlayer';
import type { Participant } from '@/types';

interface VideoGridProps {
    participants: Participant[];
    remoteStreams: Map<string, MediaStream>;
    localStream: MediaStream | null;
    localParticipant: Participant | null;
    onLowerHand?: (targetId: string) => void;
}

export const VideoGrid: React.FC<VideoGridProps> = ({
    participants,
    remoteStreams,
    localStream,
    localParticipant,
    onLowerHand,
}) => {
    // Debug logging for stream issues
    console.log('🎬 VideoGrid render:', {
        hasLocalStream: !!localStream,
        localStreamId: localStream?.id,
        localStreamActive: localStream?.active,
        localVideoTracks: localStream?.getVideoTracks().length,
        hasLocalParticipant: !!localParticipant,
        isLocalTeacher: localParticipant?.isTeacher,
        participantCount: participants.length
    });

    // Filter out duplicates by ID
    const uniqueParticipants = participants.filter((p, index, self) =>
        index === self.findIndex(t => t.id === p.id)
    );
    console.log('👥 VideoGrid participants:', uniqueParticipants.map(p => ({ id: p.id, name: p.userName, isTeacher: p.isTeacher })));

    // Find teacher and students from unique list
    const teacher = uniqueParticipants.find(p => p.isTeacher);
    const students = uniqueParticipants.filter(p => !p.isTeacher);
    const isLocalTeacher = localParticipant?.isTeacher;

    // Calculate grid layout
    const totalVideos = (localParticipant ? 1 : 0) + participants.length;

    const getGridClass = () => {
        if (totalVideos <= 1) return 'grid-cols-1';
        if (totalVideos <= 2) return 'grid-cols-1 sm:grid-cols-2';
        if (totalVideos <= 4) return 'grid-cols-2';
        if (totalVideos <= 6) return 'grid-cols-2 lg:grid-cols-3';
        return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    };

    return (
        <div className="h-full flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <h3 className="text-text-muted text-sm font-medium flex items-center gap-2">
                    <span className="text-brand-accent">●</span>
                    Katılımcılar
                    <span className="bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full text-xs">
                        {totalVideos}
                    </span>
                </h3>
            </div>

            {/* Video Grid Container */}
            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
                {/* Teacher Video - Featured */}
                {(teacher || isLocalTeacher) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative"
                    >
                        {isLocalTeacher ? (
                            <div className="video-frame teacher active bg-brand-dark">
                                <VideoPlayer
                                    key={`local-teacher-${localStream?.id}`}
                                    participant={{
                                        id: localParticipant?.id || 'local',
                                        userName: localParticipant?.userName || 'Derya Hoca',
                                        isTeacher: true,
                                        sessionId: localParticipant?.sessionId || '',
                                        isMuted: localParticipant?.isMuted || false,
                                        isCameraOff: false, // Always show video element for local user
                                        isHandRaised: localParticipant?.isHandRaised || false
                                    }}
                                    stream={localStream || undefined}
                                    isLocal={true}
                                    isSpeaking={false}
                                    isTeacher={true}
                                />
                                {/* Teacher Badge */}
                                <div className="absolute top-2 left-2 px-2 py-1 bg-brand-primary/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-1">
                                    <span>👨‍🔬</span> Öğretmen
                                </div>
                            </div>
                        ) : teacher && (
                            <div className="video-frame teacher bg-brand-dark">
                                <VideoPlayer
                                    participant={teacher}
                                    stream={remoteStreams.get(teacher.id)}
                                    isLocal={false}
                                    isSpeaking={false}
                                    isTeacher={true}
                                />
                                {/* Teacher Badge */}
                                <div className="absolute top-2 left-2 px-2 py-1 bg-brand-primary/90 backdrop-blur-sm text-white text-xs font-medium rounded-lg flex items-center gap-1">
                                    <span>👨‍🔬</span> Öğretmen
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Students Grid */}
                <AnimatePresence mode="popLayout">
                    <div className={`grid ${getGridClass()} gap-2`}>
                        {/* Local Student Video (if student) */}
                        {!isLocalTeacher && localParticipant && (
                            <motion.div
                                key="local"
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="video-frame bg-brand-dark relative"
                            >
                                <VideoPlayer
                                    participant={localParticipant}
                                    stream={localStream || undefined}
                                    isLocal={true}
                                    isSpeaking={false}
                                />
                                {/* You Badge */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand-accent/90 backdrop-blur-sm text-white text-xs font-medium rounded flex items-center gap-1">
                                    Sen
                                </div>
                            </motion.div>
                        )}

                        {/* Remote Participants */}
                        {students.map((participant, index) => (
                            <motion.div
                                key={participant.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                                transition={{ delay: index * 0.05 }}
                                className={`video-frame bg-brand-dark relative ${participant.isHandRaised ? 'ring-2 ring-brand-highlight shadow-glow-highlight' : ''
                                    }`}
                            >
                                <VideoPlayer
                                    participant={participant}
                                    stream={remoteStreams.get(participant.id)}
                                    isLocal={false}
                                    isSpeaking={false}
                                />

                                {/* Hand Raised Indicator */}
                                {participant.isHandRaised && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                        className={`absolute top-2 right-2 ${onLowerHand ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                                        onClick={(e) => {
                                            if (onLowerHand) {
                                                e.stopPropagation();
                                                onLowerHand(participant.id);
                                            }
                                        }}
                                        title={onLowerHand ? "Eli İndir" : undefined}
                                    >
                                        <motion.span
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.5 }}
                                            className="text-2xl drop-shadow-lg"
                                        >
                                            ✋
                                        </motion.span>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </AnimatePresence>

                {/* Empty State - Waiting for Teacher/Participants */}
                {!teacher && !isLocalTeacher && students.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 opacity-50">
                        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-2 animate-pulse">
                            <span className="text-3xl">📡</span>
                        </div>
                        <p className="text-xs text-text-muted">Bağlantı bekleniyor...</p>
                    </div>
                )}
            </div>

            {/* Connection Quality Indicator */}
            <div className="flex items-center justify-center gap-2 py-2 border-t border-white/5">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
                    <span className="text-xs text-text-muted">Bağlantı iyi</span>
                </div>
            </div>
        </div>
    );
};
