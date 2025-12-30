
import { NextResponse } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import os from 'os'

export async function POST(request: Request) {
    let questionFilePath = '';
    let solutionFilePath = '';

    try {
        const formData = await request.formData()
        const questionFile = formData.get('questionFile') as File
        const solutionFile = formData.get('solutionFile') as File | null

        if (!questionFile) {
            return NextResponse.json({ error: 'No question file uploaded' }, { status: 400 })
        }

        // Save question file to temp
        const tempDir = os.tmpdir()

        const questionBuffer = Buffer.from(await questionFile.arrayBuffer())
        questionFilePath = path.join(tempDir, `question-${Date.now()}.pdf`)
        await writeFile(questionFilePath, questionBuffer)

        // Prepare Python args
        const scriptPath = path.join(process.cwd(), 'scripts', 'parse_pdf.py')
        const pythonArgs = [scriptPath, questionFilePath]

        // If solution file provided, save and add to args
        if (solutionFile) {
            const solutionBuffer = Buffer.from(await solutionFile.arrayBuffer())
            solutionFilePath = path.join(tempDir, `solution-${Date.now()}.pdf`)
            await writeFile(solutionFilePath, solutionBuffer)
            pythonArgs.push(solutionFilePath)
        }

        // Call Python script
        const parseResult = await new Promise<string>((resolve, reject) => {
            const pythonProcess = spawn('python', pythonArgs)

            let outputData = ''
            let errorData = ''

            pythonProcess.stdout.on('data', (data) => {
                outputData += data.toString()
            })

            pythonProcess.stderr.on('data', (data) => {
                errorData += data.toString()
            })

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python Process exited with code ${code}. Error: ${errorData}`))
                } else {
                    resolve(outputData)
                }
            })
        })

        // Clean up temp files
        await unlink(questionFilePath).catch(console.error)
        if (solutionFilePath) {
            await unlink(solutionFilePath).catch(console.error)
        }

        // Parse JSON output from Python
        try {
            const result = JSON.parse(parseResult)

            if (result.success) {
                return NextResponse.json({
                    success: true,
                    count: result.count,
                    questions: result.questions
                })
            } else {
                return NextResponse.json(
                    { error: result.error || 'Unknown Python error' },
                    { status: 500 }
                )
            }
        } catch (e) {
            console.error('Failed to parse Python JSON output:', parseResult)
            return NextResponse.json(
                { error: 'Invalid response from parser' },
                { status: 500 }
            )
        }

    } catch (error) {
        console.error('PDF Parse Error:', error)

        // Ensure cleanup
        if (questionFilePath) {
            await unlink(questionFilePath).catch(() => { })
        }
        if (solutionFilePath) {
            await unlink(solutionFilePath).catch(() => { })
        }

        return NextResponse.json(
            { error: 'Failed to process PDF' },
            { status: 500 }
        )
    }
}
