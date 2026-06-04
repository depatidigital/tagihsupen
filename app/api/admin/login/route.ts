import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const password = form.get('password') as string

  if (password === process.env.ADMIN_PASSWORD) {
    const jar = await cookies()
    jar.set('admin_auth', 'ok', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 86400 * 7,
      path: '/',
    })
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.redirect(new URL('/admin?error=1', req.url))
}
