// User types
export interface User {
    id: string;
    userName: string;
    isTeacher: boolean;
}

// Participant in a room
export interface Participant extends User {
    sessionId: string;
    isMuted: boolean;
    isCameraOff: boolean;
    isHandRaised: boolean;
    stream?: MediaStream;
    isApproved?: boolean;
}

// Session/Room types
export interface Session {
    id: string;
    createdAt: Date;
    createdBy: string;
    isActive: boolean;
    pdfState?: PDFState;
    maxParticipants: number;
    focusMode?: boolean;
}

// PDF State for synchronization
export interface PDFState {
    pdfUrl: string;
    pdfName: string;
    currentPage: number;
    totalPages: number;
    zoom: number;
}

// Waiting room types
export interface WaitingStudent {
    id: string;
    userName: string;
    sessionId: string;
    requestedAt: string;
}

// Drawing/Whiteboard types
export interface DrawingPoint {
    x: number;
    y: number;
}

export type DrawingEvent =
    | { type: 'start' | 'draw' | 'end'; from?: DrawingPoint; point: DrawingPoint; color: string; lineWidth: number; isEraser: boolean; pageIndex: number }
    | { type: 'path'; points: DrawingPoint[]; color: string; lineWidth: number; isEraser: boolean; pageNum: number }
    | { type: 'text'; text: string; x: number; y: number; color: string; pageNum: number }
    | { type: 'symbol'; symbol: string; x: number; y: number; color: string; pageNum: number }
    | { type: 'scroll'; percentY: number; percentX: number; pageNum: number };

// Socket Events
export interface ServerToClientEvents {
    'user-joined': (data: { id: string; userName: string; isTeacher: boolean }) => void;
    'user-left': (data: { id: string; userName: string }) => void;
    'user-reconnected': (data: { id: string; userName: string; isTeacher: boolean }) => void;
    'existing-participants': (participants: Participant[]) => void;
    'signal-offer': (data: { from: string; offer: RTCSessionDescriptionInit }) => void;
    'signal-answer': (data: { from: string; answer: RTCSessionDescriptionInit }) => void;
    'signal-ice-candidate': (data: { from: string; candidate: RTCIceCandidateInit }) => void;
    'participant-updated': (data: { id: string; isMuted?: boolean; isCameraOff?: boolean }) => void;
    'hand-raised': (data: { id: string; userName: string; isHandRaised: boolean }) => void;
    'pdf-sync': (pdfState: PDFState) => void;
    'pdf-page-sync': (data: { page: number }) => void;
    'pdf-zoom-sync': (data: { zoom: number }) => void;
    'pdf-scroll-sync': (data: { percentY: number; percentX: number }) => void;
    'reconnect-approved': () => void;
    // Waiting room events
    'waiting-for-approval': (data: { message: string }) => void;
    'admission-approved': (data: { message: string }) => void;
    'admission-denied': (data: { message: string }) => void;
    'student-waiting': (data: WaitingStudent) => void;
    'waiting-students': (students: WaitingStudent[]) => void;
    'waiting-student-left': (data: { id: string }) => void;
    // Whiteboard events
    'whiteboard-draw': (event: DrawingEvent) => void;
    'whiteboard-clear': (data?: { pageIndex?: number }) => void;
    'whiteboard-sync': (strokes: DrawingEvent[]) => void;
    // Focus mode
    'focus-mode-sync': (data: { enabled: boolean }) => void;
    'join-error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
    'join-room': (data: { sessionId: string; userName: string; isTeacher: boolean }) => void;
    'leave-room': (data: { sessionId: string }) => void;
    'signal-offer': (data: { to: string; offer: RTCSessionDescriptionInit }) => void;
    'signal-answer': (data: { to: string; answer: RTCSessionDescriptionInit }) => void;
    'signal-ice-candidate': (data: { to: string; candidate: RTCIceCandidateInit }) => void;
    'toggle-audio': (data: { isMuted: boolean }) => void;
    'toggle-video': (data: { isCameraOff: boolean }) => void;
    'raise-hand': (data: { isHandRaised: boolean }) => void;
    'pdf-change': (data: { sessionId: string; pdfState: PDFState }) => void;
    'pdf-page-change': (data: { sessionId: string; page: number }) => void;
    'pdf-zoom-change': (data: { sessionId: string; zoom: number }) => void;
    'pdf-scroll-change': (data: { sessionId: string; percentY: number; percentX: number }) => void;
    'reconnect-request': (data: { sessionId: string; userName: string; isTeacher: boolean }) => void;
    'request-sync': (data: { sessionId: string }) => void;
    // Waiting room
    'admit-student': (data: { studentSocketId: string; sessionId: string }) => void;
    'deny-student': (data: { studentSocketId: string; sessionId: string }) => void;
    // Whiteboard
    'whiteboard-draw': (data: { sessionId: string; event: DrawingEvent }) => void;
    'whiteboard-clear': (data: { sessionId: string; pageIndex: number }) => void;
    // Focus mode
    'toggle-focus-mode': (data: { sessionId: string; enabled: boolean }) => void;
}

// API Response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface LoginResponse {
    token: string;
    user: {
        email: string;
        name: string;
    };
}

export interface SessionCreateResponse {
    sessionId: string;
    sessionUrl: string;
}

// PDF File type
export interface PDFFile {
    id: string;
    name: string;
    url: string;
    pages: number;
    uploadedAt: Date;
}

// Device types for lobby
export interface MediaDeviceInfo {
    deviceId: string;
    label: string;
    kind: 'audioinput' | 'videoinput' | 'audiooutput';
}

export interface DeviceState {
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
    selectedVideo: string;
    selectedAudio: string;
}

// Connection quality
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'disconnected';

export interface PeerConnectionState {
    peerId: string;
    connectionState: RTCPeerConnectionState;
    quality: ConnectionQuality;
}
