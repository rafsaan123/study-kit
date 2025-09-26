import { NextResponse } from 'next/server';
import { connectDB } from '../../lib/mongodb';
import { Student } from '../../models/Student';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '../auth/[...nextauth]/options';

export async function POST(req: Request) {
  try {
    // Get session
    const session = await getServerSession(authOptions);

    // Debug log
    console.log('Session in API:', session);

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    

    await connectDB();
    const data = await req.json();

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create student with all required fields
    const student = await Student.create({
      name: data.name,
      studentId: data.studentId,
      password: hashedPassword,
      session: data.session,
      regulation: data.regulation || 2022,
      department: data.department || 'Survey Technology',
      createdBy: session.user.email
    });

    // Remove password from response
    const studentResponse = {
      id: student._id,
      name: student.name,
      studentId: student.studentId,
      session: student.session,
      regulation: student.regulation,
      department: student.department,
      createdAt: student.createdAt
    };

    return NextResponse.json(studentResponse);
  } catch (error: any) {
    console.error('Error creating student:', error);

    // Handle duplicate studentId error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Student ID already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to create student', 
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// GET method to fetch students (optional)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== 'teacher') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const sessionYear = searchParams.get('session');
    const search = searchParams.get('search');

    // Build query
    const query: any = {
      createdBy: session.user.email
    };

    if (sessionYear) {
      query.session = sessionYear;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}