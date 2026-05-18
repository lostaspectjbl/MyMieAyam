import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // jika ada parameter next, kita redirect ke situ setelah berhasil
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
        
        // Log error jika ada masalah saat menukar kode
        console.error("Auth Callback Error (exchangeCodeForSession):", error.message)
        return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
    }

    // Redirect ke login jika tidak ada code parameter (misalnya menggunakan implicit flow)
    console.error("Auth Callback Error: Missing 'code' parameter in URL.")
    return NextResponse.redirect(`${origin}/auth/login?error=Invalid_or_missing_code`)
}
