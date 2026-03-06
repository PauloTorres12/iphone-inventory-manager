"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { iPhone, EstadoFilter, ModeloFilter } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import { ProductCardSkeleton } from "@/components/ProductSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";


export default function ProductGrid() {
    const [products, setProducts] = useState<iPhone[]>([]);
    const [loading, setLoading] = useState(true);
    const [modeloFilter, setModeloFilter] = useState<ModeloFilter>("Todos");
    const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("Todos");
    const [page, setPage] = useState(0);
    // 6 per page on mobile (3×2), 8 on desktop (2×4)
    const [pageSize, setPageSize] = useState(8);

    useEffect(() => {
        const update = () => setPageSize(window.innerWidth < 640 ? 6 : 8);
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);

    useEffect(() => {
        fetchProducts();

        const channel = supabase
            .channel("iphones-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "iphones" }, fetchProducts)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    async function fetchProducts() {
        const { data, error } = await supabase
            .from("iphones")
            .select("*, etiqueta:etiquetas(*)")
            .eq("vendido", false)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching products:", error.message);
        } else {
            setProducts((data as iPhone[]) ?? []);
        }
        setLoading(false);
    }

    const filtered = products.filter((p) => {
        const modelMatch = modeloFilter === "Todos" || p.modelo.includes(`iPhone ${modeloFilter}`);
        const estadoMatch = estadoFilter === "Todos" || p.estado === estadoFilter;
        return modelMatch && estadoMatch;
    });

    const totalPages = Math.ceil(filtered.length / pageSize);
    const currentPage = Math.min(page, Math.max(0, totalPages - 1));
    const pageItems = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    // Reset to page 0 when filters change
    const handleModeloChange = (v: ModeloFilter) => { setModeloFilter(v); setPage(0); };
    const handleEstadoChange = (v: EstadoFilter) => { setEstadoFilter(v); setPage(0); };

    return (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
            <div className="mb-6">
                <FilterBar
                    modeloFilter={modeloFilter}
                    estadoFilter={estadoFilter}
                    onModeloChange={handleModeloChange}
                    onEstadoChange={handleEstadoChange}
                />
            </div>

            {!loading && (
                <motion.p
                    key={filtered.length}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-slate-400 mb-4 text-center"
                >
                    {filtered.length} {filtered.length === 1 ? "producto" : "productos"} disponibles
                </motion.p>
            )}

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {Array.from({ length: pageSize }).map((_, i) => <ProductCardSkeleton key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-24"
                >
                    <Search className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-medium">No hay productos con estos filtros</p>
                    <button
                        onClick={() => { handleModeloChange("Todos"); handleEstadoChange("Todos"); }}
                        className="mt-4 text-sm text-sky-500 underline"
                    >
                        Limpiar filtros
                    </button>
                </motion.div>
            ) : (
                <>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, x: 24 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -24 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                        >
                            {pageItems.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                        </motion.div>
                    </AnimatePresence>

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-8">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                aria-label="Página anterior"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            {/* Page dots */}
                            <div className="flex items-center gap-1.5">
                                {Array.from({ length: totalPages }).map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i)}
                                        className={`rounded-full transition-all duration-200 ${i === currentPage
                                            ? "w-6 h-2.5 bg-slate-800"
                                            : "w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300"
                                            }`}
                                        aria-label={`Página ${i + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage === totalPages - 1}
                                className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                aria-label="Página siguiente"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
