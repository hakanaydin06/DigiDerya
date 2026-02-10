import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
    id: string;
    userId: string;
    userName: string;
    isTeacher: boolean;
    text: string;
    timestamp: string;
}

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onClearChat: () => void;
    currentUserId: string;
    isTeacher: boolean;
    isOpen: boolean;
    onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    messages,
    onSendMessage,
    onClearChat,
    currentUserId,
    isTeacher,
    isOpen,
    onClose,
}) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage.trim());
            setNewMessage('');
        }
    };

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%', opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute right-0 top-16 bottom-0 w-80 md:w-96 bg-brand-dark/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-white/10 bg-brand-panel/50">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💬</span>
                            <h3 className="text-text-main font-semibold">Sohbet</h3>
                            <span className="px-2 py-0.5 bg-brand-primary/20 text-brand-primary text-xs rounded-full border border-brand-primary/30">
                                {messages.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {isTeacher && (
                                <button
                                    onClick={() => {
                                        if (window.confirm('Tüm sohbet geçmişini silmek istediğinize emin misiniz?')) {
                                            onClearChat();
                                        }
                                    }}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Sohbeti Temizle"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-text-muted hover:text-text-main hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                                <span className="text-4xl mb-2">👋</span>
                                <p className="text-sm">Henüz mesaj yok</p>
                                <p className="text-xs">İlk mesajı siz gönderin!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.userId === currentUserId;
                                // If it's the teacher (and not me), highlight it differently
                                const isRemoteTeacher = msg.isTeacher && !isMe;

                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                    >
                                        <div className="flex items-center gap-2 mb-1 px-1">
                                            {isRemoteTeacher && (
                                                <span className="text-xs font-bold text-brand-accent">Öğretmen</span>
                                            )}
                                            {!isRemoteTeacher && !isMe && (
                                                <span className="text-xs text-text-muted">{msg.userName}</span>
                                            )}
                                            <span className="text-[10px] text-text-muted opacity-70">
                                                {formatTime(msg.timestamp)}
                                            </span>
                                        </div>
                                        <div
                                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed relative group ${isMe
                                                    ? 'bg-brand-primary text-white rounded-tr-none'
                                                    : isRemoteTeacher
                                                        ? 'bg-brand-accent/20 text-brand-accent border border-brand-accent/30 rounded-tl-none'
                                                        : 'bg-brand-panel border border-white/10 text-text-main rounded-tl-none'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-brand-panel/30">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Bir mesaj yazın..."
                                className="w-full bg-brand-dark border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-brand-primary/50 focus:ring-1 focus:ring-brand-primary/50 transition-all"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="absolute right-2 p-1.5 bg-brand-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-primary/80 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
