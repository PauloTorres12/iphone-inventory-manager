"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { iPhone, Etiqueta } from "@/lib/types";
import AdminForm from "@/components/AdminForm";
import ConfirmModal from "@/components/ConfirmModal";
import { formatPrice } from "@/lib/utils";
import { useBlueRate, arsToUsd, formatUsd, usdToArs } from "@/lib/useBlueRate";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    ShoppingBag,
    LogOut,
    Pencil,
    Trash2,
    BarChart2,
    List,
    Tag,
    Loader2,
    CircleCheckBig,
} from "lucide-react";

const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

export default function AdminPage() {
    const [authed, setAuthed] = useState(false);
    const [password, setPassword] = useState("");
    const [wrongPass, setWrongPass] = useState(false);

    const [products, setProducts] = useState<iPhone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editProduct, setEditProduct] = useState<iPhone | null>(null);
    const [activeTab, setActiveTab] = useState<"stock" | "stats" | "etiquetas">("stock");
    const { rate: blueRate } = useBlueRate();
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [pendingSellId, setPendingSellId] = useState<string | null>(null);

    // Helper: extract filename from Supabase Storage URL and delete
    async function deleteStorageFiles(urls: string[]) {
        const filenames = urls
            .map(url => {
                const match = url.match(/productos-imagenes\/([^?]+)/);
                return match ? match[1] : null;
            })
            .filter(Boolean) as string[];
        if (filenames.length > 0) {
            await supabase.storage.from("productos-imagenes").remove(filenames);
        }
    }

    // Helper: current month string 'YYYY-MM'
    function currentMes() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASS) {
            setAuthed(true);
            sessionStorage.setItem("dw_admin", "1");
        } else {
            setWrongPass(true);
        }
    };

    useEffect(() => {
        if (sessionStorage.getItem("dw_admin") === "1") setAuthed(true);
    }, []);

    useEffect(() => {
        if (!authed) return;
        fetchAll();
        // Auto-cleanup: silently delete ventas older than current month
        const mes = currentMes();
        supabase.from("ventas").delete().lt("mes", mes).then(() => { });

        // Realtime subscription
        const channel = supabase
            .channel("admin-iphones")
            .on("postgres_changes", { event: "*", schema: "public", table: "iphones" }, fetchAll)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [authed]);

    async function fetchAll() {
        const { data, error } = await supabase
            .from("iphones")
            .select("*, etiqueta:etiquetas(*)")
            .order("created_at", { ascending: false });

        if (!error) setProducts((data as iPhone[]) ?? []);
        setLoading(false);
    }



    const handleDelete = async (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        // Immediately remove from local state
        setProducts(prev => prev.filter(p => p.id !== id));
        setPendingDeleteId(null);

        // Delete images from Storage
        if (product.fotos?.length) await deleteStorageFiles(product.fotos);

        // Delete the iPhone record (no ventas snapshot — eliminado, no vendido)
        await supabase.from("iphones").delete().eq("id", id);
    };

    const handleSell = async (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        // Immediately remove from local state so UI updates instantly
        setProducts(prev => prev.filter(p => p.id !== id));
        setPendingSellId(null);

        // 1. Save snapshot to ventas table
        await supabase.from("ventas").insert({
            mes: currentMes(),
            modelo: product.modelo,
            capacidad: product.capacidad,
            color: product.color,
            estado: product.estado,
            precio_usd: product.precio_usd,
            salud_bateria: product.salud_bateria,
            etiqueta_nombre: product.etiqueta?.nombre ?? null,
        });

        // 2. Delete images from Storage
        if (product.fotos?.length) await deleteStorageFiles(product.fotos);

        // 3. Delete the iPhone record
        await supabase.from("iphones").delete().eq("id", id);
    };

    // --- LOGIN SCREEN ---
    if (!authed) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-sm border border-slate-100"
                >
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 bg-slate-800 rounded-xl flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-slate-800">
                            Digico<span className="text-sky-500">World</span> Admin
                        </span>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setWrongPass(false); }}
                                required
                                autoFocus
                                placeholder="••••••••"
                                className={`w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition ${wrongPass ? "border-red-300 bg-red-50" : "border-slate-200"
                                    }`}
                            />
                            {wrongPass && (
                                <p className="text-xs text-red-500 mt-1">Contraseña incorrecta</p>
                            )}
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-slate-900 hover:bg-slate-700 text-white py-3 rounded-2xl text-sm font-medium transition-colors"
                        >
                            Ingresar
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    // --- ADMIN PANEL ---
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Admin Navbar */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 text-sm">
                        Digico<span className="text-sky-500">World</span>{" "}
                        <span className="text-slate-400 font-normal hidden sm:inline">Admin</span>
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setEditProduct(null); setShowForm(true); }}
                            className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-medium px-3 py-2 rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Nuevo iPhone</span>
                        </button>
                        <button
                            onClick={() => { sessionStorage.removeItem("dw_admin"); setAuthed(false); }}
                            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
                            aria-label="Cerrar sesión"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Tabs — desktop only (mobile tabs are at bottom) */}
                <div className="max-w-5xl mx-auto px-4 gap-1 pb-2 hidden sm:flex">
                    {(["stock", "stats", "etiquetas"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors ${activeTab === tab
                                ? "bg-slate-900 text-white"
                                : "text-slate-500 hover:bg-slate-100"
                                }`}
                        >
                            {tab === "stock" ? <List className="w-3.5 h-3.5" /> : tab === "stats" ? <BarChart2 className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
                            {tab === "stock" ? "Stock" : tab === "stats" ? "Estadísticas" : "Etiquetas"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile bottom tab bar */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 flex">
                {(["stock", "stats", "etiquetas"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${activeTab === tab ? "text-slate-900" : "text-slate-400"
                            }`}
                    >
                        {tab === "stock" ? <List className="w-5 h-5" /> : tab === "stats" ? <BarChart2 className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                        <span className="text-[10px]">{tab === "stock" ? "Stock" : tab === "stats" ? "Stats" : "Etiquetas"}</span>
                        {activeTab === tab && <span className="absolute bottom-0 w-6 h-0.5 bg-slate-900 rounded-full" />}
                    </button>
                ))}
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-8">
                {/* Form Modal */}
                <AnimatePresence>
                    {showForm && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
                            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
                        >
                            <motion.div
                                initial={{ y: 60, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 60, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col"
                            >
                                {/* Inner scroll area — overflow-hidden on outer clips scrollbar within rounded corners */}
                                <div
                                    className="overflow-y-auto flex-1 p-5 sm:p-6"
                                    style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
                                >
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="font-bold text-slate-800">
                                            {editProduct ? "Editar iPhone" : "Nuevo iPhone"}
                                        </h2>
                                        <button
                                            onClick={() => setShowForm(false)}
                                            className="p-2 rounded-xl hover:bg-slate-100"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <AdminForm
                                        editProduct={editProduct}
                                        onSuccess={() => { setShowForm(false); setEditProduct(null); }}
                                    />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {activeTab === "stock" ? (
                    <>
                        <h2 className="text-lg font-bold text-slate-800 mb-4">
                            Todos los iPhones{" "}
                            <span className="font-normal text-slate-400 text-sm">({products.length})</span>
                        </h2>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-slate-100" />
                                ))}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="text-center py-20 text-slate-400">
                                <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No hay iPhones cargados todavía.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {products.map((p) => (
                                    <motion.div
                                        key={p.id}
                                        layout
                                        className={`bg-white rounded-2xl border transition-opacity ${p.vendido ? "opacity-50 border-slate-100" : "border-slate-100"}`}
                                    >
                                        {/* Mobile layout: vertical stack */}
                                        <div className="flex sm:hidden flex-col p-4 gap-2.5">
                                            {/* Row 1: photo + full name */}
                                            <div className="flex items-center gap-3">
                                                {p.fotos?.[0] && (
                                                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={p.fotos[0]} alt={p.modelo} className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                                <p className="font-semibold text-slate-800 text-sm leading-snug">
                                                    {p.modelo} {p.capacidad}
                                                    <span className="font-normal text-slate-400"> · {p.color}</span>
                                                </p>
                                            </div>
                                            {/* Row 2: badges */}
                                            <div className="flex flex-wrap gap-1.5">
                                                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.estado}</span>
                                                {p.etiqueta && (
                                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full" style={{ backgroundColor: p.etiqueta.color + "25", color: p.etiqueta.color }}>
                                                        {p.etiqueta.nombre}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Row 3: price + battery */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-sky-600">${p.precio_usd} USD</span>
                                                <span className="text-xs text-slate-300">·</span>
                                                <span className="text-xs text-slate-500">Batería {p.salud_bateria}%</span>
                                            </div>
                                            {/* Row 4: action buttons full width */}
                                            <div className="flex gap-2 pt-1 border-t border-slate-50">
                                                <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-sky-50 text-sky-500 text-xs font-medium">
                                                    <Pencil className="w-3.5 h-3.5" /> Editar
                                                </button>
                                                <button onClick={() => setPendingSellId(p.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-medium">
                                                    <CircleCheckBig className="w-3.5 h-3.5" /> Vendido
                                                </button>
                                                <button onClick={() => setPendingDeleteId(p.id)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-red-50 text-red-400 text-xs font-medium">
                                                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                                                </button>
                                            </div>
                                        </div>

                                        {/* Desktop layout: compact horizontal row */}
                                        <div className="hidden sm:flex items-center gap-4 p-4">
                                            {p.fotos?.[0] && (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-100">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={p.fotos[0]} alt={p.modelo} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-slate-800 text-sm truncate">{p.modelo} {p.capacidad} · {p.color}</p>
                                                    {p.etiqueta && (
                                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: p.etiqueta.color + "25", color: p.etiqueta.color }}>
                                                            {p.etiqueta.nombre}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-semibold text-sky-600">${p.precio_usd} USD</span>
                                                    <span className="text-xs text-slate-300">·</span>
                                                    <span className="text-xs text-slate-500">Batería {p.salud_bateria}%</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => { setEditProduct(p); setShowForm(true); }} className="p-2 rounded-xl bg-sky-50 text-sky-500 hover:bg-sky-100 transition-colors" title="Editar"><Pencil className="w-4 h-4" /></button>
                                                <button onClick={() => setPendingSellId(p.id)} className="p-2 rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-colors" title="Marcar como vendido"><CircleCheckBig className="w-4 h-4" /></button>
                                                <button onClick={() => setPendingDeleteId(p.id)} className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                ) : activeTab === "stats" ? (
                    <StatsPanel products={products} blueRate={blueRate} />
                ) : (
                    <EtiquetasPanel />
                )}

                {/* Sell confirm modal */}
                {pendingSellId && (
                    <ConfirmModal
                        title="Marcar como vendido"
                        message={(() => {
                            const p = products.find(x => x.id === pendingSellId);
                            return p
                                ? `Se registrará "${p.modelo} ${p.capacidad}" como vendido en las estadísticas y se eliminará del catálogo.`
                                : "El dispositivo se registrará como vendido.";
                        })()}
                        confirmLabel="Sí, vendido"
                        onConfirm={() => handleSell(pendingSellId)}
                        onCancel={() => setPendingSellId(null)}
                    />
                )}

                {/* Delete confirm modal */}
                {pendingDeleteId && (
                    <ConfirmModal
                        title="Eliminar iPhone"
                        message={(() => {
                            const p = products.find(x => x.id === pendingDeleteId);
                            return p
                                ? `Se eliminará "${p.modelo} ${p.capacidad}" y sus fotos del servidor. Esta acción no se puede deshacer.`
                                : "Esta acción no se puede deshacer.";
                        })()}
                        confirmLabel="Sí, eliminar"
                        onConfirm={() => handleDelete(pendingDeleteId)}
                        onCancel={() => setPendingDeleteId(null)}
                    />
                )}

            </div>
        </div >
    );
}

// --- STATS PANEL ---
type Venta = {
    modelo: string;
    capacidad: string;
    color: string;
    estado: string;
    precio_usd: number;
    salud_bateria: number;
    etiqueta_nombre: string | null;
};

function currentMesLabel() {
    return new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}
function currentMes() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function StatsPanel({ products, blueRate }: { products: iPhone[]; blueRate: number | null }) {
    const [ventas, setVentas] = useState<Venta[]>([]);

    useEffect(() => {
        supabase
            .from("ventas")
            .select("*")
            .eq("mes", currentMes())
            .then(({ data }) => setVentas((data as Venta[]) ?? []));
    }, []);

    const stats = useMemo(() => {
        const available = products.filter(p => !p.vendido);
        const sold = products.filter(p => p.vendido);

        // Group by etiqueta
        const byEtiqueta = new Map<string, { label: string; color: string; items: iPhone[] }>();
        byEtiqueta.set("__none__", { label: "Sin etiqueta", color: "#94a3b8", items: [] });

        available.forEach(p => {
            if (p.etiqueta) {
                if (!byEtiqueta.has(p.etiqueta.id)) {
                    byEtiqueta.set(p.etiqueta.id, { label: p.etiqueta.nombre, color: p.etiqueta.color, items: [] });
                }
                byEtiqueta.get(p.etiqueta.id)!.items.push(p);
            } else {
                byEtiqueta.get("__none__")!.items.push(p);
            }
        });

        return { available, sold, byEtiqueta };
    }, [products]);

    const totalUsd = stats.available.reduce((s, p) => s + (p.precio_usd ?? 0), 0);
    const totalArs = stats.available.reduce((s, p) => s + p.precio, 0);
    const ventasTotalUsd = ventas.reduce((s, v) => s + (v.precio_usd ?? 0), 0);

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: "Disponibles", value: stats.available.length, color: "text-emerald-600" },
                    { label: "Vendido este mes (USD)", value: `$${ventasTotalUsd.toLocaleString("en-US")}`, color: "text-orange-400" },
                    { label: "Valor stock USD", value: `$${totalUsd.toLocaleString("en-US")}`, color: "text-sky-600" },
                    { label: "Valor stock ARS", value: formatPrice(totalArs), color: "text-slate-700" },
                ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                        <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                        <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Ventas del mes */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-700">
                        Vendidos este mes
                        <span className="font-normal text-slate-400 ml-1 text-xs capitalize">({currentMesLabel()})</span>
                    </h3>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {ventas.length} unidad{ventas.length !== 1 ? "es" : ""}
                    </span>
                </div>
                {ventas.length === 0 ? (
                    <p className="text-xs text-slate-400">Ningún dispositivo eliminado aún este mes.</p>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span>Total recuperado (USD)</span>
                            <span className="font-bold text-slate-800">${ventasTotalUsd.toLocaleString("en-US")}</span>
                        </div>
                        {ventas.map((v, i) => (
                            <div key={i} className="flex items-center justify-between py-1.5 border-t border-slate-50">
                                <div>
                                    <p className="text-xs font-medium text-slate-700">{v.modelo} {v.capacidad}</p>
                                    <p className="text-xs text-slate-400">{v.color} · {v.estado}{v.etiqueta_nombre ? ` · ${v.etiqueta_nombre}` : ""}</p>
                                </div>
                                <span className="text-xs font-semibold text-sky-600">${v.precio_usd}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* By etiqueta */}
            <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Stock por etiqueta (disponibles)</h3>
                <div className="space-y-2">
                    {Array.from(stats.byEtiqueta.values()).map(({ label, color, items }) => {
                        if (items.length === 0) return null;
                        const totalItemUsd = items.reduce((s, p) => s + (p.precio_usd ?? 0), 0);
                        const totalItemArs = items.reduce((s, p) => s + p.precio, 0);
                        const avgBat = Math.round(items.reduce((s, p) => s + p.salud_bateria, 0) / items.length);
                        return (
                            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: color + "25", color }}>
                                        {label}
                                    </span>
                                    <span className="text-xs text-slate-400">{items.length} unidad{items.length !== 1 ? "es" : ""}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <p className="text-xs text-slate-400">Valor USD</p>
                                        <p className="text-sm font-semibold text-sky-600">${totalItemUsd.toLocaleString("en-US")}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Valor ARS</p>
                                        <p className="text-sm font-semibold text-slate-800">{usdToArs(totalItemUsd, blueRate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-400">Bat. prom.</p>
                                        <p className="text-sm font-semibold text-slate-800">{avgBat}%</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// --- ETIQUETAS PANEL ---
function EtiquetasPanel() {
    const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
    const [iphones, setIphones] = useState<{ etiqueta_id: string | null }[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [pendingDelete, setPendingDelete] = useState<Etiqueta | null>(null);

    useEffect(() => {
        Promise.all([
            supabase.from("etiquetas").select("*").order("nombre"),
            supabase.from("iphones").select("etiqueta_id"),
        ]).then(([{ data: et }, { data: ip }]) => {
            setEtiquetas((et as Etiqueta[]) ?? []);
            setIphones((ip as { etiqueta_id: string | null }[]) ?? []);
            setLoading(false);
        });
    }, []);

    const usageCount = (id: string) => iphones.filter(p => p.etiqueta_id === id).length;

    const handleDelete = async (et: Etiqueta) => {
        setDeleting(et.id);
        await supabase.from("etiquetas").delete().eq("id", et.id);
        setEtiquetas(prev => prev.filter(e => e.id !== et.id));
        setDeleting(null);
        setPendingDelete(null);
    };

    if (loading) return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-14 animate-pulse border border-slate-100" />)}
        </div>
    );

    if (etiquetas.length === 0) return (
        <div className="text-center py-20 text-slate-400">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No hay etiquetas creadas.</p>
            <p className="text-xs mt-1">Creá una desde el formulario de carga de iPhone.</p>
        </div>
    );

    return (
        <div className="space-y-3">
            {/* Custom confirm modal */}
            {pendingDelete && (
                <ConfirmModal
                    title={`Eliminar "${pendingDelete.nombre}"`}
                    message={
                        usageCount(pendingDelete.id) > 0
                            ? `Esta etiqueta está asignada a ${usageCount(pendingDelete.id)} iPhone${usageCount(pendingDelete.id) !== 1 ? "s" : ""}. Al eliminarla, éstos quedarán sin etiqueta.`
                            : "Esta acción no se puede deshacer."
                    }
                    confirmLabel="Sí, eliminar"
                    onConfirm={() => handleDelete(pendingDelete)}
                    onCancel={() => setPendingDelete(null)}
                />
            )}
            <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg font-bold text-slate-800">
                    Etiquetas{" "}
                    <span className="font-normal text-slate-400 text-sm">({etiquetas.length})</span>
                </h2>
            </div>
            {etiquetas.map(et => {
                const count = usageCount(et.id);
                return (
                    <motion.div
                        key={et.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4"
                    >
                        {/* Color dot */}
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: et.color }} />

                        {/* Badge preview + slug */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span
                                    className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                    style={{ backgroundColor: et.color + "20", color: et.color, border: `1px solid ${et.color}40` }}
                                >
                                    {et.nombre}
                                </span>
                                <span className="text-xs text-slate-400">
                                    {count > 0 ? `${count} iPhone${count !== 1 ? "s" : ""} asignado${count !== 1 ? "s" : ""}` : "Sin uso"}
                                </span>
                            </div>
                        </div>

                        {/* Delete */}
                        <button
                            onClick={() => setPendingDelete(et)}
                            disabled={deleting === et.id}
                            className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors disabled:opacity-40 shrink-0"
                            title="Eliminar etiqueta"
                        >
                            {deleting === et.id
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <Trash2 className="w-4 h-4" />
                            }
                        </button>
                    </motion.div>
                );
            })}
        </div>
    );
}
