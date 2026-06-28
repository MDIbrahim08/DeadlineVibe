const fs = require('fs');
const path = require('path');

const walk = dir => fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file);
    const isDir = fs.statSync(name).isDirectory();
    return isDir ? [...files, ...walk(name)] : [...files, name];
}, []);

const files = walk('.').filter(f => !f.includes('node_modules') && !f.includes('dist') && !f.includes('.git') && (f.endsWith('.ts') || f.endsWith('.tsx')));

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('import.meta.env.VITE_API_URL')) {
        // Find: fetch(`${import.meta.env.VITE_API_URL || ""}/api/something",
        // Replace: fetch(`${import.meta.env.VITE_API_URL || ""}/api/something`,
        const newContent = content.replace(/fetch\(`\$\{import\.meta\.env\.VITE_API_URL \|\| ""\}\/api\/([^"']+)"/g, 'fetch(`\${import.meta.env.VITE_API_URL || ""}/api/$1`');
        if (newContent !== content) {
            fs.writeFileSync(f, newContent);
            console.log("Fixed: " + f);
        }
    }
});
