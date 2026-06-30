/**
 * CSRF middleware – removed. Always passes.
 */
import { NextRequest, NextResponse } from 'next/server'

export async function verifyCsrfMiddleware(_request: NextRequest): Promise<boolean> {
  return true
}

export function csrfErrorResponse(): NextResponse {
  return NextResponse.json({ error: 'CSRF error' }, { status: 403 })
}
