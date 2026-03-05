"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    ChevronLeft,
    ChevronRight,
    MessageCircle,
    Zap,
    HardDrive,
    RefreshCw,
    DollarSign,
} from "lucide-react";
import { iPhone } from "@/lib/types";
import { cn, formatPrice, getBatteryColor, getWhatsAppLink } from "@/lib/utils";
import { formatUsd, usdToArs } from "@/lib/useBlueRate";

interface ProductModalProps {
    product: iPhone;
    blueRate: number | null;
    onClose: () => void;
}

export default function ProductModal({ product, blueRate, onClose }: ProductModalProps) {
    const [imgIdx, setImgIdx] = useState(0);
    const [direction, setDirection] = useState(0); // -1 = left, 1 = right
    const fotos = product.fotos?.length ? product.fotos : [];
    const hasMultiple = fotos.length > 1;

    const prev = () => {
        setDirection(-1);
        setImgIdx((i) => (i - 1 + fotos.length) % fotos.length);
    };
    const next = () => {
        setDirection(1);
        setImgIdx((i) => (i + 1) % fotos.length);
    };
    const goTo = (i: number) => {
        setDirection(i > imgIdx ? 1 : -1);
        setImgIdx(i);
    };

    // Lock body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const estadoBadge: Record<string, string> = {
        Nuevo: "bg-emerald-100 text-emerald-700",
        Usado: "bg-sky-100 text-sky-700",
        Outlet: "bg-amber-100 text-amber-700",
    };

    return (
        <AnimatePresence>
            {/* Backdrop */}
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center px-3 pb-3 sm:p-4"
                onClick={onClose}
            >
                {/* Modal */}
                <motion.div
                    key="modal"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 60, opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white w-full sm:max-w-md rounded-3xl overflow-hidden max-h-[88vh] flex flex-col shadow-xl"
                >
                    {/* Image gallery */}
                    <div className="relative bg-slate-50 aspect-[4/3] shrink-0">
                        {fotos.length > 0 ? (
                            <>
                                {/* Sliding gallery */}
                                <div className="absolute inset-0 overflow-hidden">
                                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                                        <motion.div
                                            key={imgIdx}
                                            custom={direction}
                                            variants={{
                                                enter: (d: number) => ({ x: d * 300, opacity: 0 }),
                                                center: { x: 0, opacity: 1 },
                                                exit: (d: number) => ({ x: d * -300, opacity: 0 }),
                                            }}
                                            initial="enter"
                                            animate="center"
                                            exit="exit"
                                            transition={{ type: "spring", stiffness: 380, damping: 36, mass: 0.8 }}
                                            className="absolute inset-0"
                                        >
                                            <Image
                                                src={fotos[imgIdx]}
                                                alt={`${product.modelo} foto ${imgIdx + 1}`}
                                                fill
                                                className="object-contain"
                                                sizes="(max-width: 640px) 100vw, 448px"
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                {hasMultiple && (
                                    <>
                                        <button
                                            onClick={prev}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                                        >
                                            <ChevronLeft className="w-4 h-4 text-slate-700" />
                                        </button>
                                        <button
                                            onClick={next}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                                        >
                                            <ChevronRight className="w-4 h-4 text-slate-700" />
                                        </button>
                                        {/* Dots */}
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                                            {fotos.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => goTo(i)}
                                                    className={cn(
                                                        "h-1.5 rounded-full transition-all duration-300",
                                                        i === imgIdx ? "bg-slate-800 w-4" : "bg-slate-300 w-1.5"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-5xl">📱</div>
                        )}


                        {/* Estado + Etiqueta + Close */}
                        <span className={cn("absolute top-3 left-3 z-10 text-xs font-semibold px-2.5 py-1 rounded-full", estadoBadge[product.estado] || "bg-slate-100 text-slate-600")}>
                            {product.estado}
                        </span>

                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                        >
                            <X className="w-4 h-4 text-slate-700" />
                        </button>

                        {/* Thumbnail strip */}
                        {hasMultiple && (
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden">
                                {/* (dots handle navigation, strip hidden) */}
                            </div>
                        )}
                    </div>

                    {/* Scrollable content */}
                    <div className="overflow-y-auto p-5 space-y-4 flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hover:scrollbar-thumb-slate-400"
                        style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
                        {/* Header */}
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight">
                                {product.modelo}{" "}
                                <span className="text-slate-400 font-normal">{product.color}</span>
                            </h2>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", estadoBadge[product.estado] || "bg-slate-100 text-slate-600")}>
                                    {product.estado}
                                </span>
                                {product.etiqueta && product.etiqueta.nombre !== product.estado && (
                                    <span
                                        className="text-xs font-semibold px-2.5 py-1 rounded-full"
                                        style={{
                                            backgroundColor: product.etiqueta.color + "20",
                                            color: product.etiqueta.color,
                                            border: `1px solid ${product.etiqueta.color}40`,
                                        }}
                                    >
                                        {product.etiqueta.nombre}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Specs chips */}
                        <div className="flex flex-wrap gap-2">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                                <HardDrive className="w-3.5 h-3.5" />
                                {product.capacidad}
                            </span>
                            <span className={cn("flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full", getBatteryColor(product.salud_bateria))}>
                                <Zap className="w-3.5 h-3.5" />
                                Batería {product.salud_bateria}%
                            </span>
                            {product.ciclos > 0 && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {product.ciclos} ciclos
                                </span>
                            )}
                        </div>

                        {/* Precios */}
                        <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                            {/* USD — precio fijo */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-800">Precio en USD</span>
                                <span className="text-xl font-bold text-slate-900">
                                    {formatUsd(product.precio_usd)}
                                </span>
                            </div>
                            {/* ARS — calculado al blue del día */}
                            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                                <span className="text-sm font-semibold text-slate-800">Precio en ARS</span>
                                <span className="text-xl font-bold text-slate-900">
                                    {usdToArs(product.precio_usd, blueRate)}
                                </span>
                            </div>
                            {blueRate && (
                                <p className="text-xs text-slate-500 text-right">
                                    Cotización blue: ${blueRate.toLocaleString("es-AR")}
                                </p>
                            )}
                        </div>

                        {/* Detalles */}
                        {product.detalles && (
                            <div>
                                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">
                                    Detalles del dispositivo
                                </p>
                                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                    {product.detalles}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer sticky CTA */}
                    <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0">
                        <a
                            href={getWhatsAppLink(product.modelo, product.precio, product.capacidad)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-medium py-3.5 rounded-2xl transition-colors touch-manipulation"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Consultar
                        </a>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
