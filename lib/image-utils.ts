/**
 * Utilidades para optimización de imágenes
 */

type CompressOptions = {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0-1
    format?: "jpeg" | "webp";
};

const DEFAULT_OPTIONS: Required<CompressOptions> = {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.8,
    format: "jpeg",
};

/**
 * Comprime una imagen manteniendo la relación de aspecto
 * @param file Archivo de imagen original
 * @param options Opciones de compresión
 * @returns Promise con el dataURL de la imagen comprimida
 */
import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen manteniendo la relación de aspecto usando browser-image-compression
 * @param file Archivo de imagen original
 * @param options Opciones de compresión
 * @returns Promise con el dataURL de la imagen comprimida
 */
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    try {
        const compressionOptions = {
            maxSizeMB: 1, // Default limit, can be adjusted
            maxWidthOrHeight: Math.max(opts.maxWidth, opts.maxHeight),
            useWebWorker: true,
            initialQuality: opts.quality,
            fileType: opts.format === 'webp' ? 'image/webp' : 'image/jpeg',
        };

        const compressedFile = await imageCompression(file, compressionOptions);

        return await imageCompression.getDataUrlFromFile(compressedFile);
    } catch (error) {
        console.warn("Error con browser-image-compression, usando fallback canvas:", error);
        // Fallback simple o re-throw
        throw error;
    }
}

/**
 * Añade una marca de agua (texto) a una imagen
 * @param dataUrl DataURL de la imagen
 * @param text Texto de la marca de agua
 * @returns Promise con el dataURL de la imagen con marca de agua
 */
/**
 * Opciones para la marca de agua
 */
type WatermarkOptions = {
    appName?: string;
    routeName: string;
    stopName?: string;
};

/**
 * Añade una marca de agua premium a una imagen
 * @param dataUrl DataURL de la imagen
 * @param options Opciones de texto para la marca de agua
 * @returns Promise con el dataURL de la imagen con marca de agua
 */
export async function addWatermark(
    dataUrl: string,
    options: WatermarkOptions
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("No se pudo crear contexto de canvas"));
                return;
            }

            // 1. Configurar contexto y filtros "Vivid"
            ctx.filter = "saturate(1.3) contrast(1.1) brightness(1.05)";

            // Opcional: Bordes redondeados "quemados" en la imagen (estilo tarjeta)
            // Para que funcione en JPEG (sin transparencia), necesitamos un color de fondo (negro o blanco).
            // Pero el usuario pidió "bordes redondeados", que puede ser solamento visual.
            // Sin embargo, para darle un toque "procesado", podemos hacer un recorte suave
            // o simplemente aplicar el filtro.
            // Vamos a aplicar solo el filtro Vivid aquí para asegurar calidad.

            ctx.drawImage(img, 0, 0);
            ctx.filter = "none"; // Reset filter for text/overlays

            const w = img.width;
            const h = img.height;

            // Escalar tamaños de fuente relativos al ancho de imagen
            const baseSize = w / 25; // Base scaling unit
            const titleSize = baseSize * 1.5;
            const subtitleSize = baseSize * 0.9;
            const detailSize = baseSize * 0.7;

            // 2. Gradients para mejorar legibilidad
            // Top gradient
            const topGrad = ctx.createLinearGradient(0, 0, 0, h * 0.15);
            topGrad.addColorStop(0, "rgba(0,0,0,0.7)");
            topGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, w, h * 0.15);

            // Bottom gradient
            const bottomGrad = ctx.createLinearGradient(0, h * 0.75, 0, h);
            bottomGrad.addColorStop(0, "rgba(0,0,0,0)");
            bottomGrad.addColorStop(1, "rgba(0,0,0,0.8)");
            ctx.fillStyle = bottomGrad;
            ctx.fillRect(0, h * 0.75, w, h * 0.25);

            // 3. Dibujar "Birracrucis" arriba centrado
            ctx.font = `bold ${titleSize}px 'Arial', sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#ffffff";

            // Sombra suave
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.fillText((options.appName || "BIRRACRUCIS").toUpperCase(), w / 2, baseSize);

            // 4. Dibujar información abajo
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            const padding = baseSize;

            // Nombre de la Ruta
            ctx.font = `bold ${subtitleSize}px 'Arial', sans-serif`;
            ctx.fillText(options.routeName, padding, h - padding * 1.8);

            // Nombre del Bar (si existe)
            if (options.stopName) {
                ctx.font = `${detailSize}px 'Arial', sans-serif`;
                ctx.fillStyle = "#e2e8f0"; // slate-200
                // Icono de pin (simulado con texto unicode o simple)
                ctx.fillText(`📍 ${options.stopName}`, padding, h - padding * 0.8);
            }

            // Hashtags generados (opcional, en esquina derecha)
            ctx.textAlign = "right";
            ctx.font = `italic ${detailSize}px 'Arial', sans-serif`;
            ctx.fillStyle = "#fbbf24"; // amber-400
            ctx.fillText("#Birracrucis", w - padding, h - padding);

            // Convertir a dataURL
            const watermarkedDataUrl = canvas.toDataURL("image/jpeg", 0.92);
            resolve(watermarkedDataUrl);
        };

        img.onerror = () => {
            reject(new Error("Error al cargar imagen para marca de agua"));
        };

        img.src = dataUrl;
    });
}

/**
 * Calcula el tamaño de un dataURL en bytes
 */
export function getDataUrlSize(dataUrl: string): number {
    // El dataURL tiene formato: data:image/jpeg;base64,XXXX...
    const base64 = dataUrl.split(",")[1];
    if (!base64) return 0;

    // Base64 tiene 4 chars por cada 3 bytes
    const padding = (base64.match(/=+$/) || [""])[0].length;
    return Math.floor((base64.length * 3) / 4) - padding;
}

/**
 * Formatea tamaño en bytes a formato legible
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Verifica si el navegador soporta WebP
 */
export function supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img.width > 0 && img.height > 0);
        img.onerror = () => resolve(false);
        img.src = "data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
    });
}

/**
 * Genera un thumbnail de baja calidad para previsualización rápida
 */
export async function generateThumbnail(
    file: File,
    size: number = 32
): Promise<string> {
    return compressImage(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.3,
        format: "jpeg",
    });
}
