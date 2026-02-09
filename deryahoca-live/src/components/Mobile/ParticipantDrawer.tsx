import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoPlayer } from '../Room/VideoPlayer';
import type { Participant } from '@/types';

interface ParticipantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    participants: Participant[];
    remoteStreams: Map<string, MediaStream>;
    localParticipant: Participant | null;
    localStream: MediaStream | null;
}

export const ParticipantDrawer: React.FC<ParticipantDrawerProps> = ({
    isOpen,
    onClose,
    participants,
    remoteStreams,
    localParticipant,
    localStream,
}) => {
    // Filter out teacher, as they are floating
    const students = participants.filter(p => !p.isTeacher);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 h-[70vh] bg-brand-dark rounded-t-3xl z-50 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center py-4" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                        </div>

                        {/* Title */}
                        <div className="px-6 pb-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-text-main heading-display">
                                Sınıf Arkadaşları ({students.length + (localParticipant && !localParticipant.isTeacher ? 1 : 0)})
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* content */}
                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 pb-20">
                            {/* Local Student Video */}
                            {localParticipant && !localParticipant.isTeacher && (
                                <div className="video-frame bg-brand-dark relative aspect-video rounded-xl overflow-hidden border border-brand-accent/30">
                                    <VideoPlayer
                                        participant={localParticipant}
                                        stream={localStream || undefined}
                                        isLocal={true}
                                        isSpeaking={false}
                                    />
                                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-brand-accent/90 backdrop-blur-sm text-white text-xs font-medium rounded">
                                        Sen
                                    </div>
                                </div>
                            )}

                            {/* Remote Students */}
                            {students.map((student) => (
                                <div key={student.id} className="video-frame bg-brand-dark relative aspect-video rounded-xl overflow-hidden border border-white/5">
                                    <VideoPlayer
                                        participant={student}
                                        stream={remoteStreams.get(student.id)}
                                        isLocal={false}
                                        isSpeaking={false}
                                    />
                                    {student.isHandRaised && (
                                        <div className="absolute top-2 right-2 text-xl">✋</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
