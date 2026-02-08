import { v4 as uuidv4 } from 'uuid';

export const generateSessionId = (): string => {
    return uuidv4();
};

export const generateSessionUrl = (sessionId: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return `${baseUrl}/live/${sessionId}`;
};

export const validateSessionId = (sessionId: string): boolean => {
    // UUID v4 pattern
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(sessionId);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
};
