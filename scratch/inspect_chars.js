const fs = require('fs');
const content = fs.readFileSync('c:/Users/diemo/Desktop/Apps/santisoft-automatizacion/src/app/automatizacion-rrss/panel/page.tsx', 'utf8');
const lines = content.split('\n');

const line649 = lines[648]; // 0-indexed
const line650 = lines[649];
const line651 = lines[650];

console.log('649:', line649, line649.split('').map(c => c.charCodeAt(0)));
console.log('650:', line650, line650.split('').map(c => c.charCodeAt(0)));
console.log('651:', line651, line651.split('').map(c => c.charCodeAt(0)));
