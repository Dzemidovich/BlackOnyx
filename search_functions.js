const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'wwwroot', 'index.html');
const content = fs.readFileSync(filePath, 'utf8');

// Find all onclick events that call app. functions
const regex = /onclick="app\.([^"]+)"/g;
const matches = [];
let match;

while ((match = regex.exec(content)) !== null) {
    matches.push(match[1]);
}

console.log('Found function calls:');
console.log(matches);

// Find all app. function definitions
const appFunctionRegex = /app\.[a-zA-Z0-9_]+ = function|app\.[a-zA-Z0-9_]+\s*=\s*\(/g;
const functionDefinitions = [];

const appObjectRegex = /const app = \{([\s\S]*?)\};/g;
const appMatch = appObjectRegex.exec(content);
if (appMatch) {
    const appContent = appMatch[1];
    const functionDefRegex = /([a-zA-Z0-9_]+)\s*:?\s*function|([a-zA-Z0-9_]+)\s*:?\s*\(/g;
    let functionMatch;
    
    while ((functionMatch = functionDefRegex.exec(appContent)) !== null) {
        const functionName = functionMatch[1] || functionMatch[2];
        if (functionName && !['const', 'let', 'var', 'if', 'else', 'for', 'while', 'switch', 'case', 'default', 'return', 'break', 'continue'].includes(functionName.toLowerCase())) {
            functionDefinitions.push(functionName);
        }
    }
}

console.log('\nFound function definitions:');
console.log(functionDefinitions);

// Find missing functions
const missingFunctions = matches.filter(func => !functionDefinitions.includes(func.split('(')[0]));
if (missingFunctions.length > 0) {
    console.log('\nMissing functions:');
    console.log(missingFunctions);
} else {
    console.log('\nAll functions are defined');
}