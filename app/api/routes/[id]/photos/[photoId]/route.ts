import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    try {
        const auth = await getAuthenticatedUser(req);
        if (!auth.ok) {
            return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
        }

        const { id: routeId, photoId } = await params;

        // Buscar la foto
        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
        });

        if (!photo) {
            return NextResponse.json({ ok: false, error: "Foto no encontrada" }, { status: 404 });
        }

        // Verificar propiedad (solo el dueño puede borrar)
        if (photo.userId !== auth.user.id) {
            return NextResponse.json({ ok: false, error: "No tienes permiso para borrar esta foto" }, { status: 403 });
        }

        // Eliminar de base de datos
        await prisma.photo.delete({
            where: { id: photoId },
        });

        // TODO: Eliminar de MinIO si es necesario (limpieza de huérfanos)

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error en DELETE /api/routes/[id]/photos/[photoId]:", error);
        return NextResponse.json({ ok: false, error: "Error al eliminar foto" }, { status: 500 });
    }
}
