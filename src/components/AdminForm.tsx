"use client";

import { useState, useRef, useEffect } from "react";
import { useBlueRate } from "@/lib/useBlueRate";
import { supabase } from "@/lib/supabase";
import { iPhone, Etiqueta } from "@/lib/types";
import { cn } from "@/lib/utils";
import EtiquetaModal from "@/components/EtiquetaModal";
import {
    Plus,
    Upload,
    Loader2,
    CheckCircle,
    XCircle,
    ImagePlus,
    X,
} from "lucide-react";

interface AdminFormProps {
    editProduct?: iPhone | null;
    onSuccess?: () => void;
}

type FormState = {
    modelo: string;
    color: string;
    capacidad: string;
    precio_usd: string;  // fuente de verdad
    salud_bateria: string;
    estado: "Nuevo" | "Usado" | "Outlet";
    detalles: string;
    etiqueta_id: string;
};

const initialForm: FormState = {
    modelo: "",
    color: "",
    capacidad: "128GB",
    precio_usd: "",
    salud_bateria: "",
    estado: "Usado",
    detalles: "",
    etiqueta_id: "",
};

export default function AdminForm({ editProduct, onSuccess }: AdminFormProps) {
    const [form, setForm] = useState<FormState>(
        editProduct
            ? {
                modelo: editProduct.modelo,
                color: editProduct.color,
                capacidad: editProduct.capacidad,
                precio_usd: String(editProduct.precio_usd ?? ""),
                salud_bateria: String(editProduct.salud_bateria),
                estado: editProduct.estado,
                detalles: editProduct.detalles,
                etiqueta_id: editProduct.etiqueta_id ?? "",
            }
            : initialForm
    );
    const [images, setImages] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [keptFotos, setKeptFotos] = useState<string[]>(editProduct?.fotos ?? []);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const fileRef = useRef<HTMLInputElement>(null);
    const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
    const [showEtiquetaModal, setShowEtiquetaModal] = useState(false);

    // Fetch etiquetas
    useEffect(() => {
        supabase.from("etiquetas").select("*").order("nombre").then(({ data }) => {
            if (data) setEtiquetas(data as Etiqueta[]);
        });
    }, []);

    // Dólar blue (shared hook with cache)
    const { rate: blueRate, loading: blueLoading } = useBlueRate();

    // ARS calculado en tiempo real desde el USD ingresado
    const arsPreview = blueRate && form.precio_usd
        ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 })
            .format(Math.round(Number(form.precio_usd) * blueRate))
        : null;

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        setImages((prev) => [...prev, ...files]);
        const urls = files.map((f) => URL.createObjectURL(f));
        setPreviews((prev) => [...prev, ...urls]);
    };

    const removeImage = (i: number) => {
        setImages((prev) => prev.filter((_, idx) => idx !== i));
        setPreviews((prev) => prev.filter((_, idx) => idx !== i));
    };

    const handleField = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    };

    async function uploadImage(file: File): Promise<string> {
        const ext = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
            .from("productos-imagenes")
            .upload(fileName, file, { upsert: false });

        if (error) throw new Error(`Upload error: ${error.message}`);

        const { data } = supabase.storage
            .from("productos-imagenes")
            .getPublicUrl(fileName);

        return data.publicUrl;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus("idle");
        setErrorMsg("");

        try {
            // Delete images removed by the user from Supabase Storage
            if (editProduct?.fotos?.length) {
                const removedUrls = editProduct.fotos.filter(url => !keptFotos.includes(url));
                if (removedUrls.length > 0) {
                    const filenames = removedUrls
                        .map(url => {
                            const match = url.match(/productos-imagenes\/([^?]+)/);
                            return match ? match[1] : null;
                        })
                        .filter(Boolean) as string[];
                    if (filenames.length > 0) {
                        await supabase.storage.from("productos-imagenes").remove(filenames);
                    }
                }
            }

            // Upload new images
            const newUrls: string[] = await Promise.all(images.map(uploadImage));
            const fotos = [...keptFotos, ...newUrls];

            const payload = {
                modelo: form.modelo.trim(),
                color: form.color.trim(),
                capacidad: form.capacidad,
                precio_usd: Math.round(parseInt(form.precio_usd, 10) || 0),
                // También guardamos precio (ARS) usando la tasa del día para que componentes legacy funcionen
                precio: blueRate ? Math.round(parseInt(form.precio_usd, 10) * blueRate) : 0,
                salud_bateria: Number(form.salud_bateria),
                estado: form.estado,
                detalles: form.detalles.trim(),
                fotos,
                vendido: editProduct?.vendido ?? false,
                etiqueta_id: form.etiqueta_id || null,
            };

            if (editProduct) {
                const { error } = await supabase
                    .from("iphones")
                    .update(payload)
                    .eq("id", editProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("iphones").insert(payload);
                if (error) throw error;
            }

            setStatus("success");
            if (!editProduct) {
                setForm(initialForm);
                setImages([]);
                setPreviews([]);
            }
            onSuccess?.();
        } catch (err: unknown) {
            console.error(err);
            setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition";

    return (
        <form onSubmit={handleSubmit} className="space-y-5 pb-6 sm:pb-0">
            {/* Modelo + Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                        Modelo *
                    </label>
                    <input
                        name="modelo"
                        value={form.modelo}
                        onChange={handleField}
                        placeholder="iPhone 14 Pro Max"
                        required
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                        Color *
                    </label>
                    <input
                        name="color"
                        value={form.color}
                        onChange={handleField}
                        placeholder="Space Black"
                        required
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Capacidad + Estado */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                        Capacidad
                    </label>
                    <select name="capacidad" value={form.capacidad} onChange={handleField} className={inputClass}>
                        {["64GB", "128GB", "256GB", "512GB", "1TB"].map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                        Estado
                    </label>
                    <select name="estado" value={form.estado} onChange={handleField} className={inputClass}>
                        {["Nuevo", "Usado", "Outlet"].map((e) => (
                            <option key={e} value={e}>{e}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Precio */}
            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-500">Precio *</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                        {blueLoading ? (
                            <span className="animate-pulse">Cargando cotización...</span>
                        ) : blueRate ? (
                            <>
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
                                Dólar blue: <strong className="text-slate-600">${blueRate.toLocaleString("es-AR")}</strong>
                            </>
                        ) : (
                            <span className="text-amber-500">Sin cotización blue</span>
                        )}
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {/* USD — campo principal */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                            USD $
                        </span>
                        <input
                            name="precio_usd"
                            value={form.precio_usd}
                            onChange={handleField}
                            onFocus={(e) => e.target.select()}
                            type="number"
                            placeholder="250"
                            required
                            min={0}
                            step={1}
                            className={`${inputClass} pl-12`}
                        />
                    </div>
                    {/* ARS — solo lectura, calculado en tiempo real */}
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                            ARS $
                        </span>
                        <input
                            value={arsPreview ? arsPreview.replace("$\u00a0", "").replace("ARS\u00a0", "") : ""}
                            readOnly
                            tabIndex={-1}
                            placeholder={blueRate ? "automático" : "sin cotización"}
                            className={`${inputClass} pl-12 bg-slate-50 text-slate-400 cursor-not-allowed`}
                        />
                    </div>
                </div>
                {arsPreview && (
                    <p className="text-xs text-slate-400 mt-1.5">
                        ≈ <strong className="text-slate-600">{arsPreview}</strong> al blue de hoy
                    </p>
                )}
            </div>


            {/* Batería + Ciclos */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">
                        Salud bat. %
                    </label>
                    <input
                        name="salud_bateria"
                        value={form.salud_bateria}
                        onChange={handleField}
                        type="number"
                        placeholder="89"
                        min={0}
                        max={100}
                        className={inputClass}
                    />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-500">Etiqueta</label>
                        <button
                            type="button"
                            onClick={() => setShowEtiquetaModal(true)}
                            className="flex items-center gap-1 text-xs text-sky-500 hover:text-sky-700 font-medium"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Crear etiqueta
                        </button>
                    </div>
                    <select
                        name="etiqueta_id"
                        value={form.etiqueta_id}
                        onChange={handleField}
                        className={inputClass}
                    >
                        <option value="">Sin etiqueta</option>
                        {etiquetas.map((et) => (
                            <option key={et.id} value={et.id}>
                                {et.nombre}
                            </option>
                        ))}
                    </select>
                    {form.etiqueta_id && (() => {
                        const et = etiquetas.find(e => e.id === form.etiqueta_id);
                        return et ? (
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: et.color + "25", color: et.color }}>
                                    {et.nombre}
                                </span>
                                <span className="text-xs text-slate-400">Así se verá en la card</span>
                            </div>
                        ) : null;
                    })()}
                </div>
            </div>

            {/* Detalles */}
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Detalles técnicos / estéticos
                </label>
                <textarea
                    name="detalles"
                    value={form.detalles}
                    onChange={handleField}
                    placeholder="Rayón leve en esquina trasera. Face ID 100%. Todas las cámaras funcionan perfectamente..."
                    rows={4}
                    className={cn(inputClass, "resize-none")}
                />
            </div>



            {showEtiquetaModal && (
                <EtiquetaModal
                    onClose={() => setShowEtiquetaModal(false)}
                    onCreated={(nueva) => {
                        setEtiquetas((prev) => [...prev, nueva].sort((a, b) => a.nombre.localeCompare(b.nombre)));
                        setForm((f) => ({ ...f, etiqueta_id: nueva.id }));
                    }}
                />
            )}

            {/* Images */}
            <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Fotos
                </label>
                <div className="flex flex-wrap gap-3">
                    {/* Existing saved photos — can be removed */}
                    {keptFotos.map((url, i) => (
                        <div key={`existing-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setKeptFotos(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow"
                                title="Eliminar foto"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    ))}
                    {/* New pending photos */}
                    {previews.map((url, i) => (
                        <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-sky-300">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Nueva ${i}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                className="absolute top-0.5 right-0.5 w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center"
                            >
                                <X className="w-3 h-3 text-white" />
                            </button>
                            {/* "Nueva" badge */}
                            <span className="absolute bottom-0 left-0 right-0 bg-sky-500/80 text-white text-[9px] text-center py-0.5">Nueva</span>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-sky-400 hover:text-sky-500 transition-colors"
                    >
                        <ImagePlus className="w-5 h-5" />
                        <span className="text-xs">Agregar</span>
                    </button>
                </div>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                />
            </div>

            {/* Submit */}
            <button
                type="submit"
                disabled={loading}
                className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium text-sm transition-colors",
                    loading
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-slate-900 hover:bg-slate-700 text-white"
                )}
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                    </>
                ) : (
                    <>
                        <Upload className="w-4 h-4" />
                        {editProduct ? "Actualizar iPhone" : "Publicar iPhone"}
                    </>
                )}
            </button>

            {/* Feedback */}
            {status === "success" && (
                <div className="flex items-center gap-2 text-emerald-600 text-sm bg-emerald-50 px-4 py-3 rounded-2xl">
                    <CheckCircle className="w-4 h-4" />
                    ¡iPhone guardado exitosamente!
                </div>
            )}
            {status === "error" && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-2xl">
                    <XCircle className="w-4 h-4" />
                    {errorMsg || "Error al guardar. Revisá la consola."}
                </div>
            )}
        </form>
    );
}
