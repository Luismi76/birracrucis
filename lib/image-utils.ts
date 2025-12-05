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
export async function compressImage(
    file: File,
    options: CompressOptions = {}
): Promise<string> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                // Calcular dimensiones manteniendo proporción
                let { width, height } = img;
                const ratio = width / height;

                if (width > opts.maxWidth) {
                    width = opts.maxWidth;
                    height = width / ratio;
                }

                if (height > opts.maxHeight) {
                    height = opts.maxHeight;
                    width = height * ratio;
                }

                // Crear canvas y comprimir
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject(new Error("No se pudo crear contexto de canvas"));
                    return;
                }

                // Usar mejor calidad de interpolación
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a dataURL
                const mimeType = opts.format === "webp" ? "image/webp" : "image/jpeg";
                const dataUrl = canvas.toDataURL(mimeType, opts.quality);

                resolve(dataUrl);
            };

            img.onerror = () => {
                reject(new Error("Error al cargar imagen"));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error("Error al leer archivo"));
        };

        reader.readAsDataURL(file);
    });
}

/**
 * Añade una marca de agua (texto) a una imagen
 * @param dataUrl DataURL de la imagen
 * @param text Texto de la marca de agua
 * @returns Promise con el dataURL de la imagen con marca de agua
 */
export async function addWatermark(
    dataUrl: string,
    text: string
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

            // Dibujar la imagen original
            ctx.drawImage(img, 0, 0);

            // Configurar el estilo de la marca de agua
            const fontSize = Math.max(20, Math.floor(img.width / 25));
            ctx.font = `bold ${fontSize}px Arial, sans-serif`;

            // Medir el texto para crear el fondo
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const textHeight = fontSize;

            // Posición (esquina inferior derecha con margen)
            const padding = 15;
            const x = img.width - textWidth - padding * 2;
            const y = img.height - padding * 2;

            // Dibujar fondo semi-transparente
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(
                x - padding,
                y - textHeight - padding,
                textWidth + padding * 2,
                textHeight + padding * 2
            );

            // Dibujar el texto
            ctx.fillStyle = "#ffffff";
            ctx.textBaseline = "top";
            ctx.fillText(text, x, y - textHeight);

            // Convertir a dataURL
            const watermarkedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
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
