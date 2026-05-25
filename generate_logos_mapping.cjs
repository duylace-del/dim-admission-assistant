const fs = require('fs');
const path = require('path');

const logosDir = path.join(__dirname, 'public', 'assets', 'logos');
const outputFile = path.join(__dirname, 'src', 'data', 'logos.ts');

const files = fs.readdirSync(logosDir);

let importStatements = '';
let exportObject = 'export const universityLogos: Record<string, string> = {\n';

files.forEach((file, index) => {
    const varName = `logo_${index}`;
    const ext = path.extname(file);
    const fileName = path.basename(file, ext);
    
    // We only need to import each unique university logo
    // Some have both png and svg, we'll prefer svg if both exist
    importStatements += `import ${varName} from '../../public/assets/logos/${file}';\n`;
    exportObject += `  '${file}': ${varName},\n`;
});

exportObject += '};\n';

fs.writeFileSync(outputFile, importStatements + '\n' + exportObject);
console.log('Generated src/data/logos.ts');
