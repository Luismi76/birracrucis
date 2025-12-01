import { Client } from "minio";

// Cliente MinIO singleton
let minioClient: Client | null = null;

export function getMinioClient(): Client {
    if (!minioClient) {
        const endPoint = process.env.MINIO_ENDPOINT || "localhost";
        const port = parseInt(process.env.MINIO_PORT || "9000");
        const useSSL = process.env.MINIO_USE_SSL === "true";

        minioClient = new Client({
            endPoint,
            port,
            useSSL,
            accessKey: process.env.MINIO_ACCESS_KEY || "",
            secretKey: process.env.MINIO_SECRET_KEY || "",
        });
    }
    return minioClient;
}

export const BUCKET_NAME = process.env.MINIO_BUCKET || "birracrucis";

/**
 * Asegura que el bucket existe, si no lo crea
 */
export async function ensureBucket(): Promise<void> {
    const client = getMinioClient();
    const exists = await client.bucketExists(BUCKET_NAME);

    if (!exists) {
        await client.makeBucket(BUCKET_NAME);
        console.log(`Bucket '${BUCKET_NAME}' creado`);

        // Configurar política pública para lectura
        const policy = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
                },
            ],
        };
        await client.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
        console.log(`Política pública configurada para '${BUCKET_NAME}'`);
    }
}

/**
 * Sube una imagen desde base64 a MinIO
 * @returns URL pública de la imagen
 */
export async function uploadImage(
    base64Data: string,
    fileName: string
): Promise<string> {
    const client = getMinioClient();

    // Extraer el contenido base64 (quitar el prefijo data:image/...)
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error("Formato de imagen inválido");
    }

    const extension = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, "base64");

    // Generar nombre único
    const objectName = `photos/${fileName}.${extension}`;

    // Subir a MinIO
    await client.putObject(BUCKET_NAME, objectName, buffer, buffer.length, {
        "Content-Type": `image/${extension}`,
        "Cache-Control": "public, max-age=31536000", // Cache 1 año
    });

    // Construir URL pública
    const baseUrl = process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
    return `${baseUrl}/${BUCKET_NAME}/${objectName}`;
}

/**
 * Elimina una imagen de MinIO
 */
export async function deleteImage(imageUrl: string): Promise<void> {
    const client = getMinioClient();

    // Extraer el nombre del objeto de la URL
    const urlParts = imageUrl.split(`/${BUCKET_NAME}/`);
    if (urlParts.length !== 2) {
        console.warn("URL de imagen no válida para eliminar:", imageUrl);
        return;
    }

    const objectName = urlParts[1];
    await client.removeObject(BUCKET_NAME, objectName);
}

/**
 * Verifica si una URL es de MinIO (no base64)
 */
export function isMinioUrl(url: string): boolean {
    return url.startsWith("http") && !url.startsWith("data:");
}
