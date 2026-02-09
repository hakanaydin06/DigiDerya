import React, { useState, useRef, useEffect } from 'react';
import { motion, useDragControls } from 'framer-motion';
import { VideoPlayer } from '../Room/VideoPlayer';
import type { Participant } from '@/types';

interface FloatingTeacherProps {
    teacher: Participant;
    stream: MediaStream | undefined;
    isMuted: boolean;
    isCameraOff: boolean;
}

export const FloatingTeacher: React.FC<FloatingTeacherProps> = ({
    teacher,
    stream,
    isMuted,
    isCameraOff,
}) => {
    const constraintsRef = useRef(null);
    const dragControls = useDragControls();
    const [isExpanded, setIsExpanded] = useState(false);

    // Initial position logic could be added here if needed

    return (
        <>
            {/* Constraint Area - Invisible container for drag bounds */}
            <div ref={constraintsRef} className="absolute inset-4 pointer-events-none z-50" />

            <motion.div
                drag
                dragControls={dragControls}
                dragConstraints={constraintsRef}
                dragMomentum={false}
                dragElastic={0.1}
                initial={{ x: window.innerWidth - 140, y: 20 }}
                className="absolute z-50 touch-none"
            >
                <div
                    className={`relative transition-all duration-300 ${isExpanded ? 'w-48 h-36' : 'w-28 h-28'}`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 border-brand-primary/50 bg-brand-dark">
                        <VideoPlayer
                            participant={teacher}
                            stream={stream}
                            isLocal={false}
                            isSpeaking={false} // Could pass this if available
                            isTeacher={true}
                        />

                        {/* Drag Handle Overlay */}
                        <div className="absolute inset-0 bg-transparent hover:bg-white/5 transition-colors cursor-move" />
                    </div>

                    {/* Status Indicators */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                        {isMuted && (
                            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-md border border-white/20">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
};
