'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { copyToClipboard } from '@/lib/utils/sessionUtils';

interface Session {
    id: string;
    sessionUrl: string;
    createdAt: string;
}

export default function TeacherDashboardPage() {
    const router = useRouter();
    const [teacherName, setTeacherName] = useState('Öğretmen');
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // Check authentication
    useEffect(() => {
        const storedToken = localStorage.getItem('teacherToken');
        const storedName = localStorage.getItem('teacherName');

        if (!storedToken) {
            router.push('/teacher/login');
            return;
        }

        setToken(storedToken);
        if (storedName) setTeacherName(storedName);
    }, [router]);

    const handleCreateSession = async () => {
        if (!token) return;

        setIsCreatingSession(true);

        try {
            const res = await fetch('/api/sessions/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await res.json();

            if (data.success) {
                const newSession: Session = {
                    id: data.data.sessionId,
                    sessionUrl: data.data.sessionUrl,
                    createdAt: new Date().toISOString(),
                };
                setSessions(prev => [newSession, ...prev]);
            }
        } catch (err) {
            console.error('Session creation error:', err);
        } finally {
            setIsCreatingSession(false);
        }
    };

    const handleCopyLink = async (session: Session) => {
        const success = await copyToClipboard(session.sessionUrl);
        if (success) {
            setCopiedSessionId(session.id);
            setTimeout(() => setCopiedSessionId(null), 2000);
        }
    };

    const handleJoinAsTeacher = (session: Session) => {
        // Store teacher info for the session
        localStorage.setItem('isTeacher', 'true');
        router.push(`/live/${session.id}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('teacherToken');
        localStorage.removeItem('teacherName');
        router.push('/teacher/login');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-400 via-dark-300 to-primary-900/30">
            {/* Header */}
            <header className="p-6 border-b border-white/10">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-glow">
                                <span className="text-xl">🎓</span>
                            </div>
                            <span className="text-lg font-bold text-white">DeryaHoca</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-gray-400">
                            Merhaba, <strong className="text-white">{teacherName}</strong>
                        </span>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-6xl mx-auto p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Öğretmen Paneli
                        </h1>
                        <p className="text-gray-400">
                            Canlı derslerinizi buradan yönetin
                        </p>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateSession}
                        disabled={isCreatingSession}
                        className="px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isCreatingSession ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Oluşturuluyor...
                            </>
                        ) : (
                            <>
                                <span className="text-xl">➕</span>
                                Yeni Ders Başlat
                            </>
                        )}
                    </motion.button>
                </div>

                {/* Sessions list */}
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-white">Ders Oturumları</h2>

                    {sessions.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-dark-300/50 rounded-2xl p-12 text-center border border-white/5"
                        >
                            <div className="text-6xl mb-4">📹</div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                Henüz ders oturumu yok
                            </h3>
                            <p className="text-gray-400 mb-6">
                                Yeni bir ders başlatarak öğrencilerinizi davet edin
                            </p>
                            <button
                                onClick={handleCreateSession}
                                className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                            >
                                İlk Dersi Başlat
                            </button>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            <div className="grid gap-4">
                                {sessions.map((session) => (
                                    <motion.div
                                        key={session.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        layout
                                        className="bg-dark-300/50 rounded-2xl p-6 border border-white/5 hover:border-primary-500/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-white font-semibold">Aktif Ders</span>
                                                    <span className="text-gray-500 text-xs ml-1">
                                                        {new Date(session.createdAt).toLocaleString('tr-TR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={session.sessionUrl}
                                                        readOnly
                                                        className="flex-1 p-2 bg-dark-400 text-gray-300 text-sm rounded-lg border border-white/10"
                                                    />
                                                    <button
                                                        onClick={() => handleCopyLink(session)}
                                                        className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${copiedSessionId === session.id
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-primary-500/20 text-primary-300 hover:bg-primary-500/30'
                                                            }`}
                                                    >
                                                        {copiedSessionId === session.id ? '✓ Kopyalandı' : 'Kopyala'}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            localStorage.setItem('isTeacher', 'true');
                                                            localStorage.setItem('teacherName', teacherName);
                                                            window.open(`/live/${session.id}`, '_blank');
                                                        }}
                                                        className="px-6 py-2 bg-brand-primary rounded-xl font-medium shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap"
                                                    >
                                                        🚀 Derse Katıl
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-gray-500 pl-1">
                                                    ℹ️ Test için linki farklı tarayıcıda veya <strong>Gizli Sekme</strong>&apos;de açın.
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-brand-accent/80 mt-3 flex items-center gap-1.5 bg-brand-accent/10 p-2 rounded-lg border border-brand-accent/20">
                                            <span className="text-lg">💡</span>
                                            <span>Öğrencileri kabul etmek ve dersi yönetmek için <strong>"Derse Katıl"</strong> butonuna basarak sınıfa giriniz.</span>
                                        </p>
                                    </motion.div>
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Teacher Profile Section */}
                <div className="mt-10">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <span className="text-xl">👩‍‍🏫</span> Derya Hoca Profili
                    </h2>

                    {/* Social icons — compact icon-only row */}
                    <div className="flex items-center gap-2 flex-wrap mb-4">
                        {[
                            { icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>, name: 'Instagram', url: 'https://instagram.com/deryahocan', bg: 'from-pink-500 to-purple-600' },
                            { icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>, name: 'Web Site', url: 'https://deryahoca.com', bg: 'from-blue-500 to-cyan-500' },
                            { icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.35 6.35 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.27 8.27 0 0 0 4.84 1.55V6.79a4.85 4.85 0 0 1-1.07-.1z" /></svg>, name: 'TikTok', url: 'https://tiktok.com/@deryahocan', bg: 'from-gray-700 to-gray-900' },
                            { icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" /></svg>, name: 'Pinterest', url: 'https://tr.pinterest.com/deryahocan', bg: 'from-red-500 to-red-700' },
                            { icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>, name: 'Facebook', url: 'https://facebook.com/deryahocan', bg: 'from-blue-600 to-blue-800' },
                            { icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>, name: 'X', url: 'https://x.com/DeryaHocan', bg: 'from-gray-800 to-black' },
                            { icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>, name: 'Spotify', url: 'https://open.spotify.com/show/10SkPih3GigX3Lqi6ZQkMu', bg: 'from-green-500 to-emerald-700' },
                        ].map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={link.name}
                                className={`group relative w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${link.bg} text-white shadow hover:scale-110 hover:shadow-lg transition-all`}
                            >
                                {link.icon}
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                    {link.name}
                                </span>
                            </a>
                        ))}
                    </div>

                    {/* Full-width bio */}
                    <div className="bg-dark-300/50 rounded-2xl p-5 border border-white/5">
                        <p className="text-gray-300 text-sm leading-relaxed">
                            10 yılı aşkın tecrübemle, ortaokul 5–8. sınıf öğrencileri için Fen Bilgisi ve Matematik derslerini daha anlaşılır ve eğlenceli hale getiriyorum.
                            Lightboard teknolojisiyle yenilikçi bir öğrenme deneyimi sunuyorum. Hem online hem de yüz yüze özel derslerle, öğrencilerin ihtiyaçlarına özel çözümler üretiyorum.
                            Amacım; öğrencilerimin <strong className="text-white">hayat boyu kullanabilecekleri bilgi ve becerilere</strong> sahip olmalarını sağlamak.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
