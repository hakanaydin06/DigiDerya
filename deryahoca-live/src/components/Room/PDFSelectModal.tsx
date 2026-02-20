import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PDFSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string) => void;
}

interface PDFFile {
    name: string;
    url: string;
}

export const PDFSelectModal: React.FC<PDFSelectModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [files, setFiles] = useState<PDFFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch existing PDFs
    const fetchPDFs = async () => {
        setIsLoading(true);
        try {
            // In a real app we would have an API to list files
            // For now we might just support uploading new ones or have a static list if any
            // Let's implement a list endpoint later if needed, for now we rely on uploads returning the URL
            // Or we can simulate some default files
            setFiles([
                { name: 'Örnek Ders Notu 1.pdf', url: '/sample1.pdf' },
                { name: 'Matematik Konu Anlatımı.pdf', url: '/sample2.pdf' },
            ]);
        } catch (err) {
            console.error('Error fetching PDFs:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchPDFs();
        }
    }, [isOpen]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setError('Lütfen geçerli bir PDF dosyası seçin.');
            return;
        }

        setIsUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('teacherToken');
            const res = await fetch('/api/pdfs/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                // Add to list and auto-select
                const newFile = { name: data.data.name, url: data.data.url };
                setFiles(prev => [newFile, ...prev]);
                onSelect(newFile.url);
                onClose();
            } else {
                setError(data.error || 'Dosya yüklenirken bir hata oluştu');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Dosya yüklenirken bir hata oluştu');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-dark-200 rounded-2xl shadow-2xl border border-white/10 z-50 overflow-hidden"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                                <span className="text-2xl">📄</span>
                                PDF Seç veya Yükle
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Upload Area */}
                            <div className="mb-8">
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={handleFileSelect}
                                    ref={fileInputRef}
                                    className="hidden"
                                    id="pdf-upload"
                                />
                                <label
                                    htmlFor="pdf-upload"
                                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${isUploading
                                        ? 'border-primary-500/50 bg-primary-500/10'
                                        : 'border-white/10 hover:border-primary-500/50 hover:bg-white/5'
                                        }`}
                                >
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                                            <p className="text-primary-300 font-medium">Yükleniyor...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-gray-400 hover:text-white transition-colors">
                                            <svg className="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                            <p className="font-medium">Yeni PDF Yüklemek İçin Tıklayın</p>
                                            <p className="text-xs opacity-50">veya dosyayı buraya sürükleyin</p>
                                        </div>
                                    )}
                                </label>
                                {error && (
                                    <p className="text-red-400 text-sm mt-2 text-center bg-red-400/10 p-2 rounded-lg">
                                        {error}
                                    </p>
                                )}
                            </div>

                            {/* Recent Files List */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                    Son Kullanılanlar
                                </h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {files.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4 italic">
                                            Henüz dosya yok. Yukarıdan yeni bir PDF yükleyin.
                                        </p>
                                    ) : (
                                        files.map((file, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    onSelect(file.url);
                                                    onClose();
                                                }}
                                                className="w-full flex items-center lg:gap-3 p-3 rounded-xl bg-dark-300/50 hover:bg-dark-300 border border-white/5 hover:border-primary-500/30 transition-all group text-left"
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-medium truncate group-hover:text-primary-300 transition-colors">
                                                        {file.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {file.url}
                                                    </p>
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-primary-500 rounded-lg text-white">
                                                    Seç
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
