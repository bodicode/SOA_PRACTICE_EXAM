const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('edu-exam-p-sample-quest (2024).pdf');

pdf(dataBuffer).then(function (data) {
    console.log('--- START TEXT ---');
    console.log(data.text.substring(0, 5000));
    console.log('--- END TEXT ---');
}).catch(function (error) {
    console.error('Error:', error);
});
