import { NextResponse } from 'next/server';
import { connectDB } from '../../lib/mongodb';
import { Content } from '../../models/Content';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/options';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await connectDB();
    const formData = await req.formData();

    // Create content data
    const contentData: any = {
      title: formData.get('title'),
      contentType: formData.get('contentType'),
      targetSession: formData.get('targetSession') || 'All',
      targetDepartment: formData.get('targetDepartment') || 'All',
      createdBy: session.user.email
    };

    // Handle routine data
    if (contentData.contentType === 'routine') {
      try {
        const routineDataStr = formData.get('routineData') as string;
        console.log('Routine Data String:', routineDataStr);

        contentData.routineData = JSON.parse(routineDataStr);
        console.log('Parsed Routine Data:', contentData.routineData);

        contentData.content = '';
      } catch (error) {
        console.error("Error parsing routine data:", error);
        return NextResponse.json(
          { error: 'Invalid routine data format', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 400 }
        );
      }
    } else {
      contentData.content = formData.get('content');
      contentData.routineData = [];
    }

    // Handle attachments
    const attachmentsStr = formData.get('attachments') as string;
    if (attachmentsStr) {
      try {
        contentData.attachments = JSON.parse(attachmentsStr);
        console.log('Parsed Attachments:', contentData.attachments);
      } catch (error) {
        console.error("Error parsing attachments:", error);
        return NextResponse.json(
          { error: 'Invalid attachments format' },
          { status: 400 }
        );
      }
    } else {
      contentData.attachments = [];
    }

    console.log("Creating content with data:", contentData);
    const newContent = await Content.create(contentData);
    console.log("Created content:", newContent);

    return NextResponse.json({ 
      success: true, 
      content: newContent 
    });
  } catch (error: any) {
    console.error('Error creating content:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create content', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const contentType = searchParams.get('type');
    const department = searchParams.get('department');
    const query: any = {};

    if (contentType && contentType !== 'all') {
      query.contentType = contentType;
    }

    if (department && department !== 'all') {
      query.targetDepartment = department;
    }

    if (session.user.userType === 'student') {
      query.$and = [
        {
          $or: [
            { targetSession: session.user.session },
            { targetSession: 'All' }
          ]
        },
        {
          $or: [
            { targetDepartment: session.user.department },
            { targetDepartment: 'All' }
          ]
        }
      ];
    }

    console.log('Fetching content with query:', query);
    const contents = await Content.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    console.log('Fetched contents:', contents);
    return NextResponse.json(contents);
  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}