import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';
import { GCSService } from '../../../services/gcsService';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll('files');
    const folder = formData.get('folder') as string || 'uploads';

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Filter valid files
    const validFiles = files.filter(file => file instanceof File) as File[];

    if (validFiles.length === 0) {
      return NextResponse.json(
        { error: 'No valid files provided' },
        { status: 400 }
      );
    }

    // Upload files to Google Cloud Storage
    const uploadResults = await GCSService.uploadFiles(validFiles, folder);

    return NextResponse.json({ 
      success: true, 
      files: uploadResults 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}