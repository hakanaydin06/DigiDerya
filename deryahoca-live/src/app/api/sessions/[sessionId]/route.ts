import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: { sessionId: string } }
) {
    try {
        const { sessionId } = params;

        // Check if session exists
        const session = global.sessions?.get(sessionId);

        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Oturum bulunamadı' },
                { status: 404 }
            );
        }

        // Get participant count
        const participants = global.participants
            ? Array.from(global.participants.values()).filter(p => p.sessionId === sessionId)
            : [];

        return NextResponse.json({
            success: true,
            data: {
                ...session,
                participantCount: participants.length,
            },
        });
    } catch (error) {
        console.error('Session fetch error:', error);
        return NextResponse.json(
            { success: false, error: 'Oturum bilgisi alınırken bir hata oluştu' },
            { status: 500 }
        );
    }
}
