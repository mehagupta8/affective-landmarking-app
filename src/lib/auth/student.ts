import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
  process.env.STUDENT_JWT_SECRET || 'fallback_secret_for_dev_only'
);

export async function createStudentSession(studentId: string) {
  const token = await new SignJWT({ studentId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);

  (await cookies()).set('student_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return token;
}

export async function getStudentSession() {
  const token = (await cookies()).get('student_session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload.studentId as string;
  } catch {
    return null;
  }
}

export async function clearStudentSession() {
  (await cookies()).delete('student_session');
}
