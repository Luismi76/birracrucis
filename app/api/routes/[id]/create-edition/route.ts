import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const { id: templateId } = await params;

        // Verificar que la plantilla existe y el usuario tiene acceso
        const template = await prisma.route.findUnique({
            where: { id: templateId },
            include: {
                stops: {
                    orderBy: { order: "asc" },
                },
            },
        });

        if (!template) {
            return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
        }

        // Verificar que el usuario es el creador o la plantilla es pública
        if (template.creatorId !== user.id && !template.isPublic) {
            return NextResponse.json({ error: "No tienes acceso a esta plantilla" }, { status: 403 });
        }

        const body = await req.json();

        // Validar campos requeridos para una edición
        if (!body.date) {
            return NextResponse.json({ error: "La fecha es requerida para crear una edición" }, { status: 400 });
        }

        // Crear la nueva edición
        const edition = await prisma.route.create({
            data: {
                name: body.name || template.name,
                date: new Date(body.date),
                creatorId: user.id,

                // Configuración de tiempo
                startMode: body.startMode || template.startMode || "manual",
                startTime: body.startTime ? new Date(body.startTime) : template.startTime,
                endTime: body.endTime ? new Date(body.endTime) : template.endTime,
                hasEndTime: body.hasEndTime ?? template.hasEndTime,

                // Sistema de bote
                potEnabled: body.potEnabled ?? template.potEnabled,
                potAmountPerPerson: body.potAmountPerPerson ?? template.potAmountPerPerson,

                // Relación con la plantilla
                isTemplate: false, // Las ediciones NO son plantillas
                templateId: templateId,

                // Copiar descripción si existe
                description: body.description || template.description,

                // Estado inicial
                status: "pending",

                // Crear las paradas copiadas de la plantilla
                stops: {
                    create: template.stops.map((stop) => ({
                        name: stop.name,
                        address: stop.address,
                        lat: stop.lat,
                        lng: stop.lng,
                        order: stop.order,
                        plannedRounds: stop.plannedRounds,
                        maxRounds: stop.maxRounds,
                        googlePlaceId: stop.googlePlaceId,
                        stayDuration: stop.stayDuration,
                        walkTimeToNext: stop.walkTimeToNext,
                    })),
                },

                // Añadir al creador como participante
                participants: {
                    create: {
                        userId: user.id,
                        isActive: true,
                    },
                },
            },
            include: {
                stops: true,
                participants: true,
            },
        });

        return NextResponse.json({
            ok: true,
            edition,
            message: "Edición creada exitosamente",
        });
    } catch (error) {
        console.error("Error creating edition:", error);
        return NextResponse.json(
            { error: "Error al crear la edición" },
            { status: 500 }
        );
    }
}
