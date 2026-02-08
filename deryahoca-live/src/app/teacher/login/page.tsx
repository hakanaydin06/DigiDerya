'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TeacherLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (data.success) {
                // Store token
                localStorage.setItem('teacherToken', data.data.token);
                localStorage.setItem('teacherName', data.data.user.name);
                router.push('/teacher/dashboard');
            } else {
                setError(data.error || 'Giriş başarısız');
            }
        } catch (err) {
            setError('Bağlantı hatası. Lütfen tekrar deneyin.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-dark-400 via-dark-300 to-primary-900/30 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow">
                        <span className="text-3xl">🎓</span>
                    </div>
                    <span className="text-2xl font-bold text-white">DeryaHoca</span>
                </Link>

                {/* Login form */}
                <div className="bg-dark-300/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/5">
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        Öğretmen Girişi
                    </h1>
                    <p className="text-gray-400 text-center mb-8">
                        Canlı ders yönetim paneline hoş geldiniz
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">E-posta</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ogretmen@deryahoca.com"
                                className="w-full p-4 bg-dark-400 text-white rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                                required
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-gray-400 mb-2">Şifre</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full p-4 bg-dark-400 text-white rounded-xl border border-white/10 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
                                required
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit */}
                        <motion.button
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Giriş yapılıyor...
                                </span>
                            ) : (
                                'Giriş Yap'
                            )}
                        </motion.button>
                    </form>

                    {/* Demo credentials hint */}
                    <div className="mt-6 p-4 bg-primary-500/10 rounded-xl border border-primary-500/20">
                        <p className="text-xs text-primary-300">
                            <strong>Demo Bilgileri:</strong><br />
                            E-posta: ogretmen@deryahoca.com<br />
                            Şifre: DeryaHoca2024!
                        </p>
                    </div>
                </div>

                {/* Back link */}
                <p className="text-center mt-6">
                    <Link href="/" className="text-gray-400 hover:text-primary-400 transition-colors">
                        ← Ana sayfaya dön
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
