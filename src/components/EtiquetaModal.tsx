"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Etiqueta } from "@/lib/types";
import { X, Loader2, CheckCircle } from "lucide-react";

const PALETA = [
    { nombre: "Esmeralda", color: "#10b981" },
    { nombre: "Ámbar", color: "#f59e0b" },
    { nombre: "Rose", color: "#f43f5e" },
    { nombre: "Slate", color: "#64748b" },
    { nombre: "Sky", color: "#0ea5e9" },
    { nombre: "Violet", color: "#8b5cf6" },
    { nombre: "Orange", color: "#f97316" },
    { nombre: "Indigo", color: "#4f46e5" },
];

interface EtiquetaModalProps {
    onClose: () => void;
    onCreated: (e: Etiqueta) => void;
}

function toSlug(s: string) {
    return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function EtiquetaModal({ onClose, onCreated }: EtiquetaModalProps) {
    const [nombre, setNombre] = useState("");
    const [color, setColor] = useState(PALETA[0].color);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        if (!nombre.trim()) return;
        setLoading(true);
        setError("");
        const slug = toSlug(nombre);
        const { data, error: err } = await supabase
            .from("etiquetas")
            .insert({ nombre: nombre.trim(), slug, color })
            .select()
            .single();

        if (err) {
            setError(err.message.includes("unique") ? "Ya existe una etiqueta con ese nombre." : err.message);
            setLoading(false);
            return;
        }
        setDone(true);
        setTimeout(() => { onCreated(data as Etiqueta); onClose(); }, 700);
        setLoading(false);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && onClose()}
            >
                <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 320 }}
                    className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-xl"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-800">Nueva etiqueta</h3>
                        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Preview */}
                    <div className="flex items-center justify-center mb-5">
                        <span
                            className="text-xs font-semibold px-3 py-1.5 rounded-full"
                            style={{ backgroundColor: color + "25", color }}
                        >
                            {nombre || "Vista previa"}
                        </span>
                    </div>

                    {/* Nombre */}
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Nombre</label>
                        <input
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Premium, Oferta, Outlet…"
                            maxLength={24}
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                        />
                    </div>

                    {/* Paleta */}
                    <div className="mb-5">
                        <label className="block text-xs font-medium text-slate-500 mb-2">Color</label>
                        <div className="flex flex-wrap gap-2">
                            {PALETA.map((p) => (
                                <button
                                    type="button"
                                    key={p.color}
                                    title={p.nombre}
                                    onClick={() => setColor(p.color)}
                                    className="relative w-8 h-8 rounded-full transition-transform hover:scale-110"
                                    style={{ backgroundColor: p.color }}
                                >
                                    {color === p.color && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <span className="w-2 h-2 bg-white rounded-full shadow" />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={loading || !nombre.trim() || done}
                        className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-200 disabled:text-slate-400 text-white py-3 rounded-2xl text-sm font-medium transition-colors"
                    >
                        {done ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-400" /> ¡Creada!</>
                        ) : loading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                        ) : (
                            "Crear etiqueta"
                        )}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
