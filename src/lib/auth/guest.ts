import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.GUEST_JWT_SECRET || 'guest_fallback_secret_dev_only'
)

export async function createGuestSession(guestId: string, classId: string) {
  const token = await new SignJWT({ guestId, classId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET)

  ;(await cookies()).set('guest_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return token
}

export async function getGuestSession(): Promise<{ guestId: string; classId: string } | null> {
  const token = (await cookies()).get('guest_session')?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { guestId: payload.guestId as string, classId: payload.classId as string }
  } catch {
    return null
  }
}

export async function clearGuestSession() {
  ;(await cookies()).delete('guest_session')
}
