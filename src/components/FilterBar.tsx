"use client";

import { motion } from "framer-motion";
import { EstadoFilter, ModeloFilter } from "@/lib/types";

interface FilterBarProps {
    modeloFilter: ModeloFilter;
    estadoFilter: EstadoFilter;
    onModeloChange: (v: ModeloFilter) => void;
    onEstadoChange: (v: EstadoFilter) => void;
}

const modelos: ModeloFilter[] = ["Todos", "11", "12", "13", "14", "15", "16", "17"];
const estados: EstadoFilter[] = ["Todos", "Nuevo", "Usado", "Outlet"];

function FilterPill({
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            onClick={onClick}
            animate={{
                backgroundColor: active ? "#1e293b" : "#f1f5f9",
                color: active ? "#ffffff" : "#64748b",
                scale: active ? 1.04 : 1,
            }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap touch-manipulation hover:opacity-90"
        >
            {label}
        </motion.button>
    );
}

export default function FilterBar({
    modeloFilter,
    estadoFilter,
    onModeloChange,
    onEstadoChange,
}: FilterBarProps) {
    return (
        <div className="space-y-6 text-center">
            {/* Modelo filters */}
            <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Modelo
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    {modelos.map((m) => (
                        <FilterPill
                            key={m}
                            label={m === "Todos" ? "Todos" : `iPhone ${m}`}
                            active={modeloFilter === m}
                            onClick={() => onModeloChange(m)}
                        />
                    ))}
                </div>
            </div>

            {/* Estado filters */}
            <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                    Estado
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                    {estados.map((e) => (
                        <FilterPill
                            key={e}
                            label={e}
                            active={estadoFilter === e}
                            onClick={() => onEstadoChange(e)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
