import { NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const nextParam = searchParams.get('next') ?? '/'

    let next = '/'
    if (
        nextParam.startsWith('/') &&
        !nextParam.startsWith('//') &&
        !nextParam.startsWith('/\\')
    ) {
        try {
            const target = new URL(nextParam, origin)
            if (target.origin === origin) {
                next = `${target.pathname}${target.search}${target.hash}`
            }
        } catch {
            next = '/'
        }
    }
    const linkError =
        searchParams.get('error_description') ?? searchParams.get('error')

    if (linkError) {
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent(linkError)}`
        )
    }

    const supabase = await createClient()

    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('Auth Callback Error (exchangeCodeForSession):', error.message)
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
        )
    }

    if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
        })

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        console.error('Auth Callback Error (verifyOtp):', error.message)
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
        )
    }

    console.error('Auth Callback Error: Missing code or token_hash parameter.')
    return NextResponse.redirect(
        `${origin}/auth/login?error=${encodeURIComponent(
            'Link verifikasi tidak valid atau sudah kadaluarsa.'
        )}`
    )
}
