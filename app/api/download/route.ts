import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { GCSService } from '../../../services/gcsService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const url = new URL(req.url);
        const fileUrl = decodeURIComponent(url.searchParams.get('fileUrl') || '');
        const originalName = decodeURIComponent(url.searchParams.get('originalName') || '');

        if (!fileUrl) {
            return new NextResponse('File URL is required', { status: 400 });
        }

        // Check if it's a GCS URL
        if (fileUrl.includes('storage.googleapis.com')) {
            // Extract GCS path from URL
            const urlParts = fileUrl.split('/');
            const bucketIndex = urlParts.findIndex(part => part === 'study-kit-uploads');
            if (bucketIndex === -1) {
                return new NextResponse('Invalid GCS URL', { status: 400 });
            }
            
            const gcsPath = urlParts.slice(bucketIndex + 1).join('/');
            
            // Generate signed URL for secure access
            const signedUrl = await GCSService.getSignedUrl(gcsPath);
            
            // Redirect to signed URL
            return NextResponse.redirect(signedUrl);
        } else {
            // Handle legacy local file downloads
            return new NextResponse('Legacy file downloads not supported. Please re-upload files.', { status: 410 });
        }
    } catch (error) {
        console.error('Download error:', error);
        return new NextResponse('Error downloading file', { status: 500 });
    }
}