"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { iPhone, EstadoFilter, ModeloFilter } from "@/lib/types";
import ProductCard from "@/components/ProductCard";
import FilterBar from "@/components/FilterBar";
import { ProductCardSkeleton } from "@/components/ProductSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";

export default function ProductGrid() {
    const [products, setProducts] = useState<iPhone[]>([]);
    const [loading, setLoading] = useState(true);
    const [modeloFilter, setModeloFilter] = useState<ModeloFilter>("Todos");
    const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("Todos");

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
            .select("*, etiqueta:etiquetas(*)")  // join con etiquetas
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

    return (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
            <div className="mb-6">
                <FilterBar
                    modeloFilter={modeloFilter}
                    estadoFilter={estadoFilter}
                    onModeloChange={setModeloFilter}
                    onEstadoChange={setEstadoFilter}
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
                    {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
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
                        onClick={() => { setModeloFilter("Todos"); setEstadoFilter("Todos"); }}
                        className="mt-4 text-sm text-sky-500 underline"
                    >
                        Limpiar filtros
                    </button>
                </motion.div>
            ) : (
                <AnimatePresence mode="wait">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
                    </div>
                </AnimatePresence>
            )}
        </section>
    );
}
