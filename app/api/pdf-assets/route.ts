import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, storagePath, pageCount } = body;

        const asset = await prisma.pdfAsset.create({
            data: {
                title,
                storagePath,
                pageCount: pageCount ?? null,
                status: "ready"
            },
        });

        return NextResponse.json({ asset });
    } catch (error) {
        console.error("Error creating PDF asset:", error);
        return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const assets = await prisma.pdfAsset.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json({ assets });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }
}
