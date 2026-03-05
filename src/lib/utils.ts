import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(price);
}

export function getBatteryColor(level: number): string {
    if (level >= 90) return "bg-emerald-100 text-emerald-700";
    if (level >= 80) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
}

export function getWhatsAppLink(modelo: string, precio: number, capacidad: string): string {
    const numero = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5491112345678";
    const mensaje = encodeURIComponent(
        `¡Hola! Me interesa el ${modelo} ${capacidad} que vi en DigicoWorld. ¿Está disponible?`
    );
    return `https://wa.me/${numero}?text=${mensaje}`;
}
