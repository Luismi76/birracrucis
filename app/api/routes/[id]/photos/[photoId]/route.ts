import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; photoId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
        }

        const { id: routeId, photoId } = await params;

        // Obtener usuario actual
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
        }

        // Buscar la foto
        const photo = await prisma.photo.findUnique({
            where: { id: photoId },
        });

        if (!photo) {
            return NextResponse.json({ ok: false, error: "Foto no encontrada" }, { status: 404 });
        }

        // Verificar propiedad (solo el dueño puede borrar)
        if (photo.userId !== user.id) {
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
