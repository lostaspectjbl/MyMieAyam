import WarungCardSkeleton from './WarungCardSkeleton'

export default function WarungListSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <WarungCardSkeleton key={i} />
            ))}
        </div>
    )
}
