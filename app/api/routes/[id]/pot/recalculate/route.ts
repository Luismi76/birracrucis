import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Recalcular totalSpent sumando todas las transacciones
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Sumar todas las transacciones
        const transactions = await prisma.potTransaction.findMany({
            where: { routeId: id },
        });

        const calculatedSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Actualizar totalSpent
        await prisma.route.update({
            where: { id },
            data: { potTotalSpent: calculatedSpent },
        });

        return NextResponse.json({
            ok: true,
            message: "Pot spending recalculated",
            oldSpent: 0,
            newSpent: calculatedSpent,
            transactionsCount: transactions.length,
        });
    } catch (error) {
        console.error("Error recalculating pot:", error);
        return NextResponse.json(
            { ok: false, error: "Error recalculating pot" },
            { status: 500 }
        );
    }
}
