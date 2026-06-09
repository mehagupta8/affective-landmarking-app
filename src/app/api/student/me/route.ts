import { NextResponse } from 'next/server';
import { getStudentSession } from '@/lib/auth/student';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  const studentId = await getStudentSession();
  
  if (!studentId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single();

  if (error || !student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  return NextResponse.json(student);
}
