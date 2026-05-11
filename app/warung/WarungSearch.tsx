'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

type Props = {
    initialQuery: string
}

export default function WarungSearch({ initialQuery }: Props) {
    const [query, setQuery] = useState(initialQuery)
    const router = useRouter()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (query.trim()) {
            router.push(`/warung?q=${encodeURIComponent(query.trim())}`)
        } else {
            router.push('/warung')
        }
    }

    const handleClear = () => {
        setQuery('')
        router.push('/warung')
    }

    return (
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-8">
            <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-muted dark:text-warm/40" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Cari warung mie ayam..."
                    className="w-full pl-12 pr-20 py-3.5 bg-white dark:bg-dark/60 border border-brown/15 dark:border-warm/15 rounded-xl text-brown dark:text-warm placeholder:text-muted/50 dark:placeholder:text-warm/30 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-16 p-1 text-muted hover:text-brown dark:hover:text-warm transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                <button
                    type="submit"
                    className="absolute right-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    Cari
                </button>
            </div>
        </form>
    )
}
