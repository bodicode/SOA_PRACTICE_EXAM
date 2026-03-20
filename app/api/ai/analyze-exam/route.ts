import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function POST(req: Request) {
    try {
        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
        }

        if (!GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 });
        }

        // 1. Fetch Exam Session with Details and Questions
        const session = await prisma.examSession.findUnique({
            where: { id: sessionId },
            include: {
                details: {
                    include: {
                        question: true,
                        pdfQuestion: true
                    }
                },
                category: true
            }
        });

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        // 2. Filter Incorrect Questions
        const incorrectDetails = session.details.filter(
            (d) => d.isCorrect === false && (d.question || d.pdfQuestion)
        );

        if (incorrectDetails.length === 0) {
            return NextResponse.json({
                analysis: "🎉 Great job! You answered all questions correctly. Keep up the good work!"
            });
        }

        // 3. Construct Prompt for Gemini
        let prompt = `Phân tích lỗi sai của học sinh trong bài thi ${session.category?.name || 'General'}.\n\n`;
        prompt += `Học sinh đạt ${session.totalScore}/${session.questionCount} câu đúng.\n\n`;
        prompt += `Dưới đây là các câu trả lời sai:\n\n`;

        // Helper to convert number to letter (0 -> A, 1 -> B, etc.)
        const numToLetter = (num: string | number | null): string => {
            if (num === null || num === undefined) return 'Không trả lời';
            const n = typeof num === 'string' ? parseInt(num) : num;
            if (isNaN(n) || n < 0 || n > 4) return String(num);
            return ['A', 'B', 'C', 'D', 'E'][n];
        };

        incorrectDetails.forEach((detail, index) => {
            const q = detail.question || detail.pdfQuestion;
            if (!q) return;

            const content = 'content' in q ? q.content : (q as any).textContent || 'Image/PDF Question';
            const userChoice = numToLetter(detail.userChoice);
            const correctOption = 'correctOption' in q
                ? numToLetter(q.correctOption)
                : (q as any).correctAnswer || 'N/A';
            const explanation = 'explanation' in q ? q.explanation : (q as any).solutionText;

            prompt += `Câu ${index + 1}: ${content}\n`;
            prompt += `Đáp án của học sinh: ${userChoice}\n`;
            prompt += `Đáp án đúng: ${correctOption}\n`;
            if (explanation) {
                prompt += `Giải thích: ${explanation}\n`;
            }
            prompt += `\n`;
        });

        prompt += `\nHãy phân tích ngắn gọn các lỗi sai. Giải thích *tại sao* đáp án của học sinh sai và làm rõ khái niệm đúng. Tập trung giúp học sinh hiểu nguyên lý cơ bản. Trả lời bằng tiếng Việt, định dạng Markdown.`;

        // 4. Call Gemini API via REST
        const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.json();
            console.error('Gemini API Error:', errorData);
            return NextResponse.json({
                error: 'Failed to call Gemini API',
                details: errorData
            }, { status: geminiResponse.status });
        }

        const geminiData = await geminiResponse.json();
        const analysis = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis generated.';

        // 5. Save Analysis to Database (optional - skip if type issue persists)
        try {
            await prisma.$executeRaw`UPDATE "ExamSession" SET "aiAnalysis" = ${analysis} WHERE id = ${sessionId}`;
        } catch (dbError) {
            console.warn('Could not save analysis to database:', dbError);
        }

        return NextResponse.json({ analysis });

    } catch (error: any) {
        console.error('Error analyzing exam:', error);
        return NextResponse.json({ error: 'Failed to analyze exam', details: error.message }, { status: 500 });
    }
}
