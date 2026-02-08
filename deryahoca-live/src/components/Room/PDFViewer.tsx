'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

// Set worker path
if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

interface PDFViewerProps {
    pdfUrl: string | null;
    currentPage: number;
    zoom: number;
    isTeacher: boolean;
    onPageChange?: (page: number) => void;
    onZoomChange?: (zoom: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
    pdfUrl,
    currentPage,
    zoom,
    isTeacher,
    onPageChange,
    onZoomChange,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load PDF document
    useEffect(() => {
        if (!pdfUrl) return;

        const loadPdf = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const loadingTask = pdfjsLib.getDocument(pdfUrl);
                const pdf = await loadingTask.promise;
                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError('PDF yüklenemedi. Lütfen tekrar deneyin.');
            } finally {
                setIsLoading(false);
            }
        };

        loadPdf();

        return () => {
            if (pdfDoc) {
                pdfDoc.destroy();
            }
        };
    }, [pdfUrl]);

    // Use ref for render task to avoid dependency loop
    const renderTaskRef = useRef<ReturnType<PDFPageProxy['render']> | null>(null);

    // Render page
    const renderPage = useCallback(async () => {
        if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

        // Cancel any existing render task
        if (renderTaskRef.current) {
            try {
                renderTaskRef.current.cancel();
            } catch (e) {
                // Ignore cancel errors
            }
            renderTaskRef.current = null;
        }

        try {
            const page = await pdfDoc.getPage(currentPage);
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            if (!context) return;

            // Calculate scale to fit container with max limit
            const containerWidth = Math.min(containerRef.current.clientWidth - 40, 1200);
            const containerHeight = Math.min(containerRef.current.clientHeight - 40, 900);
            const viewport = page.getViewport({ scale: 1 });

            const scaleX = containerWidth / viewport.width;
            const scaleY = containerHeight / viewport.height;
            const baseScale = Math.min(scaleX, scaleY, 2); // Max 2x scale
            const scale = baseScale * (zoom / 100);

            const scaledViewport = page.getViewport({ scale });

            // Limit canvas size to prevent memory issues
            const maxCanvasSize = 4096;
            canvas.width = Math.min(scaledViewport.width, maxCanvasSize);
            canvas.height = Math.min(scaledViewport.height, maxCanvasSize);

            const renderContext = {
                canvasContext: context,
                viewport: scaledViewport,
            };

            const task = page.render(renderContext);
            renderTaskRef.current = task;
            await task.promise;
        } catch (err) {
            if ((err as Error).name !== 'RenderingCancelledException') {
                console.error('Error rendering page:', err);
            }
        }
    }, [pdfDoc, currentPage, zoom]);

    useEffect(() => {
        renderPage();
    }, [renderPage]);

    // Handle page navigation (teacher only)
    const goToPage = (page: number) => {
        if (!isTeacher) return;
        const newPage = Math.max(1, Math.min(page, totalPages));
        onPageChange?.(newPage);
    };

    const handleZoom = (newZoom: number) => {
        if (!isTeacher) return;
        const clampedZoom = Math.max(50, Math.min(200, newZoom));
        onZoomChange?.(clampedZoom);
    };

    return (
        <div className="h-full flex flex-col bg-dark-300 rounded-2xl overflow-hidden">
            {/* Control bar (teacher only) */}
            {isTeacher && pdfDoc && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between px-4 py-3 bg-dark-200 border-b border-white/10"
                >
                    {/* Page controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className="p-2 rounded-lg bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <span className="text-white font-medium min-w-20 text-center">
                            {currentPage} / {totalPages}
                        </span>

                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className="p-2 rounded-lg bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                    {/* Zoom controls */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleZoom(zoom - 10)}
                            disabled={zoom <= 50}
                            className="p-2 rounded-lg bg-secondary-500/20 text-secondary-300 hover:bg-secondary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>

                        <span className="text-white font-medium min-w-16 text-center">
                            %{zoom}
                        </span>

                        <button
                            onClick={() => handleZoom(zoom + 10)}
                            disabled={zoom >= 200}
                            className="p-2 rounded-lg bg-secondary-500/20 text-secondary-300 hover:bg-secondary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            )}

            {/* PDF Canvas */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto flex items-center justify-center p-5 bg-dark-400"
            >
                {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400">PDF yükleniyor...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="text-5xl">📄</div>
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : !pdfUrl ? (
                    <div className="flex flex-col items-center gap-4 text-center max-w-md">
                        <div className="text-6xl">📚</div>
                        <h3 className="text-xl font-semibold text-white">Akıllı Tahta</h3>
                        <p className="text-gray-400">
                            {isTeacher
                                ? 'Bir PDF seçin ve öğrencilerinizle paylaşın'
                                : 'Öğretmen henüz bir ders materyali seçmedi'}
                        </p>
                    </div>
                ) : (
                    <motion.canvas
                        ref={canvasRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="shadow-2xl rounded-lg"
                    />
                )}
            </div>

            {/* Student info bar */}
            {!isTeacher && pdfDoc && (
                <div className="px-4 py-2 bg-dark-200 border-t border-white/10 text-center">
                    <span className="text-gray-400 text-sm">
                        Sayfa {currentPage} / {totalPages} • Öğretmen kontrolünde
                    </span>
                </div>
            )}
        </div>
    );
};
