'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

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
    // Annotation props
    sessionId?: string;
    drawingEnabled?: boolean;
    currentColor?: string;
    lineWidth?: number;
    isEraser?: boolean;
    clearTrigger?: number;
    textMode?: boolean;
    selectedSymbol?: string | null;
    onSymbolPlaced?: () => void;
    // Socket props
    emit?: (event: any, data: any) => void;
    on?: (event: any, callback: (data: any) => void) => void;
    off?: (event: any, handler?: any) => void;
}

interface Point {
    x: number;
    y: number;
}

type DrawingAction =
    | { type: 'path'; points: Point[]; color: string; lineWidth: number; isEraser: boolean }
    | { type: 'text'; text: string; x: number; y: number; color: string }
    | { type: 'symbol'; symbol: string; x: number; y: number; color: string };

interface PageCanvas {
    pageNum: number;
    canvas: HTMLCanvasElement;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
    pdfUrl,
    currentPage,
    zoom,
    isTeacher,
    onPageChange,
    onZoomChange,
    // Annotation props
    sessionId,
    drawingEnabled = false,
    currentColor = '#FF0000',
    lineWidth = 3,
    isEraser = false,
    clearTrigger = 0,
    textMode = false,
    selectedSymbol = null,
    onSymbolPlaced = () => { },
    emit,
    on,
    off,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const pagesContainerRef = useRef<HTMLDivElement>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [renderedPages, setRenderedPages] = useState<PageCanvas[]>([]);
    const [localZoom, setLocalZoom] = useState(zoom);

    // Annotation canvas refs - one per page
    const annotationCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);

    // History State
    const [drawingHistory, setDrawingHistory] = useState<Record<number, DrawingAction[]>>({});
    const currentPathRef = useRef<Point[]>([]);
    const activeDrawingPageRef = useRef<number | null>(null);
    const lastScrollEmit = useRef(0);

    // Remote drawing state
    const remotePathsRef = useRef<Map<string, { points: Point[], color: string, lineWidth: number, isEraser: boolean, pageNum: number }>>(new Map());
    const lastEmitRef = useRef(0);
    const currentStrokeIdRef = useRef<string | null>(null);


    // Text Input State
    const [textInputVisible, setTextInputVisible] = useState(false);
    const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);
    const [activeTextPage, setActiveTextPage] = useState<number | null>(null);
    const [textValue, setTextValue] = useState('');
    const textInputRef = useRef<HTMLInputElement>(null);

    // Focus text input when shown
    useEffect(() => {
        if (textInputVisible && textInputRef.current) {
            textInputRef.current.focus();
        }
    }, [textInputVisible]);


    // Sync local zoom with prop
    useEffect(() => {
        setLocalZoom(zoom);
    }, [zoom]);

    // Load PDF document
    useEffect(() => {
        if (!pdfUrl) return;

        const loadPdf = async () => {
            setIsLoading(true);
            setError(null);
            setRenderedPages([]);

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

    // Render all pages when PDF loads or zoom changes
    const renderAllPages = useCallback(async () => {
        if (!pdfDoc || !containerRef.current) return;

        const pages: PageCanvas[] = [];
        const scale = localZoom / 100;

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) continue;

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport,
                }).promise;

                pages.push({ pageNum, canvas });
            } catch (err) {
                console.error(`Error rendering page ${pageNum}:`, err);
            }
        }

        setRenderedPages(pages);
    }, [pdfDoc, localZoom]);

    useEffect(() => {
        renderAllPages();
    }, [renderAllPages]);

    // Handle wheel zoom
    const handleWheel = useCallback((e: WheelEvent) => {
        if (!isTeacher) return;
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -10 : 10;
            const newZoom = Math.max(30, Math.min(300, localZoom + delta));
            setLocalZoom(newZoom);
            onZoomChange?.(newZoom);
        }
    }, [isTeacher, localZoom, onZoomChange]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    // Scroll to current page
    useEffect(() => {
        if (!pagesContainerRef.current) return;
        const pageElement = pagesContainerRef.current.querySelector(`[data-page="${currentPage}"]`);
        if (pageElement) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentPage]);

    // Handle page navigation (teacher only)
    const goToPage = (page: number) => {
        if (!isTeacher) return;
        const newPage = Math.max(1, Math.min(page, totalPages));
        onPageChange?.(newPage);
    };

    const handleZoomButton = (delta: number) => {
        if (!isTeacher) return;
        const newZoom = Math.max(30, Math.min(300, localZoom + delta));
        setLocalZoom(newZoom);
        onZoomChange?.(newZoom);
    };

    // Drawing helper functions for annotations
    const getDrawContext = (pageNum: number) => {
        const canvas = annotationCanvasRefs.current.get(pageNum);
        return canvas?.getContext('2d') || null;
    };

    const drawLine = (ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, width: number, eraser: boolean, w: number, h: number) => {
        ctx.beginPath();
        const fx = from.x * w;
        const fy = from.y * h;
        const tx = to.x * w;
        const ty = to.y * h;

        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);

        if (eraser) {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            ctx.lineWidth = width * 5; // Scale with zoom? Maybe later. For now fixed.
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
        }

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.closePath();
        ctx.globalCompositeOperation = 'source-over';
    };

    const drawSymbol = (ctx: CanvasRenderingContext2D, symbol: string, x: number, y: number, color: string, w: number, h: number) => {
        ctx.save();
        ctx.font = '40px sans-serif';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, x * w, y * h);
        ctx.restore();
    };

    const drawText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, w: number, h: number) => {
        ctx.save();
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.fillText(text, x * w, y * h);
        ctx.restore();
    };

    const redrawPage = useCallback((pageNum: number, ctx: CanvasRenderingContext2D) => {
        const actions = drawingHistory[pageNum] || [];
        // Clear first to avoid duplication if called multiple times? 
        // Logic: redrawPage is called on mount or update. 
        // We should clear.
        const canvas = annotationCanvasRefs.current.get(pageNum);
        if (!canvas) return; // Early return to satisfy TS
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        actions.forEach(action => {
            if (action.type === 'path') {
                if (action.points.length < 2) return;
                ctx.beginPath();
                // We use helper strictly? No, redrawPage has loop here.
                // We should refactor to use helper OR update loop logic.
                // Loop is manual here. I must update it to scale.

                const w = canvas.width;
                const h = canvas.height;

                ctx.moveTo(action.points[0].x * w, action.points[0].y * h);
                for (let i = 1; i < action.points.length; i++) {
                    ctx.lineTo(action.points[i].x * w, action.points[i].y * h);
                }

                if (action.isEraser) {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.strokeStyle = 'rgba(0,0,0,1)';
                    ctx.lineWidth = action.lineWidth * 5;
                } else {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.strokeStyle = action.color;
                    ctx.lineWidth = action.lineWidth;
                }
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.stroke();
                ctx.globalCompositeOperation = 'source-over';

            } else if (action.type === 'text') {
                drawText(ctx, action.text, action.x, action.y, action.color, canvas.width, canvas.height);
            } else if (action.type === 'symbol') {
                drawSymbol(ctx, action.symbol, action.x, action.y, action.color, canvas.width, canvas.height);
            }
        });
    }, [drawingHistory]);

    // Socket Event Listeners
    useEffect(() => {
        if (!on || !off) return;

        // Handle incoming drawing action
        const handleRemoteDraw = (data: any) => {
            if (!data) return;

            // Scroll Type (Ephemeral)
            if (data.type === 'scroll') {
                if (isTeacher) return;
                if (!pagesContainerRef.current) return;
                const { percentY, percentX } = data;
                const { scrollHeight, clientHeight, scrollWidth, clientWidth } = pagesContainerRef.current;
                const scrollTop = percentY * (scrollHeight - clientHeight);
                const scrollLeft = percentX * (scrollWidth - clientWidth);
                pagesContainerRef.current.scrollTo({ top: scrollTop, left: scrollLeft, behavior: 'auto' });
                return;
            }

            // --- Real-time Drawing Handlers ---

            // Path Start
            if (data.type === 'path-start') {
                const { id, startPoint, color, lineWidth, isEraser, pageNum } = data;
                remotePathsRef.current.set(id, {
                    points: [startPoint],
                    color,
                    lineWidth,
                    isEraser,
                    pageNum
                });
                return;
            }

            // Path Move (Throttled real-time updates)
            if (data.type === 'path-move') {
                const { id, point } = data;
                const remotePath = remotePathsRef.current.get(id);

                if (remotePath) {
                    const canvas = annotationCanvasRefs.current.get(remotePath.pageNum);
                    const ctx = canvas?.getContext('2d');

                    if (canvas && ctx) {
                        const lastPoint = remotePath.points[remotePath.points.length - 1];
                        remotePath.points.push(point);

                        // Draw immediately
                        drawLine(
                            ctx,
                            lastPoint,
                            point,
                            remotePath.color,
                            remotePath.lineWidth,
                            remotePath.isEraser,
                            canvas.width,
                            canvas.height
                        );
                    }
                }
                return;
            }

            // Path End (Finalize)
            if (data.type === 'path-end') {
                const { id, fullPath, pageNum } = data; // Receive full path for consistency

                // Cleanup temp path
                remotePathsRef.current.delete(id);

                // Add to history
                const action: DrawingAction = {
                    type: 'path',
                    points: fullPath,
                    color: data.color,
                    lineWidth: data.lineWidth,
                    isEraser: data.isEraser
                };

                setDrawingHistory(prev => ({
                    ...prev,
                    [pageNum]: [...(prev[pageNum] || []), action]
                }));
                // Note: setDrawingHistory will trigger redrawPage, which clears canvas and redraws
                // This 'flicker' is actually good as it corrects any interpolation errors from real-time drawing
                return;
            }

            // --- Legacy/Other Action Handlers ---

            // Check if it's one of our new supported types with pageNum
            if ('pageNum' in data && (data.type === 'path' || data.type === 'text' || data.type === 'symbol')) {
                const pageNum = data.pageNum;
                let action: DrawingAction;

                if (data.type === 'path') {
                    // Legacy path handler (full path received at once)
                    action = { type: 'path', points: data.points, color: data.color, lineWidth: data.lineWidth, isEraser: data.isEraser };
                } else if (data.type === 'text') {
                    action = { type: 'text', text: data.text, x: data.x, y: data.y, color: data.color };
                } else if (data.type === 'symbol') {
                    action = { type: 'symbol', symbol: data.symbol, x: data.x, y: data.y, color: data.color };
                } else {
                    return;
                }

                setDrawingHistory(prev => ({
                    ...prev,
                    [pageNum]: [...(prev[pageNum] || []), action]
                }));
            }
        };

        // Handle sync (initial or refresh)
        const handleSync = (data: any) => {
            // Server now sends an array of persistent actions (or it might come as data.whiteboardStrokes?)
            // Based on server.js: socket.emit('whiteboard-sync', session.whiteboardStrokes); -> It's an array.
            // But let's handle potential object wrap just in case.

            let actions: any[] = [];
            if (Array.isArray(data)) {
                actions = data;
            } else if (data && data.history) {
                // Legacy or if we change server back
                setDrawingHistory(data.history);
                return;
            } else if (data && Array.isArray(data.whiteboardStrokes)) {
                actions = data.whiteboardStrokes;
            }

            if (actions.length > 0) {
                const newHistory: Record<number, DrawingAction[]> = {};

                actions.forEach(action => {
                    if (action && typeof action.pageNum === 'number') {
                        if (!newHistory[action.pageNum]) {
                            newHistory[action.pageNum] = [];
                        }

                        // Sanitize action for client usage (remove pageNum if not needed in DrawingAction type, but keeping it is fine)
                        // Client DrawingAction types:
                        // | { type: 'path'; points: Point[]; color: string; lineWidth: number; isEraser: boolean }
                        // | { type: 'text'; text: string; x: number; y: number; color: string }
                        // | { type: 'symbol'; symbol: string; x: number; y: number; color: string }

                        let clientAction: DrawingAction | null = null;

                        if (action.type === 'path') {
                            clientAction = {
                                type: 'path',
                                points: action.points,
                                color: action.color,
                                lineWidth: action.lineWidth,
                                isEraser: action.isEraser
                            };
                        } else if (action.type === 'text') {
                            clientAction = {
                                type: 'text',
                                text: action.text,
                                x: action.x,
                                y: action.y,
                                color: action.color
                            };
                        } else if (action.type === 'symbol') {
                            clientAction = {
                                type: 'symbol',
                                symbol: action.symbol,
                                x: action.x,
                                y: action.y,
                                color: action.color
                            };
                        }

                        if (clientAction) {
                            newHistory[action.pageNum].push(clientAction);
                        }
                    }
                });

                setDrawingHistory(newHistory);
            }
        };

        // Handle clear
        const handleRemoteClear = (data: { pageIndex?: number }) => {
            if (data && typeof data.pageIndex === 'number') {
                // Clear specific page
                setDrawingHistory(prev => {
                    const next = { ...prev };
                    delete next[data.pageIndex as number];
                    return next;
                });

                const canvas = annotationCanvasRefs.current.get(data.pageIndex);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            } else {
                // Clear all
                setDrawingHistory({});
                remotePathsRef.current.clear();
                annotationCanvasRefs.current.forEach((canvas) => {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                });
            }
        };

        on('whiteboard-draw', handleRemoteDraw);
        on('whiteboard-sync', handleSync);
        on('whiteboard-clear', handleRemoteClear);

        return () => {
            off('whiteboard-draw', handleRemoteDraw);
        };
    }, [on, off]);

    // Redraw when pages are rendered (Zoom/Scroll) or History changes
    useEffect(() => {
        annotationCanvasRefs.current.forEach((canvas, pageNum) => {
            const ctx = canvas.getContext('2d');
            if (ctx) redrawPage(pageNum, ctx);
        });
    }, [renderedPages, redrawPage]);

    const handleTextSubmit = () => {
        if (!textValue.trim() || activeTextPage === null || !textInputPos) {
            setTextInputVisible(false);
            return;
        }

        const canvas = annotationCanvasRefs.current.get(activeTextPage);
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        // Adjust for input padding (p-2 = 8px)
        // Input box top-left is at textInputPos (CSS pixels)
        // Text starts rendering inside input at ~ (8, 8) CSS pixels offset
        // We want to match visual position
        const cssX = textInputPos.x + 8;
        const cssY = textInputPos.y + 10; // slightly more for vertical centering

        const x = cssX * scaleX;
        const y = cssY * scaleY;
        const normX = x / canvas.width;
        const normY = y / canvas.height;

        ctx.save();
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = currentColor;

        // Update history
        const action: DrawingAction = { type: 'text', text: textValue, x: normX, y: normY, color: currentColor };
        setDrawingHistory(prev => ({
            ...prev,
            [activeTextPage]: [
                ...(prev[activeTextPage] || []),
                action
            ]
        }));

        // Emit event
        emit?.('whiteboard-draw', {
            sessionId,
            event: { ...action, pageNum: activeTextPage }
        });

        // Draw immediately
        drawText(ctx, textValue, normX, normY, currentColor, canvas.width, canvas.height);
        ctx.restore();

        setTextInputVisible(false);
        setTextValue('');
        setActiveTextPage(null);
    };

    const getEventPoint = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if ('touches' in e) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        }
        return { clientX: e.clientX, clientY: e.clientY };
    };

    const handleAnnotationStart = (e: React.MouseEvent | React.TouchEvent, pageNum: number) => {
        if (!isTeacher) return;

        // Prevent default touch actions (scrolling) if drawing
        if (drawingEnabled && 'touches' in e) {
            // e.preventDefault(); // Can't prevent default on passive listener? React handles this.
        }

        const canvas = annotationCanvasRefs.current.get(pageNum);
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const { clientX, clientY } = getEventPoint(e);
        const cssX = clientX - rect.left;
        const cssY = clientY - rect.top;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = cssX * scaleX;
        const canvasY = cssY * scaleY;
        const normX = canvasX / canvas.width;
        const normY = canvasY / canvas.height;

        // Text Mode
        if (textMode) {
            if ('touches' in e) return;
            setTextInputPos({ x: cssX, y: cssY });
            setActiveTextPage(pageNum);
            setTextInputVisible(true);
            setTextValue('');
            return;
        }

        // Symbol Mode
        if (selectedSymbol) {
            const ctx = getDrawContext(pageNum);
            if (ctx) {
                drawSymbol(ctx, selectedSymbol, normX, normY, currentColor, canvas.width, canvas.height);
                onSymbolPlaced?.();

                const action: DrawingAction = { type: 'symbol', symbol: selectedSymbol, x: normX, y: normY, color: currentColor };

                setDrawingHistory(prev => ({
                    ...prev,
                    [pageNum]: [
                        ...(prev[pageNum] || []),
                        action
                    ]
                }));

                emit?.('whiteboard-draw', {
                    sessionId,
                    event: { ...action, pageNum }
                });
            }
            return;
        }

        // Draw Mode
        if (!drawingEnabled) return;

        isDrawingRef.current = true;
        lastPointRef.current = { x: normX, y: normY };
        currentPathRef.current = [{ x: normX, y: normY }];
        activeDrawingPageRef.current = pageNum;

        // --- Generate Stroke ID for Real-time ---
        currentStrokeIdRef.current = `${sessionId}-${Date.now()}`;

        // Emit Path Start
        emit?.('whiteboard-draw', {
            sessionId,
            event: {
                type: 'path-start',
                id: currentStrokeIdRef.current,
                startPoint: { x: normX, y: normY },
                color: currentColor,
                lineWidth: lineWidth,
                isEraser: isEraser,
                pageNum
            }
        });
    };

    const handleAnnotationMove = (e: React.MouseEvent | React.TouchEvent, pageNum: number) => {
        if (!isTeacher || !isDrawingRef.current) return;
        const canvas = annotationCanvasRefs.current.get(pageNum);
        const ctx = getDrawContext(pageNum);
        if (!canvas || !ctx || !lastPointRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const { clientX, clientY } = getEventPoint(e);
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (clientX - rect.left) * scaleX;
        const y = (clientY - rect.top) * scaleY;
        const normX = x / canvas.width;
        const normY = y / canvas.height;

        drawLine(ctx, lastPointRef.current, { x: normX, y: normY }, currentColor, lineWidth, isEraser, canvas.width, canvas.height);
        lastPointRef.current = { x: normX, y: normY };
        currentPathRef.current.push({ x: normX, y: normY });

        // --- Real-time Throttled Emission ---
        const now = Date.now();
        if (now - lastEmitRef.current > 20) { // 20ms = ~50fps
            emit?.('whiteboard-draw', {
                sessionId,
                event: {
                    type: 'path-move',
                    id: currentStrokeIdRef.current,
                    point: { x: normX, y: normY }
                }
            });
            lastEmitRef.current = now;
        }
    };

    const handleAnnotationEnd = () => {
        if (isDrawingRef.current && currentPathRef.current.length > 0 && activeDrawingPageRef.current !== null) {
            const pageNum = activeDrawingPageRef.current;
            const capturedPoints = [...currentPathRef.current];
            const capturedColor = currentColor;
            const capturedWidth = lineWidth;
            const capturedEraser = isEraser;

            // Emit Path End with Full Path (for reliability)
            emit?.('whiteboard-draw', {
                sessionId,
                event: {
                    type: 'path-end',
                    id: currentStrokeIdRef.current,
                    fullPath: capturedPoints,
                    color: capturedColor,
                    lineWidth: capturedWidth,
                    isEraser: capturedEraser,
                    pageNum
                }
            });

            // Add path to history
            const action: DrawingAction = {
                type: 'path',
                points: capturedPoints,
                color: capturedColor,
                lineWidth: capturedWidth,
                isEraser: capturedEraser
            };

            setDrawingHistory(prev => ({
                ...prev,
                [pageNum]: [
                    ...(prev[pageNum] || []),
                    action
                ]
            }));
        }

        isDrawingRef.current = false;
        lastPointRef.current = null;
        activeDrawingPageRef.current = null;
        currentPathRef.current = [];
        currentStrokeIdRef.current = null;
    };


    // Clear all annotation canvases when clearTrigger changes
    useEffect(() => {
        if (clearTrigger > 0) {
            // Clear history state
            setDrawingHistory({});

            // Clear canvases visually
            annotationCanvasRefs.current.forEach((canvas) => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
        }
        if (clearTrigger > 0) {
            // Clear history state
            setDrawingHistory({});

            // Clear canvases visually
            annotationCanvasRefs.current.forEach((canvas) => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
        }
    }, [clearTrigger]);

    // Scroll Handler (Teacher Only)
    const handleScroll = () => {
        if (!pagesContainerRef.current || !isTeacher) return;

        const now = Date.now();
        if (now - lastScrollEmit.current < 50) return; // 50ms throttle (20fps)

        const { scrollTop, scrollLeft, scrollHeight, clientHeight, scrollWidth, clientWidth } = pagesContainerRef.current;
        // Avoid division by zero
        const maxScrollY = scrollHeight - clientHeight;
        const maxScrollX = scrollWidth - clientWidth;

        const percentY = maxScrollY > 0 ? scrollTop / maxScrollY : 0;
        const percentX = maxScrollX > 0 ? scrollLeft / maxScrollX : 0;

        emit?.('whiteboard-draw', {
            sessionId,
            event: { type: 'scroll', percentY, percentX, pageNum: currentPage }
        });
        lastScrollEmit.current = now;
    };

    return (
        <div ref={containerRef} className="h-full flex flex-col bg-dark-300 rounded-2xl overflow-hidden">
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

                    {/* Zoom controls with slider */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => handleZoomButton(-20)}
                            disabled={localZoom <= 30}
                            className="p-2 rounded-lg bg-secondary-500/20 text-secondary-300 hover:bg-secondary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>

                        <input
                            type="range"
                            min="30"
                            max="300"
                            value={localZoom}
                            onChange={(e) => {
                                const newZoom = Number(e.target.value);
                                setLocalZoom(newZoom);
                                onZoomChange?.(newZoom);
                            }}
                            className="w-24 h-2 accent-brand-accent cursor-pointer"
                        />

                        <span className="text-white font-medium min-w-16 text-center">
                            %{localZoom}
                        </span>

                        <button
                            onClick={() => handleZoomButton(20)}
                            disabled={localZoom >= 300}
                            className="p-2 rounded-lg bg-secondary-500/20 text-secondary-300 hover:bg-secondary-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>

                        <span className="text-xs text-gray-400 ml-2">(Ctrl + Scroll)</span>
                    </div>
                </motion.div>
            )}

            {/* PDF Pages - Responsive Grid */}
            <div
                ref={pagesContainerRef}
                className={`flex-1 p-4 bg-dark-400 ${isTeacher ? 'overflow-auto' : 'overflow-hidden'}`}
                onScroll={handleScroll}
            >
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-400">PDF yükleniyor...</p>
                    </div>
                ) : error ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                        <div className="text-5xl">📄</div>
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : !pdfUrl ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
                        <div className="text-6xl">📚</div>
                        <h3 className="text-xl font-semibold text-white">Akıllı Tahta</h3>
                        <p className="text-gray-400">
                            {isTeacher
                                ? 'Bir PDF seçin ve öğrencilerinizle paylaşın'
                                : 'Öğretmen henüz bir ders materyali seçmedi'}
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4 justify-center items-start">
                        {renderedPages.map(({ pageNum, canvas }) => (
                            <motion.div
                                key={pageNum}
                                data-page={pageNum}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`relative shadow-2xl rounded-lg overflow-hidden transition-all ${pageNum === currentPage ? 'ring-2 ring-brand-accent ring-offset-2 ring-offset-dark-400' : ''
                                    }`}
                            >
                                {/* PDF Page Image */}
                                <img
                                    src={canvas.toDataURL()}
                                    alt={`Sayfa ${pageNum}`}
                                    className="bg-white"
                                    style={{ maxWidth: '100%', height: 'auto' }}
                                    onClick={() => isTeacher && goToPage(pageNum)}
                                />

                                {/* Annotation Canvas Overlay - draws on top of PDF */}
                                <canvas
                                    ref={(el) => {
                                        if (el) annotationCanvasRefs.current.set(pageNum, el);
                                    }}
                                    width={canvas.width}
                                    height={canvas.height}
                                    className="absolute inset-0 z-10 touch-none"
                                    style={{ width: '100%', height: '100%' }}
                                    onMouseDown={(e) => handleAnnotationStart(e, pageNum)}
                                    onMouseMove={(e) => handleAnnotationMove(e, pageNum)}
                                    onMouseUp={handleAnnotationEnd}
                                    onMouseLeave={handleAnnotationEnd}
                                    onTouchStart={(e) => handleAnnotationStart(e, pageNum)}
                                    onTouchMove={(e) => handleAnnotationMove(e, pageNum)}
                                    onTouchEnd={handleAnnotationEnd}
                                />

                                {/* Text Input Floating UI */}
                                {textInputVisible && activeTextPage === pageNum && textInputPos && (
                                    <div
                                        className="absolute z-50"
                                        style={{ left: textInputPos.x, top: textInputPos.y }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            ref={textInputRef}
                                            type="text"
                                            value={textValue}
                                            onChange={(e) => setTextValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                e.stopPropagation();
                                                if (e.key === 'Enter') handleTextSubmit();
                                                if (e.key === 'Escape') setTextInputVisible(false);
                                            }}
                                            onBlur={() => {
                                                // Optional: Submit on blur? Or cancel? 
                                                // Better to keep open until explicit action
                                            }}
                                            className="bg-brand-dark/90 text-white border border-brand-accent rounded p-2 min-w-[150px] shadow-xl outline-none"
                                            placeholder="Yazı yazın..."
                                        />
                                    </div>
                                )}

                                {/* Page Number Badge */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/70 rounded-full text-white text-sm font-medium pointer-events-none">
                                    {pageNum}
                                </div>
                            </motion.div>
                        ))}
                    </div>
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
