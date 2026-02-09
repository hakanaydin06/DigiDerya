import React from 'react';
import type { Participant, PDFState } from '@/types';
import { FloatingTeacher } from './FloatingTeacher';
import { ParticipantDrawer } from './ParticipantDrawer';

interface MobileLayoutProps {
    // Current user context
    localParticipant: Participant | null;
    localStream: MediaStream | null;

    // Room Data
    participants: Participant[];
    remoteStreams: Map<string, MediaStream>;

    // Main Content
    pdfState: PDFState | null;
    children: React.ReactNode; // For PDF Viewer / Whiteboard

    // UI State
    isDrawerOpen: boolean;
    toggleDrawer: () => void;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
    localParticipant,
    localStream,
    participants,
    remoteStreams,
    pdfState,
    children,
    isDrawerOpen,
    toggleDrawer,
}) => {
    // Identify teacher
    const teacher = participants.find(p => p.isTeacher);
    const teacherStream = teacher ? remoteStreams.get(teacher.id) : undefined;

    // Identify peers (including self if student)
    const peers = participants.filter(p => !p.isTeacher);

    return (
        <div className="fixed inset-0 overflow-hidden bg-brand-dark flex flex-col">
            {/* Main Content Area (PDF / Whiteboard) - Full Screen */}
            <div className="absolute inset-0 z-0">
                {children}
            </div>

            {/* Floating Teacher - Top Layer */}
            {teacher && !localParticipant?.isTeacher && (
                <FloatingTeacher
                    teacher={teacher}
                    stream={teacherStream}
                    isMuted={teacher.isMuted}
                    isCameraOff={teacher.isCameraOff}
                />
            )}

            {/* Mobile Controls Overlay */}
            <div className="absolute bottom-6 right-6 z-40 flex flex-col gap-4">
                {/* Open Drawer Button */}
                <button
                    onClick={toggleDrawer}
                    className="w-14 h-14 rounded-full bg-brand-panel/90 backdrop-blur-md border border-white/10 shadow-xl flex items-center justify-center text-brand-accent hover:scale-110 transition-transform"
                >
                    <div className="relative">
                        <span className="text-2xl">👥</span>
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {participants.length}
                        </span>
                    </div>
                </button>
            </div>

            {/* Participant Drawer */}
            <ParticipantDrawer
                isOpen={isDrawerOpen}
                onClose={toggleDrawer}
                participants={participants}
                remoteStreams={remoteStreams}
                localParticipant={localParticipant}
                localStream={localStream}
            />
        </div>
    );
};
