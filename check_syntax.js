import fs from 'fs';
import {
    spawn
} from 'child_process';

const code = fs.readFileSync('api/index.js', 'utf8');
try {
    new Function(code);
    console.log('Syntax is valid');
} catch (e) {
    console.error('Syntax error:', e);
}