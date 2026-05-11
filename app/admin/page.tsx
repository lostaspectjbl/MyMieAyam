import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminPanel from './AdminPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Admin Panel',
    description: 'Panel admin untuk mengelola warung mie ayam di MMA.',
}

export default async function AdminPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

    if (!profile?.is_admin) redirect('/')

    return <AdminPanel />
}
