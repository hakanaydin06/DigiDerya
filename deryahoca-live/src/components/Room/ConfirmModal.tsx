import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Evet',
    cancelText = 'İptal',
    isDestructive = false,
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-sm glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl"
                    >
                        <div className="flex flex-col items-center text-center gap-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border ${isDestructive
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                    : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
                                }`}>
                                {isDestructive ? '⚠️' : 'ℹ️'}
                            </div>

                            {/* Content */}
                            <div>
                                <h3 className="text-xl font-bold text-text-main mb-2">
                                    {title}
                                </h3>
                                <p className="text-text-muted text-sm leading-relaxed">
                                    {description}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 w-full mt-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-text-main rounded-xl transition-colors font-medium border border-white/5"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 py-2.5 rounded-xl transition-colors font-bold shadow-lg ${isDestructive
                                            ? 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-red-500/20'
                                            : 'bg-brand-accent hover:bg-brand-accent/90 text-white shadow-brand-accent/20'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
