import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminPanel from './AdminPanel'
import type { Metadata } from 'next'
import type { Warung } from '@/types'

export const metadata: Metadata = {
    title: 'Admin Panel',
    description: 'Panel admin untuk mengelola warung mie ayam di MMA.',
}

export default async function AdminPage() {
    const supabase = await createClient()

    // Jalankan auth check + fetch warung secara paralel untuk lebih cepat
    const [
        { data: { user } },
    ] = await Promise.all([
        supabase.auth.getUser(),
    ])

    if (!user) redirect('/auth/login')

    const [{ data: profile }, { data: warungs }] = await Promise.all([
        supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single(),
        supabase
            .from('warung')
            .select('*')
            .order('created_at', { ascending: false }),
    ])

    if (!profile?.is_admin) redirect('/')

    return <AdminPanel initialWarungs={(warungs as Warung[]) || []} />
}
