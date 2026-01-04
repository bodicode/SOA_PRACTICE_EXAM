import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { pdfAssetId, questionNo, pageIndex, x, y, w, h, correctAnswer, textContent, solutionText, category, options } = body;

        if (!pdfAssetId || !questionNo) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Map category (string or number from frontend) to categoryId
        let categoryId: number | null = null;
        if (typeof category === 'number') {
            categoryId = category;
        } else if (typeof category === 'string' && !isNaN(parseInt(category))) {
            categoryId = parseInt(category);
        }
        // If category is a string name (e.g. "P"), we might need to lookup logic, but for now let's assume ID is passed or handled elsewhere. 
        // Based on previous context, the user wants `categoryId` relation.

        // Construct data object
        const data: any = {
            pdfAssetId, questionNo, pageIndex, x, y, w, h, correctAnswer, textContent, solutionText, options
        }
        if (categoryId !== null) data.categoryId = categoryId;


        if (x !== undefined && y !== undefined) {
            // Full update/create (from Detector)
            const q = await prisma.pdfRegionQuestion.upsert({
                where: { pdfAssetId_questionNo: { pdfAssetId, questionNo } },
                update: { ...data },
                create: { ...data },
            });
            return NextResponse.json({ question: q });
        } else {
            // Partial update
            const dataToUpdate: any = {};
            if (correctAnswer !== undefined) dataToUpdate.correctAnswer = correctAnswer;
            if (textContent !== undefined) dataToUpdate.textContent = textContent;
            if (solutionText !== undefined) dataToUpdate.solutionText = solutionText;
            if (categoryId !== null) dataToUpdate.categoryId = categoryId;
            if (options !== undefined) dataToUpdate.options = options;

            const q = await prisma.pdfRegionQuestion.updateMany({
                where: { pdfAssetId, questionNo },
                data: dataToUpdate
            });
            return NextResponse.json({ updated: q.count });
        }
    } catch (error) {
        console.error("Error saving PDF question:", error);
        return NextResponse.json({ error: "Failed to save question" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const pdfAssetId = searchParams.get("pdfAssetId");

    if (!pdfAssetId) {
        return NextResponse.json({ error: "Missing pdfAssetId" }, { status: 400 });
    }

    try {
        const questions = await prisma.pdfRegionQuestion.findMany({
            where: { pdfAssetId },
            orderBy: { questionNo: 'asc' }
        });
        return NextResponse.json({ questions });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }
}
