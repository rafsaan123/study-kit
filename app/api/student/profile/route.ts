import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/mongodb';
import { Student } from '../../../models/Student';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/options';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in profile API:', session);

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    // Use email field which contains the student ID
    const studentId = session.user.email;
    console.log('Looking for student with ID:', studentId);

    const student = await Student.findOne({ studentId: studentId });
    console.log('Found student:', student);

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const profileData = {
      name: student.name,
      studentId: student.studentId,
      session: student.session,
      department: student.department || 'Survey Technology',
      regulation: student.regulation || 2022,
      phone: student.phone || '',
      address: student.address || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      profileImage: student.profileImage || ''
    };

    console.log('Sending profile data:', profileData);
    return NextResponse.json(profileData);

  } catch (error) {
    console.error('Error in profile API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    await connectDB();
    const data = await req.json();
    const studentId = session.user.email;

    const allowedFields = ['phone', 'address', 'guardianName', 'guardianPhone', 'profileImage'];

    // Filter out non-allowed fields
    const updateData = Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = data[key];
        return obj;
      }, {});

    const updatedStudent = await Student.findOneAndUpdate(
      { studentId: studentId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      name: updatedStudent.name,
      studentId: updatedStudent.studentId,
      session: updatedStudent.session,
      department: updatedStudent.department || 'Survey Technology',
      regulation: updatedStudent.regulation || 2022,
      phone: updatedStudent.phone || '',
      address: updatedStudent.address || '',
      guardianName: updatedStudent.guardianName || '',
      guardianPhone: updatedStudent.guardianPhone || '',
      profileImage: updatedStudent.profileImage || ''
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}