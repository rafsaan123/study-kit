import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '../../lib/mongodb';
import { Student } from '../../models/Student';
import bcrypt from 'bcryptjs';
import { authOptions } from '../auth/[...nextauth]/options';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    await connectDB();

    if (session.user.userType === 'student') {
      const student = await Student.findOne({ studentId: session.user.email });

      if (!student) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const isValid = await bcrypt.compare(currentPassword, student.password);

      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      student.password = hashedPassword;
      await student.save();

      return NextResponse.json({ message: 'Password updated successfully' });
    }

    // For teacher password change (if needed)
    if (session.user.userType === 'teacher') {
      if (currentPassword !== 'test123') {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Teacher password cannot be changed in demo mode' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Invalid user type' }, { status: 400 });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}