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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalWithParticipants = global as any;
        const participants = globalWithParticipants.participants
            ? Array.from(globalWithParticipants.participants.values()).filter((p: any) => p.sessionId === sessionId)
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
