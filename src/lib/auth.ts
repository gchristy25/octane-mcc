import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!

interface UserPayload {
  id: string
  email: string
  role: string
  full_name: string
}

export async function verifyAuth(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null

    const decoded = jwt.verify(token, JWT_SECRET) as UserPayload
    return decoded
  } catch {
    return null
  }
}

export function createToken(user: { id: string; email: string; role: string; full_name: string }): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      full_name: user.full_name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}
