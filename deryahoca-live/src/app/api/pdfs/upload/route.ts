import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'Dosya seçilmedi' },
                { status: 400 }
            );
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json(
                { success: false, error: 'Sadece PDF dosyaları yüklenebilir' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Ensure directory exists
        const uploadDir = join(process.cwd(), 'uploads', 'pdfs');
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Save file
        // Sanitize filename to prevent issues
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueName = `${Date.now()}-${safeName}`;
        const filePath = join(uploadDir, uniqueName);

        await writeFile(filePath, buffer);

        // Get public URL configuration
        // In local dev, we serve from /uploads via a custom server or next config
        // But for static serving from filesystem in Next.js + Storage, we need a route handler or static serve
        // server.js handles '/uploads' static serving
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const fileUrl = `${baseUrl}/uploads/pdfs/${uniqueName}`;

        return NextResponse.json({
            success: true,
            data: {
                name: file.name,
                url: fileUrl
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Dosya yüklenirken bir hata oluştu' },
            { status: 500 }
        );
    }
}
