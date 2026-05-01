const fs = require('fs');
const content = fs.readFileSync('c:/Users/diemo/Desktop/Apps/santisoft-automatizacion/src/app/automatizacion-rrss/panel/page.tsx', 'utf8');

let braces = 0;
let parens = 0;
let brackets = 0;

for (let i = 0; i < content.length; i++) {
    if (content[i] === '{') braces++;
    if (content[i] === '}') braces--;
    if (content[i] === '(') parens++;
    if (content[i] === ')') parens--;
    if (content[i] === '[') brackets++;
    if (content[i] === ']') brackets--;
}

console.log('Braces:', braces);
console.log('Parens:', parens);
console.log('Brackets:', brackets);
