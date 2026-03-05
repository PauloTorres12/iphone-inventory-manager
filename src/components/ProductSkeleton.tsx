export default function ProductSkeleton() {
    return (
        <div className="absolute inset-0 bg-slate-50 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-white to-slate-100 animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
        </div>
    );
}

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl overflow-hidden border border-slate-100">
            {/* Image skeleton */}
            <div className="aspect-square bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-white to-slate-100 animate-[shimmer_1.5s_infinite] bg-[length:200%_100%]" />
            </div>
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded-full w-3/4 animate-pulse" />
                <div className="flex gap-2">
                    <div className="h-5 bg-slate-100 rounded-full w-14 animate-pulse" />
                    <div className="h-5 bg-slate-100 rounded-full w-14 animate-pulse" />
                </div>
                <div className="h-6 bg-slate-100 rounded-full w-1/2 animate-pulse" />
                <div className="h-10 bg-slate-100 rounded-2xl animate-pulse" />
            </div>
        </div>
    );
}
