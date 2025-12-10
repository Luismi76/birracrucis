import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

// GET /api/user/data - Exportar todos los datos del usuario (Derecho de Acceso/Portabilidad)
export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthenticatedUser(req);
        if (!auth.ok) {
            return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
        }

        const user = await prisma.user.findUnique({
            where: { id: auth.user.id },
            include: {
                // Rutas creadas
                createdRoutes: {
                    select: {
                        id: true,
                        name: true,
                        date: true,
                        createdAt: true,
                        status: true,
                    },
                },
                // Participaciones
                participations: {
                    select: {
                        joinedAt: true,
                        route: {
                            select: {
                                id: true,
                                name: true,
                                date: true,
                            },
                        },
                    },
                },
                // Fotos
                photos: {
                    select: {
                        id: true,
                        url: true,
                        caption: true,
                        createdAt: true,
                    },
                },
                // Mensajes
                messages: {
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                    },
                },
                // Valoraciones
                barRatings: {
                    select: {
                        rating: true,
                        comment: true,
                        createdAt: true,
                        stop: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                // Bebidas
                drinks: {
                    select: {
                        type: true,
                        createdAt: true,
                        stop: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                // Badges
                badges: {
                    select: {
                        earnedAt: true,
                        badge: {
                            select: {
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
        }

        // Formatear los datos para exportación
        const exportData = {
            exportDate: new Date().toISOString(),
            profile: {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                settings: {
                    autoCheckinEnabled: user.autoCheckinEnabled,
                    notificationsEnabled: user.notificationsEnabled,
                },
            },
            routesCreated: user.createdRoutes,
            participations: user.participations.map((p) => ({
                routeId: p.route.id,
                routeName: p.route.name,
                routeDate: p.route.date,
                joinedAt: p.joinedAt,
            })),
            photos: user.photos,
            messages: user.messages,
            ratings: user.barRatings.map((r) => ({
                barName: r.stop.name,
                rating: r.rating,
                comment: r.comment,
                createdAt: r.createdAt,
            })),
            drinks: user.drinks.map((d) => ({
                type: d.type,
                barName: d.stop.name,
                createdAt: d.createdAt,
            })),
            badges: user.badges.map((b) => ({
                name: b.badge.name,
                description: b.badge.description,
                earnedAt: b.earnedAt,
            })),
        };

        return NextResponse.json({
            ok: true,
            data: exportData,
        });
    } catch (error) {
        console.error("[User Data Export] Error:", error);
        return NextResponse.json(
            { ok: false, error: "Error al exportar datos" },
            { status: 500 }
        );
    }
}

// DELETE /api/user/data - Eliminar cuenta y todos los datos (Derecho de Supresión)
export async function DELETE(req: NextRequest) {
    try {
        const auth = await getAuthenticatedUser(req);
        if (!auth.ok) {
            return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
        }

        // Verificar confirmación
        const { confirmation } = await req.json();
        if (confirmation !== "ELIMINAR MI CUENTA") {
            return NextResponse.json(
                { ok: false, error: "Confirmacion incorrecta" },
                { status: 400 }
            );
        }

        // Eliminar el usuario (cascade eliminará todos los datos relacionados)
        await prisma.user.delete({
            where: { id: auth.user.id },
        });

        return NextResponse.json({
            ok: true,
            message: "Cuenta y todos los datos eliminados correctamente",
        });
    } catch (error) {
        console.error("[User Delete] Error:", error);
        return NextResponse.json(
            { ok: false, error: "Error al eliminar cuenta" },
            { status: 500 }
        );
    }
}
