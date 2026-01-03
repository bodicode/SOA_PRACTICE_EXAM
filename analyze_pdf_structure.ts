import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import fs from "fs";

async function run() {
    const pdfPath = "d:\\Web_Project\\Make Money\\SOA_PRACTICE_EXAM\\edu-exam-p-sample-sol (2024).pdf";
    const data = new Uint8Array(fs.readFileSync(pdfPath));

    const loadingTask = pdfjs.getDocument({
        data: data,
        fontExtraProperties: true,
    });

    const pdf = await loadingTask.promise;
    console.log(`PDF Loaded. Pages: ${pdf.numPages}`);

    for (let i = 0; i < Math.min(3, pdf.numPages); i++) {
        const page = await pdf.getPage(i + 1);
        const textContent = await page.getTextContent();

        console.log(`\n--- Page ${i + 1} ---`);

        // Sort items by Y (descending) then X (ascending)
        const items = textContent.items.map((item: any) => ({
            str: item.str,
            x: item.transform[4],
            y: item.transform[5]
        }));

        items.sort((a: any, b: any) => {
            if (Math.abs(a.y - b.y) > 5) return b.y - a.y; // Different lines (top to bottom)
            return a.x - b.x; // Same line (left to right)
        });

        // Group into lines
        let currentY = -1;
        let lineText = "";

        items.forEach((item: any) => {
            // If significantly different Y (new line)
            if (currentY !== -1 && (currentY - item.y) > 8) {
                console.log(lineText);
                lineText = "";
            }
            currentY = item.y;
            lineText += item.str + " ";
        });
        console.log(lineText);
    }
}

run();
