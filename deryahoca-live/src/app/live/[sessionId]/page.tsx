'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lobby, Room } from '@/components/Room';

type RoomState = 'loading' | 'lobby' | 'room' | 'error' | 'ended';

export default function LiveSessionPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.sessionId as string;

    const [roomState, setRoomState] = useState<RoomState>('loading');
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState('');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isTeacher, setIsTeacher] = useState(false);

    // Check session and determine role
    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch(`/api/sessions/${sessionId}`);
                const data = await res.json();

                if (!data.success) {
                    setError('Bu ders oturumu bulunamadı veya süresi dolmuş.');
                    setRoomState('error');
                    return;
                }

                // Check if user is teacher
                const teacherToken = localStorage.getItem('teacherToken');
                const isTeacherSession = localStorage.getItem('isTeacher') === 'true';

                if (teacherToken && isTeacherSession) {
                    setIsTeacher(true);
                    setUserName(localStorage.getItem('teacherName') || 'Öğretmen');
                }

                setRoomState('lobby');
            } catch (err) {
                console.error('Session check error:', err);
                setError('Bağlantı hatası. Lütfen tekrar deneyin.');
                setRoomState('error');
            }
        };

        if (sessionId) {
            checkSession();
        }
    }, [sessionId]);

    // Handle join from Lobby
    const handleJoin = (name: string, stream: MediaStream | null) => {
        setUserName(name);
        setLocalStream(stream);
        setRoomState('room');
    };

    const handleLeaveRoom = () => {
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }
        setRoomState('ended');
    };

    // Loading state
    if (roomState === 'loading') {
        return (
            <div className="min-h-screen science-lab-bg science-lab-gradient flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-muted">Ders oturumu kontrol ediliyor...</p>
                </motion.div>
            </div>
        );
    }

    // Error state
    if (roomState === 'error') {
        return (
            <div className="min-h-screen science-lab-bg science-lab-gradient flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="text-6xl mb-6">😕</div>
                    <h1 className="text-2xl font-bold text-text-main mb-4 heading-display">Bir Sorun Oluştu</h1>
                    <p className="text-text-muted mb-8">{error}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-brand-primary text-white rounded-xl hover:shadow-glow transition-all"
                    >
                        Ana Sayfaya Dön
                    </button>
                </motion.div>
            </div>
        );
    }

    // Session ended state
    if (roomState === 'ended') {
        return (
            <div className="min-h-screen science-lab-bg science-lab-gradient flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="text-6xl mb-6">👋</div>
                    <h1 className="text-2xl font-bold text-text-main mb-4 heading-display">Dersten Ayrıldınız</h1>
                    <p className="text-text-muted mb-8">
                        Bu derse katıldığınız için teşekkürler!
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => setRoomState('lobby')}
                            className="w-full px-6 py-3 bg-brand-primary text-white rounded-xl hover:shadow-glow transition-all"
                        >
                            Tekrar Katıl
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="w-full px-6 py-3 bg-brand-panel text-text-muted rounded-xl hover:bg-brand-panel/80 transition-colors border border-white/10"
                        >
                            Ana Sayfaya Dön
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Lobby state
    if (roomState === 'lobby') {
        return (
            <Lobby
                sessionId={sessionId}
                isTeacher={isTeacher}
                onJoin={handleJoin}
            />
        );
    }

    // Room state
    if (roomState === 'room') {
        return (
            <Room
                sessionId={sessionId}
                userName={userName}
                isTeacher={isTeacher}
                localStream={localStream}
                onLeave={handleLeaveRoom}
            />
        );
    }

    return null;
}
