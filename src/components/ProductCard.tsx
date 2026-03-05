"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { MessageCircle, Zap, HardDrive, Info } from "lucide-react";
import { iPhone } from "@/lib/types";
import { cn, getBatteryColor, getWhatsAppLink } from "@/lib/utils";
import { useBlueRate, formatUsd } from "@/lib/useBlueRate";
import ProductSkeleton from "./ProductSkeleton";
import ProductModal from "./ProductModal";

interface ProductCardProps {
    product: iPhone;
    index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { rate } = useBlueRate();

    const mainImage = product.fotos?.length ? product.fotos[0] : null;

    const estadoBadgeStyle: Record<string, string> = {
        Nuevo: "bg-emerald-100 text-emerald-700",
        Usado: "bg-sky-100 text-sky-700",
        Outlet: "bg-amber-100 text-amber-700",
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.07, ease: "easeOut" }}
                className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
            >
                {/* Image — completely clean, no overlaid badges */}
                <div
                    className="relative aspect-square bg-slate-50 overflow-hidden cursor-pointer"
                    onClick={() => setShowModal(true)}
                >
                    {!imageLoaded && !imageError && <ProductSkeleton />}

                    {mainImage && !imageError ? (
                        <Image
                            src={mainImage}
                            alt={`${product.modelo} ${product.capacidad}`}
                            fill
                            className={cn(
                                "object-cover transition-all duration-500 group-hover:scale-105",
                                imageLoaded ? "opacity-100" : "opacity-0"
                            )}
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-4xl mb-2">📱</div>
                                <p className="text-xs text-slate-400">{product.modelo}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1 gap-2">
                    {/* Modelo */}
                    <h3 className="font-semibold text-slate-800 text-sm leading-tight">
                        {product.modelo}
                    </h3>

                    {/* Estado + Etiqueta badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", estadoBadgeStyle[product.estado] || "bg-slate-100 text-slate-600")}>
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

                    {/* Capacidad + Batería */}
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                            <HardDrive className="w-3 h-3" />
                            {product.capacidad}
                        </span>
                        <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", getBatteryColor(product.salud_bateria))}>
                            <Zap className="w-3 h-3" />
                            {product.salud_bateria}%
                        </span>
                    </div>

                    {/* Precio */}
                    <p className="text-xl font-bold text-slate-900">
                        {formatUsd(product.precio_usd)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto pt-1">
                        <a
                            href={getWhatsAppLink(product.modelo, product.precio, product.capacidad)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1.5 flex-1 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-2xl transition-colors duration-200 touch-manipulation"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium sm:px-3.5 py-2.5 rounded-2xl transition-colors duration-200 touch-manipulation"
                            aria-label="Ver más información"
                        >
                            <Info className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {showModal && (
                <ProductModal product={product} blueRate={rate} onClose={() => setShowModal(false)} />
            )}
        </>
    );
}
