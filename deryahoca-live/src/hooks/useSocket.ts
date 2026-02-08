'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket/client';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Participant } from '@/types';

interface UseSocketOptions {
    sessionId: string;
    userName: string;
    isTeacher: boolean;
    onParticipantJoined?: (participant: Participant) => void;
    onParticipantLeft?: (participantId: string) => void;
    onExistingParticipants?: (participants: Participant[]) => void;
}

export const useSocket = (options: UseSocketOptions) => {
    const {
        sessionId,
        userName,
        isTeacher,
        onParticipantJoined,
        onParticipantLeft,
        onExistingParticipants,
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);

    useEffect(() => {
        const socket = getSocket();
        socketRef.current = socket;

        const handleConnect = () => {
            console.log('Socket connected, joining room...');
            setIsConnected(true);
            setConnectionError(null);

            socket.emit('join-room', {
                sessionId,
                userName,
                isTeacher,
            });
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        };

        const handleConnectError = (error: Error) => {
            console.error('Connection error:', error);
            setConnectionError(error.message);
        };

        const handleUserJoined = (data: { id: string; userName: string; isTeacher: boolean }) => {
            console.log('User joined:', data);
            if (onParticipantJoined) {
                onParticipantJoined({
                    id: data.id,
                    userName: data.userName,
                    isTeacher: data.isTeacher,
                    sessionId,
                    isMuted: false,
                    isCameraOff: false,
                    isHandRaised: false,
                });
            }
        };

        const handleUserLeft = (data: { id: string }) => {
            console.log('User left:', data.id);
            if (onParticipantLeft) {
                onParticipantLeft(data.id);
            }
        };

        const handleExistingParticipants = (participants: Participant[]) => {
            console.log('Existing participants:', participants);
            if (onExistingParticipants) {
                onExistingParticipants(participants);
            }
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);
        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('existing-participants', handleExistingParticipants);

        // If already connected, join the room
        if (socket.connected) {
            handleConnect();
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('connect_error', handleConnectError);
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('existing-participants', handleExistingParticipants);
        };
    }, [sessionId, userName, isTeacher, onParticipantJoined, onParticipantLeft, onExistingParticipants]);

    const emit = useCallback(<K extends keyof ClientToServerEvents>(
        event: K,
        data: Parameters<ClientToServerEvents[K]>[0]
    ) => {
        if (socketRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            socketRef.current.emit(event, data as any);
        }
    }, []);

    const on = useCallback(<K extends keyof ServerToClientEvents>(
        event: K,
        handler: ServerToClientEvents[K]
    ) => {
        if (socketRef.current) {
            socketRef.current.on(event, handler as never);
        }
    }, []);

    const off = useCallback(<K extends keyof ServerToClientEvents>(
        event: K,
        handler?: ServerToClientEvents[K]
    ) => {
        if (socketRef.current) {
            if (handler) {
                socketRef.current.off(event, handler as never);
            } else {
                socketRef.current.off(event);
            }
        }
    }, []);

    return {
        socket: socketRef.current,
        isConnected,
        connectionError,
        emit,
        on,
        off,
    };
};
