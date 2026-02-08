'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Participant, PDFState, Session } from '@/types';

interface RoomContextType {
    session: Session | null;
    participants: Map<string, Participant>;
    localParticipant: Participant | null;
    pdfState: PDFState | null;
    isTeacher: boolean;
    setSession: (session: Session | null) => void;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (participantId: string) => void;
    updateParticipant: (participantId: string, updates: Partial<Participant>) => void;
    setLocalParticipant: (participant: Participant | null) => void;
    setPdfState: (state: PDFState | null) => void;
    setIsTeacher: (isTeacher: boolean) => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
    const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
    const [pdfState, setPdfState] = useState<PDFState | null>(null);
    const [isTeacher, setIsTeacher] = useState(false);

    const addParticipant = useCallback((participant: Participant) => {
        setParticipants(prev => new Map(prev).set(participant.id, participant));
    }, []);

    const removeParticipant = useCallback((participantId: string) => {
        setParticipants(prev => {
            const newMap = new Map(prev);
            newMap.delete(participantId);
            return newMap;
        });
    }, []);

    const updateParticipant = useCallback((participantId: string, updates: Partial<Participant>) => {
        setParticipants(prev => {
            const participant = prev.get(participantId);
            if (participant) {
                const newMap = new Map(prev);
                newMap.set(participantId, { ...participant, ...updates });
                return newMap;
            }
            return prev;
        });
    }, []);

    return (
        <RoomContext.Provider
            value={{
                session,
                participants,
                localParticipant,
                pdfState,
                isTeacher,
                setSession,
                addParticipant,
                removeParticipant,
                updateParticipant,
                setLocalParticipant,
                setPdfState,
                setIsTeacher,
            }}
        >
            {children}
        </RoomContext.Provider>
    );
};

export const useRoomContext = () => {
    const context = useContext(RoomContext);
    if (context === undefined) {
        throw new Error('useRoomContext must be used within a RoomProvider');
    }
    return context;
};
