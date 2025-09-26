import { NextResponse } from 'next/server';
import { PookieApiService } from '../../../services/pookieApiService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Temporarily bypass authentication for testing
    // const session = await getServerSession(authOptions);
    // if (!session) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    // Get parameters from query params
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const regulation = searchParams.get('regulation') || '2022';
    const program = searchParams.get('program') || 'Diploma in Engineering';

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Use Pookie API Service
    const result = await PookieApiService.searchStudentResult(studentId, regulation, program);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error.includes('not found') ? 404 : 500 }
      );
    }

    return NextResponse.json(result.data);

  } catch (error: any) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch result' },
      { status: 500 }
    );
  }
}