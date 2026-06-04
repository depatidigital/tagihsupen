import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const jar = await cookies()
  jar.delete('admin_auth')
  return NextResponse.redirect(new URL('/admin', req.url))
}
