import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

export const ClassTimer: React.FC = () => {
    const [timerDuration, setTimerDuration] = useState(40); // minutes
    const [timerSeconds, setTimerSeconds] = useState(0);
    const [timerRunning, setTimerRunning] = useState(false);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Timer Logic
    useEffect(() => {
        if (timerRunning && timerSeconds > 0) {
            timerIntervalRef.current = setInterval(() => {
                setTimerSeconds((prev) => prev - 1);
            }, 1000);
        } else if (timerSeconds === 0) {
            setTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [timerRunning, timerSeconds]);

    const startTimer = () => {
        if (timerSeconds === 0) setTimerSeconds(timerDuration * 60);
        setTimerRunning(true);
    };

    const stopTimer = () => setTimerRunning(false);

    const resetTimer = () => {
        setTimerRunning(false);
        setTimerSeconds(timerDuration * 60);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-panel/50 rounded-full border border-white/5 shadow-inner">
            {!timerRunning && timerSeconds === 0 ? (
                <>
                    <span className="text-brand-accent pr-1">⏱</span>
                    <select
                        value={timerDuration}
                        onChange={(e) => setTimerDuration(Number(e.target.value))}
                        className="bg-brand-dark/50 text-white text-xs rounded px-2 py-1 border border-white/10 focus:outline-none focus:border-brand-accent cursor-pointer hover:bg-brand-dark/80 transition-colors"
                    >
                        <option value={30}>30 dk</option>
                        <option value={40}>40 dk</option>
                        <option value={50}>50 dk</option>
                        <option value={60}>60 dk</option>
                    </select>
                    <button
                        onClick={startTimer}
                        className="px-2 py-0.5 bg-brand-accent/20 text-brand-accent text-xs rounded hover:bg-brand-accent/30 transition-colors border border-brand-accent/20"
                    >
                        Başlat
                    </button>
                </>
            ) : (
                <>
                    <span className={`text-sm font-mono font-bold ${timerSeconds < 300 ? 'text-red-400 animate-pulse' : 'text-brand-accent'}`}>
                        {formatTime(timerSeconds)}
                    </span>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <button
                        onClick={timerRunning ? stopTimer : startTimer}
                        className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${timerRunning
                            ? 'text-yellow-400 hover:bg-yellow-400/10'
                            : 'text-green-400 hover:bg-green-400/10'
                            }`}
                        title={timerRunning ? 'Duraklat' : 'Devam Et'}
                    >
                        {timerRunning ? '⏸' : '▶'}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="w-6 h-6 flex items-center justify-center rounded text-red-400 hover:bg-red-400/10 transition-colors"
                        title="Sıfırla"
                    >
                        ⏹
                    </button>
                </>
            )}
        </div>
    );
};
