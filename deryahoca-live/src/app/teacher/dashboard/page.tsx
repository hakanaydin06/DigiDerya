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
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1 flex flex-col gap-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                                    <span className="text-white font-semibold">Aktif Ders</span>
                                                </div>
                                                <p className="text-gray-400 text-sm mb-3">
                                                    Oluşturulma: {new Date(session.createdAt).toLocaleString('tr-TR')}
                                                </p>
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
                                                </div>
                                                <p className="text-[10px] text-gray-500 pl-1">
                                                    ℹ️ Test için linki farklı tarayıcıda veya <strong>Gizli Sekme</strong>&apos;de açın.
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    localStorage.setItem('isTeacher', 'true');
                                                    localStorage.setItem('teacherName', teacherName);
                                                    window.open(`/live/${session.id}`, '_blank');
                                                }}
                                                className="px-6 py-2.5 bg-brand-primary rounded-xl font-medium shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap self-start mt-8"
                                            >
                                                🚀 Derse Katıl
                                            </button>
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
                <div className="mt-12">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="text-2xl">👩‍🏫</span> Derya Hoca Profili
                    </h2>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* About Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-dark-300/50 rounded-2xl p-8 border border-white/5 hover:border-brand-primary/30 transition-all flex flex-col h-full"
                        >
                            <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-3 flex items-center gap-2">
                                📝 Açıklama
                            </h3>
                            <div className="text-gray-300 text-sm leading-relaxed space-y-4 flex-1">
                                <p>
                                    <strong>Derya Hoca Kanalıma Hoş Geldiniz!</strong>
                                </p>
                                <p>
                                    10 yılı aşkın tecrübemle, ortaokul 5, 6, 7 ve 8. sınıf öğrencileri için Fen Bilgisi ve Matematik derslerini daha anlaşılır ve eğlenceli hale getiriyorum. İleri teknolojileri derslerimde aktif bir şekilde kullanıyor, lightboard teknolojisiyle öğrencilere etkili ve yenilikçi bir öğrenme deneyimi sunuyorum.
                                </p>
                                <p>
                                    Kanalımda bilim ve matematiğin temel kavramlarını kolayca anlayabileceğiniz içerikler bulabilir, derslerde kullanılan bu öncü teknolojileri yakından tanıyabilirsiniz. Hem online hem de yüz yüze özel derslerle, öğrencilerin ihtiyaçlarına özel çözümler üretiyorum.
                                </p>
                                <p>
                                    Amacım, öğrencilerimin sadece sınavlara değil, <strong>hayat boyu kullanabilecekleri bilgi ve becerilere</strong> sahip olmalarını sağlamak. Dersleri anlatırken eğlenceli olmanın önemini bilerek, her öğrencinin derslerde keyif almasını ve motivasyonunu yüksek tutmasını hedefliyorum.
                                </p>
                            </div>
                        </motion.div>

                        {/* Social Links Section */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-dark-300/50 rounded-2xl p-8 border border-white/5 hover:border-brand-accent/30 transition-all flex flex-col h-full"
                        >
                            <h3 className="text-lg font-semibold text-white mb-6 border-b border-white/10 pb-3 flex items-center gap-2">
                                🔗 Bağlantılar
                            </h3>

                            <div className="grid grid-cols-1 gap-4 flex-1">
                                {[
                                    { icon: '📸', name: 'Instagram', label: 'instagram.com/deryahocan', url: 'https://instagram.com/deryahocan', color: 'from-pink-500 to-purple-500' },
                                    { icon: '🌐', name: 'Web Site', label: 'deryahoca.com', url: 'https://deryahoca.com', color: 'from-blue-500 to-cyan-500' },
                                    { icon: '🎵', name: 'TikTok', label: 'tiktok.com/@deryahocan', url: 'https://tiktok.com/@deryahocan', color: 'from-gray-700 to-black' },
                                    { icon: '📌', name: 'Pinterest', label: 'tr.pinterest.com/deryahocan', url: 'https://tr.pinterest.com/deryahocan', color: 'from-red-500 to-red-600' },
                                    { icon: '📘', name: 'FaceBook', label: 'facebook.com/deryahocan', url: 'https://facebook.com/deryahocan', color: 'from-blue-600 to-blue-700' },
                                    { icon: '𝕏', name: 'X', label: 'x.com/DeryaHocan', url: 'https://x.com/DeryaHocan', color: 'from-gray-800 to-black' },
                                    { icon: '🎧', name: 'Spotify', label: 'Derya Hoca Podcast', url: 'https://open.spotify.com/show/10SkPih3GigX3Lqi6ZQkMu?si=c04f899b4f0b4c8a', color: 'from-green-500 to-emerald-600' },
                                ].map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${link.color} shadow-lg group-hover:scale-110 transition-transform`}>
                                            {link.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-sm group-hover:text-brand-primary transition-colors">{link.name}</h4>
                                            <p className="text-brand-primary/80 group-hover:text-brand-primary text-xs">{link.label}</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </main>
        </div>
    );
}
