import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Access global sessions map from server.js
declare global {
    var sessions: Map<string, {
        id: string;
        createdAt: Date;
        createdBy: string;
        isActive: boolean;
        pdfState: null;
        maxParticipants: number;
    }>;
    var publicUrl: string;
    var serverPublicIP: string;
}

export async function POST(request: Request) {
    try {
        // Verify teacher authentication
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Yetkilendirme gerekli' },
                { status: 401 }
            );
        }

        // Generate unique session ID
        const sessionId = uuidv4();

        // Create session
        const session = {
            id: sessionId,
            createdAt: new Date(),
            createdBy: 'teacher',
            isActive: true,
            pdfState: null,
            maxParticipants: 11, // 1 teacher + 10 students
        };

        // Store in global sessions map
        if (global.sessions) {
            global.sessions.set(sessionId, session);
        }

        const baseUrl = global.publicUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const sessionUrl = `${baseUrl}/live/${sessionId}`;
        const tunnelPassword = global.serverPublicIP || '';

        return NextResponse.json({
            success: true,
            data: {
                sessionId,
                sessionUrl,
                tunnelPassword,
                session,
            },
        });
    } catch (error) {
        console.error('Session creation error:', error);
        return NextResponse.json(
            { success: false, error: 'Oturum oluşturulurken bir hata oluştu' },
            { status: 500 }
        );
    }
}
