import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';
import { createStudentSession } from '@/lib/auth/student';

export async function POST(request: NextRequest) {
  try {
    const { action, classId, name, pin, auth_user_id } = await request.json();

    if (!classId || !name || !pin || !/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    // 1. Check if student exists
    const { data: foundStudent } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('name', name.trim())
      .single();

    let existingStudent = foundStudent;

    // If not found by name, try finding by auth_user_id if provided
    if (!existingStudent && auth_user_id) {
      const { data: linkedStudent } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .eq('auth_user_id', auth_user_id)
        .single();
      existingStudent = linkedStudent;
    }

    if (action === 'join') {
      if (existingStudent) {
        return NextResponse.json({ error: 'Account already exists for this class' }, { status: 409 });
      }

      // Create new student
      const hashedPin = await bcrypt.hash(pin, 10);
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert([{ 
          class_id: classId, 
          name: name.trim(), 
          pin: hashedPin,
          auth_user_id: auth_user_id || null,
          last_login_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) throw createError;

      await createStudentSession(newStudent.id);
      return NextResponse.json({ success: true, studentId: newStudent.id });
    } 
    
    if (action === 'login') {
      if (!existingStudent) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const isMatch = await bcrypt.compare(pin, existingStudent.pin);
      if (!isMatch) {
        return NextResponse.json({ error: 'Incorrect PIN' }, { status: 401 });
      }

      // Link auth_user_id if not already linked
      if (auth_user_id && !existingStudent.auth_user_id) {
        await supabase
          .from('students')
          .update({ auth_user_id })
          .eq('id', existingStudent.id);
      }

      // Update last_login_at
      await supabase
        .from('students')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', existingStudent.id);

      await createStudentSession(existingStudent.id);
      return NextResponse.json({ success: true, studentId: existingStudent.id });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
