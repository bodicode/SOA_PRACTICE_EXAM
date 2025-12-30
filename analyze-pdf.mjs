import fs from 'fs';
import pdf from 'pdf-parse';

const dataBuffer = fs.readFileSync('edu-exam-p-sample-quest (2024).pdf');

pdf(dataBuffer).then(function (data) {
    console.log('Number of pages:', data.numpages);
    console.log('Text content start:');
    console.log(data.text.substring(0, 3000));
}).catch(err => console.error(err));
