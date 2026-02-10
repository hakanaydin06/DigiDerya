import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

export async function GET(
    request: Request,
    { params }: { params: { filename: string } }
) {
    try {
        // Decode and normalize filename (NFC for consistent Unicode handling)
        const requestedFilename = decodeURIComponent(params.filename).normalize('NFC');
        const pdfDir = join(process.cwd(), 'uploads', 'pdfs');

        // List all files and find matching one (handles different Unicode normalizations)
        const files = await readdir(pdfDir);
        const matchingFile = files.find(file => {
            const normalizedFile = file.normalize('NFC');
            return normalizedFile === requestedFilename ||
                file === requestedFilename ||
                file.normalize('NFD') === requestedFilename.normalize('NFD');
        });

        if (!matchingFile) {
            console.error('PDF not found. Requested:', requestedFilename);
            console.error('Available files:', files);
            return NextResponse.json(
                { success: false, error: 'PDF dosyası bulunamadı' },
                { status: 404 }
            );
        }

        const filePath = join(pdfDir, matchingFile);
        const fileBuffer = await readFile(filePath);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${encodeURIComponent(matchingFile)}"`,
                'Cache-Control': 'public, max-age=31536000',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
        });
    } catch (error) {
        console.error('PDF file error:', error);
        return NextResponse.json(
            { success: false, error: 'PDF dosyası bulunamadı' },
            { status: 404 }
        );
    }
}

// Handle CORS preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
