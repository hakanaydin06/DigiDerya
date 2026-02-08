'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

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
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Hero icon */}
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

                        {/* Title */}
                        <h1 className="text-4xl md:text-6xl font-bold mb-6">
                            <span className="gradient-text">DeryaHoca</span>{' '}
                            <span className="text-white">Canlı Ders</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
                            Fen Bilgisi öğrenmek hiç bu kadar eğlenceli olmamıştı!
                            Derya Hoca ile interaktif canlı dersler için sanal sınıfımıza hoş geldiniz.
                        </p>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="p-6 bg-dark-300/50 rounded-2xl backdrop-blur-sm border border-white/5"
                            >
                                <div className="text-4xl mb-4">🔗</div>
                                <h3 className="text-lg font-semibold text-white mb-2">Tek Tıkla Katıl</h3>
                                <p className="text-gray-400 text-sm">
                                    Hesap açmana gerek yok! Linke tıkla ve anında derse katıl.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="p-6 bg-dark-300/50 rounded-2xl backdrop-blur-sm border border-white/5"
                            >
                                <div className="text-4xl mb-4">📖</div>
                                <h3 className="text-lg font-semibold text-white mb-2">Akıllı Tahta</h3>
                                <p className="text-gray-400 text-sm">
                                    Öğretmenin ders materyallerini gerçek zamanlı olarak görüntüle.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="p-6 bg-dark-300/50 rounded-2xl backdrop-blur-sm border border-white/5"
                            >
                                <div className="text-4xl mb-4">✋</div>
                                <h3 className="text-lg font-semibold text-white mb-2">İnteraktif</h3>
                                <p className="text-gray-400 text-sm">
                                    El kaldır, soru sor ve derslere aktif olarak katıl!
                                </p>
                            </motion.div>
                        </div>

                        {/* Info box */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="p-6 bg-primary-500/10 rounded-2xl border border-primary-500/20 max-w-xl mx-auto"
                        >
                            <p className="text-primary-300">
                                🎯 <strong>Öğrenci misin?</strong> Öğretmeninden aldığın ders linkine tıklayarak derse katılabilirsin!
                            </p>
                        </motion.div>
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
