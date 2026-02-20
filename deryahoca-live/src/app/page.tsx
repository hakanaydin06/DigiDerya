'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const SOCIAL_LINKS = [
    { icon: '📸', name: 'Instagram', label: 'instagram.com/deryahocan', url: 'https://instagram.com/deryahocan', color: 'from-pink-500 to-purple-600' },
    { icon: '🌐', name: 'Web Site', label: 'deryahoca.com', url: 'https://deryahoca.com', color: 'from-blue-500 to-cyan-500' },
    { icon: '🎵', name: 'TikTok', label: 'tiktok.com/@deryahocan', url: 'https://tiktok.com/@deryahocan', color: 'from-gray-600 to-gray-900' },
    { icon: '📌', name: 'Pinterest', label: 'tr.pinterest.com/deryahocan', url: 'https://tr.pinterest.com/deryahocan', color: 'from-red-500 to-red-700' },
    { icon: '📘', name: 'FaceBook', label: 'facebook.com/deryahocan', url: 'https://facebook.com/deryahocan', color: 'from-blue-600 to-blue-800' },
    { icon: '𝕏', name: 'X (Twitter)', label: 'x.com/DeryaHocan', url: 'https://x.com/DeryaHocan', color: 'from-gray-700 to-black' },
    { icon: '🎧', name: 'Spotify', label: 'Derya Hoca Podcast', url: 'https://open.spotify.com/show/10SkPih3GigX3Lqi6ZQkMu?si=c04f899b4f0b4c8a', color: 'from-green-500 to-emerald-700' },
];

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-400 via-dark-300 to-primary-900/30 flex flex-col">
            {/* Header */}
            <header className="p-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow">
                            <span className="text-2xl">🎓</span>
                        </div>
                        <span className="text-xl font-bold text-white">DeryaHoca</span>
                    </div>

                    <Link
                        href="/teacher/login"
                        className="px-6 py-2 bg-primary-500/20 text-primary-300 rounded-full hover:bg-primary-500/30 transition-colors"
                    >
                        Öğretmen Girişi
                    </Link>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 px-4 pb-12">
                <div className="max-w-5xl mx-auto">
                    {/* Hero */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center py-12"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="inline-block mb-8"
                        >
                            <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl flex items-center justify-center shadow-2xl animate-float">
                                <span className="text-5xl">📚</span>
                            </div>
                        </motion.div>

                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            <span className="gradient-text">DeryaHoca</span>{' '}
                            <span className="text-white">Canlı Ders</span>
                        </h1>

                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                            Fen Bilgisi öğrenmek hiç bu kadar eğlenceli olmamıştı!
                            Derya Hoca ile interaktif canlı dersler için sanal sınıfımıza hoş geldiniz.
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {[
                                { icon: '🔗', title: 'Tek Tıkla Katıl', desc: 'Hesap açmana gerek yok! Linke tıkla ve anında derse katıl.' },
                                { icon: '📖', title: 'Akıllı Tahta', desc: 'Öğretmenin ders materyallerini gerçek zamanlı olarak görüntüle.' },
                                { icon: '✋', title: 'İnteraktif', desc: 'El kaldır, soru sor ve derslere aktif olarak katıl!' },
                            ].map((f, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="p-6 bg-dark-300/50 rounded-2xl backdrop-blur-sm border border-white/5 hover:border-primary-500/30 transition-all"
                                >
                                    <div className="text-4xl mb-4">{f.icon}</div>
                                    <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                                    <p className="text-gray-400 text-sm">{f.desc}</p>
                                </motion.div>
                            ))}
                        </div>

                        {/* Info box */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="p-6 bg-primary-500/10 rounded-2xl border border-primary-500/20 max-w-xl mx-auto mb-16"
                        >
                            <p className="text-primary-300">
                                🎯 <strong>Öğrenci misin?</strong> Öğretmeninden aldığın ders linkine tıklayarak derse katılabilirsin!
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Teacher Profile Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                            <span className="text-3xl">👩‍🏫</span> Derya Hoca Hakkında
                        </h2>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* About */}
                            <div className="bg-dark-300/50 rounded-2xl p-7 border border-white/5 hover:border-primary-500/20 transition-all">
                                <h3 className="text-base font-semibold text-white mb-4 pb-3 border-b border-white/10 flex items-center gap-2">
                                    📝 Açıklama
                                </h3>
                                <div className="text-gray-300 text-sm leading-relaxed space-y-3">
                                    <p><strong>Derya Hoca Kanalıma Hoş Geldiniz!</strong></p>
                                    <p>
                                        10 yılı aşkın tecrübemle, ortaokul 5–8. sınıf öğrencileri için Fen Bilgisi ve Matematik derslerini daha anlaşılır ve eğlenceli hale getiriyorum. Lightboard teknolojisiyle yenilikçi bir öğrenme deneyimi sunuyorum.
                                    </p>
                                    <p>
                                        Hem online hem de yüz yüze özel derslerle, öğrencilerin ihtiyaçlarına özel çözümler üretiyorum. Amacım; öğrencilerimin <strong>hayat boyu kullanabilecekleri bilgi ve becerilere</strong> sahip olmalarını sağlamak.
                                    </p>
                                </div>
                            </div>

                            {/* Social Links */}
                            <div className="bg-dark-300/50 rounded-2xl p-7 border border-white/5 hover:border-secondary-500/20 transition-all">
                                <h3 className="text-base font-semibold text-white mb-5 pb-3 border-b border-white/10 flex items-center gap-2">
                                    🔗 Bağlantılar
                                </h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {SOCIAL_LINKS.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                                        >
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg bg-gradient-to-br ${link.color} shadow-md group-hover:scale-110 transition-transform flex-shrink-0`}>
                                                {link.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-white font-medium text-sm group-hover:text-primary-300 transition-colors">{link.name}</h4>
                                                <p className="text-primary-400/80 group-hover:text-primary-300 text-xs truncate">{link.label}</p>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="p-6 text-center text-gray-500 text-sm">
                <p>© 2024 DeryaHoca. Tüm hakları saklıdır.</p>
            </footer>
        </div>
    );
}
