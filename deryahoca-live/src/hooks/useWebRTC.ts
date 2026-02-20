'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Peer, { Instance as SimplePeerInstance } from 'simple-peer';
import { getSocket } from '@/lib/socket/client';
import type { Participant } from '@/types';

interface PeerConnection {
    peerId: string;
    peer: SimplePeerInstance;
    stream: MediaStream | null;
}

interface UseWebRTCOptions {
    sessionId: string;
    localStream: MediaStream | null;
    isTeacher: boolean;
}

export const useWebRTC = (options: UseWebRTCOptions) => {
    const { sessionId, localStream, isTeacher } = options;
    const [peers, setPeers] = useState<Map<string, PeerConnection>>(new Map());
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const peersRef = useRef<Map<string, PeerConnection>>(new Map());

    const removePeer = useCallback((targetId: string) => {
        const peerConnection = peersRef.current.get(targetId);
        if (peerConnection) {
            peerConnection.peer.destroy();
            peersRef.current.delete(targetId);
            setPeers(new Map(peersRef.current));
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.delete(targetId);
                return newMap;
            });
        }
    }, []);

    const createPeer = useCallback((
        targetId: string,
        initiator: boolean,
        stream: MediaStream | null
    ): SimplePeerInstance => {
        console.log(`Creating peer for ${targetId}, initiator: ${initiator}`);

        const peer = new Peer({
            initiator,
            trickle: true,
            stream: stream || undefined,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                ],
            },
            offerOptions: {
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            },
        });

        peer.on('signal', (data) => {
            const socket = getSocket();
            if (data.type === 'offer') {
                socket.emit('signal-offer', { to: targetId, offer: data });
            } else if (data.type === 'answer') {
                socket.emit('signal-answer', { to: targetId, answer: data });
            } else if ((data as any).candidate) {
                socket.emit('signal-ice-candidate', { to: targetId, candidate: data as any });
            }
        });

        peer.on('stream', (remoteStream) => {
            console.log(`Received stream from ${targetId}`);
            setRemoteStreams(prev => new Map(prev).set(targetId, remoteStream));
        });

        peer.on('connect', () => {
            console.log(`Peer connected: ${targetId}`);
        });

        peer.on('error', (err) => {
            console.error(`Peer error for ${targetId}:`, err);
        });

        peer.on('close', () => {
            console.log(`Peer closed: ${targetId}`);
            removePeer(targetId);
        });

        return peer;
    }, [removePeer]);

    const addPeer = useCallback((targetId: string, initiator: boolean) => {
        if (peersRef.current.has(targetId)) {
            console.log(`Peer already exists for ${targetId}`);
            return;
        }

        const peer = createPeer(targetId, initiator, localStream);
        const peerConnection: PeerConnection = {
            peerId: targetId,
            peer,
            stream: null,
        };

        peersRef.current.set(targetId, peerConnection);
        setPeers(new Map(peersRef.current));
    }, [localStream, createPeer]);

    // Handle dynamic localStream updates (e.g. camera enabled after joining)
    useEffect(() => {
        if (!localStream) return;

        peersRef.current.forEach((peerConnection) => {
            const peer = peerConnection.peer as any;
            try {
                const pc: RTCPeerConnection | undefined = peer._pc;
                if (!pc) return;

                const existingSenders = pc.getSenders();
                localStream.getTracks().forEach(track => {
                    const alreadySending = existingSenders.some(s => s.track === track);
                    if (!alreadySending) {
                        pc.addTrack(track, localStream);
                    }
                });
            } catch (err) {
                console.error(`Failed to add tracks to peer ${peerConnection.peerId}:`, err);
            }
        });
    }, [localStream]);

    const handleSignal = useCallback((fromId: string, signalData: RTCSessionDescriptionInit | RTCIceCandidateInit) => {
        const peerConnection = peersRef.current.get(fromId);
        if (peerConnection) {
            try {
                peerConnection.peer.signal(signalData as any);
            } catch (err) {
                console.error('Error signaling peer:', err);
            }
        }
    }, []);

    // Set up socket listeners
    useEffect(() => {
        const socket = getSocket();

        const handleUserJoined = (data: { id: string; userName: string; isTeacher: boolean }) => {
            console.log('User joined, creating peer as initiator');
            addPeer(data.id, true);
        };

        const handleExistingParticipants = (participants: Participant[]) => {
            console.log('Existing participants, waiting for them to initiate');
            // We don't initiate - existing peers will initiate connection to us
        };

        const handleSignalOffer = (data: { from: string; offer: RTCSessionDescriptionInit }) => {
            console.log('Received offer from:', data.from);
            if (!peersRef.current.has(data.from)) {
                addPeer(data.from, false);
            }
            // Small delay to ensure peer is set up
            setTimeout(() => {
                handleSignal(data.from, data.offer);
            }, 100);
        };

        const handleSignalAnswer = (data: { from: string; answer: RTCSessionDescriptionInit }) => {
            console.log('Received answer from:', data.from);
            handleSignal(data.from, data.answer);
        };

        const handleSignalIceCandidate = (data: { from: string; candidate: RTCIceCandidateInit }) => {
            handleSignal(data.from, data.candidate);
        };

        const handleUserLeft = (data: { id: string }) => {
            console.log('User left:', data.id);
            removePeer(data.id);
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('existing-participants', handleExistingParticipants);
        socket.on('signal-offer', handleSignalOffer);
        socket.on('signal-answer', handleSignalAnswer);
        socket.on('signal-ice-candidate', handleSignalIceCandidate);
        socket.on('user-left', handleUserLeft);

        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('existing-participants', handleExistingParticipants);
            socket.off('signal-offer', handleSignalOffer);
            socket.off('signal-answer', handleSignalAnswer);
            socket.off('signal-ice-candidate', handleSignalIceCandidate);
            socket.off('user-left', handleUserLeft);
        };
    }, [addPeer, removePeer, handleSignal]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            peersRef.current.forEach((peerConnection) => {
                peerConnection.peer.destroy();
            });
            peersRef.current.clear();
        };
    }, []);

    return {
        peers,
        remoteStreams,
        addPeer,
        removePeer,
    };
};
