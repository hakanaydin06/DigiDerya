import { NextResponse } from 'next/server';

// Demo credentials (in production, use a database)
const TEACHER_EMAIL = process.env.TEACHER_EMAIL || 'ogretmen@deryahoca.com';
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || 'DeryaHoca2024!';
const JWT_SECRET = process.env.JWT_SECRET || 'deryahoca-live-secret-key';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'E-posta ve şifre gereklidir' },
                { status: 400 }
            );
        }

        // Check credentials (in production, use proper hashing and database)
        if (email !== TEACHER_EMAIL || password !== TEACHER_PASSWORD) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz e-posta veya şifre' },
                { status: 401 }
            );
        }

        // Generate simple token (in production, use proper JWT library)
        const token = Buffer.from(JSON.stringify({
            email,
            name: 'Derya Hoca',
            isTeacher: true,
            exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        })).toString('base64');

        return NextResponse.json({
            success: true,
            data: {
                token,
                user: {
                    email,
                    name: 'Derya Hoca',
                },
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, error: 'Giriş sırasında bir hata oluştu' },
            { status: 500 }
        );
    }
}
