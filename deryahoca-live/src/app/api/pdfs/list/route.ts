import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
    try {
        const pdfDir = join(process.cwd(), 'uploads', 'pdfs');

        let files: string[] = [];
        try {
            files = await readdir(pdfDir);
        } catch {
            // Directory doesn't exist, return empty list
            return NextResponse.json({
                success: true,
                data: [],
            });
        }

        const pdfFiles = files.filter(f => f.toLowerCase().endsWith('.pdf'));

        const pdfs = await Promise.all(
            pdfFiles.map(async (file) => {
                const filePath = join(pdfDir, file);
                const stats = await stat(filePath);
                return {
                    name: file,
                    url: `/api/pdfs/file/${encodeURIComponent(file)}`,
                    size: stats.size,
                    uploadedAt: stats.birthtime,
                };
            })
        );

        return NextResponse.json({
            success: true,
            data: pdfs,
        });
    } catch (error) {
        console.error('PDF list error:', error);
        return NextResponse.json(
            { success: false, error: 'PDF listesi alınırken bir hata oluştu' },
            { status: 500 }
        );
    }
}
