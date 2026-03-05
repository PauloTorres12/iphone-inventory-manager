export interface Etiqueta {
    id: string;
    nombre: string;
    slug: string;
    color: string; // hex, ej: '#10b981'
    created_at?: string;
}

export interface iPhone {
    id: string;
    modelo: string;        // "iPhone 14 Pro Max"
    color: string;
    capacidad: string;     // "256GB"
    precio: number;        // ARS (legacy / calculado al vuelo)
    precio_usd: number;    // USD fijo — fuente de verdad

    salud_bateria: number; // 87 (%)
    ciclos: number;        // 210
    estado: "Nuevo" | "Usado" | "Outlet";
    detalles: string;
    fotos: string[];       // URLs de Supabase Storage
    vendido: boolean;
    etiqueta_id?: string | null;
    etiqueta?: Etiqueta | null; // join desde Supabase
    created_at?: string;
}

export type EstadoFilter = "Todos" | "Nuevo" | "Usado" | "Outlet";
export type ModeloFilter = "Todos" | "11" | "12" | "13" | "14" | "15" | "16";
