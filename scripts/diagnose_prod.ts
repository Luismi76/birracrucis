import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const routeId = 'cmiyufj0x0001jv04m49vo4fm'; // ID from user logs
    console.log(`Checking route ${routeId} in production DB...`);

    try {
        const route = await prisma.route.findUnique({
            where: { id: routeId },
            include: {
                participants: true,
                potContributions: true, // Corrected from 'contributions'
            },
        });

        if (!route) {
            console.log('Route NOT FOUND');
            return;
        }

        console.log('Route found:', {
            id: route.id,
            potEnabled: route.potEnabled,
            potAmountPerPerson: route.potAmountPerPerson,
            potTotalSpent: route.potTotalSpent,
            participantCount: route.participants.length
        });

        console.log('Fetching transactions...');
        try {
            const transactions = await prisma.potTransaction.findMany({
                where: { routeId: routeId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });

            console.log('Transactions found:', transactions.length);
            if (transactions.length > 0) {
                console.log('First transaction:', transactions[0]);
            }
        } catch (txError) {
            console.error('Error fetching transactions (maybe table missing?):', txError);
        }

    } catch (error) {
        console.error('ERROR OCCURRED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
