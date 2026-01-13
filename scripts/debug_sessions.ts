
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    const sessions = await prisma.examSession.findMany({
        // You might want to filter by a specific user if you know the ID, 
        // or just list all to see anomalies.
        // For now, let's list all or filter by the user from the screenshot if known (User ID 2 likely)
        orderBy: { startTime: 'desc' },
        take: 50
    });

    console.log("Found sessions:", sessions.length);

    for (const s of sessions) {
        const score = Number(s.totalScore || 0);
        const count = s.questionCount || 0;
        const scale10 = count > 0 ? (score / count) * 10 : 0;

        console.log(`ID: ${s.id} | User: ${s.userId} | Cat: ${s.categoryId} | Score: ${score} | Count: ${count} | Scale10: ${scale10.toFixed(2)}`);

        if (scale10 > 10) {
            console.warn("  >>> ANOMALY DETECTED: Score > 10");
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
