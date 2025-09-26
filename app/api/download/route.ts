import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const filePath = decodeURIComponent(url.searchParams.get('filePath') || '');
        const originalName = decodeURIComponent(url.searchParams.get('originalName') || '');

        if (!filePath) {
            return new NextResponse('File path is required', { status: 400 });
        }

        const fullPath = path.join(process.cwd(), 'public', 'uploads', filePath);
        const file = await readFile(fullPath);

        // Set appropriate headers for file download
        const headers = new Headers();
        headers.set('Content-Disposition', `attachment; filename="${originalName}"`);
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Length', file.length.toString());

        return new NextResponse(file, { headers });
    } catch (error) {
        console.error('Download error:', error);
        return new NextResponse('Error downloading file', { status: 500 });
    }
}