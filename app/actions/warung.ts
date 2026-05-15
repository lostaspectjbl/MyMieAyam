'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateWarungCache() {
    revalidatePath('/')
    revalidatePath('/warung')
    revalidatePath('/favorit')
}
