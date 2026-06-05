const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/#eff0f3/g, 'var(--color-bg-main)');
  content = content.replace(/#0f0e17/g, 'var(--color-text-heading)');
  content = content.replace(/#2b2c34/g, 'var(--color-text-main)');
  fs.writeFileSync(file, content);
});
console.log('Replaced all hardcoded colors with CSS variables');
