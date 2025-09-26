import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { Content } from '../../../models/Content';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';
import { GCSService } from '../../../../services/gcsService';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can delete content' },
        { status: 401 }
      );
    }

    await connectDB();
    const content = await Content.findById(params.id);

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Delete associated files from GCS
    if (content.attachments && content.attachments.length > 0) {
      for (const attachment of content.attachments) {
        if (attachment.gcsPath) {
          try {
            await GCSService.deleteFile(attachment.gcsPath);
          } catch (error) {
            console.error('Error deleting GCS file:', error);
            // Continue with content deletion even if file deletion fails
          }
        }
      }
    }

    // Delete the content from database
    await Content.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can update content' },
        { status: 401 }
      );
    }

    await connectDB();
    const updateData = await req.json();

    const content = await Content.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(content);
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}