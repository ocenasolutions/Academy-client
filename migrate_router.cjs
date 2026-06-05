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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('react-router-dom')) {
    changed = true;
    
    // Replace imports
    if (content.includes('Link')) {
      content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"];?/g, (match, p1) => {
        let imports = p1.split(',').map(i => i.trim());
        let newImports = [];
        let rrdImports = [];
        
        let navImports = [];
        imports.forEach(i => {
           if (i === 'Link') {
              newImports.push(`import Link from 'next/link';`);
           } else if (['useNavigate', 'useLocation', 'useParams'].includes(i)) {
              navImports.push(i);
           } else if (['BrowserRouter', 'Routes', 'Route'].includes(i)) {
              // Ignore for now, we will delete App.tsx
           } else {
              rrdImports.push(i);
           }
        });
        
        if (navImports.length > 0) {
           // useLocation -> usePathname mapping
           if (navImports.includes('useLocation')) {
             navImports = navImports.filter(n => n !== 'useLocation');
             navImports.push('usePathname');
           }
           if (navImports.includes('useNavigate')) {
             navImports = navImports.filter(n => n !== 'useNavigate');
             navImports.push('useRouter');
           }
           newImports.push(`import { ${navImports.join(', ')} } from 'next/navigation';`);
        }
        
        if (rrdImports.length > 0) {
           newImports.push(`import { ${rrdImports.join(', ')} } from 'react-router-dom';`); // fallback
        }
        
        return newImports.join('\n');
      });
    } else {
      // Just hooks from react-router-dom
      content = content.replace(/import\s+{([^}]*)}\s+from\s+['"]react-router-dom['"];?/g, (match, p1) => {
         let imports = p1.split(',').map(i => i.trim());
         let navImports = [];
         let rrdImports = [];
         imports.forEach(i => {
           if (['useNavigate', 'useLocation', 'useParams'].includes(i)) {
              navImports.push(i);
           } else {
              rrdImports.push(i);
           }
         });
         let newImports = [];
         if (navImports.length > 0) {
           if (navImports.includes('useLocation')) {
             navImports = navImports.filter(n => n !== 'useLocation');
             navImports.push('usePathname');
           }
           if (navImports.includes('useNavigate')) {
             navImports = navImports.filter(n => n !== 'useNavigate');
             navImports.push('useRouter');
           }
           newImports.push(`import { ${navImports.join(', ')} } from 'next/navigation';`);
         }
         return newImports.join('\n');
      });
    }

    // Replace usages
    content = content.replace(/<Link\s+([^>]*)to=/g, '<Link $1href=');
    content = content.replace(/useNavigate\(\)/g, 'useRouter()');
    content = content.replace(/useLocation\(\)/g, 'usePathname()');
    content = content.replace(/location\.pathname/g, 'pathname');
  }

  // Next.js components that use hooks need "use client"
  if (
    content.includes('useState(') ||
    content.includes('useEffect(') ||
    content.includes('useRouter(') ||
    content.includes('usePathname(') ||
    content.includes('useParams(') ||
    content.includes('useToast(') ||
    content.includes('createContext(') ||
    content.includes('motion') ||
    content.includes('recharts')
  ) {
    if (!content.includes('"use client"')) {
      content = '"use client";\n\n' + content;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log('Replaced React Router with Next.js navigation');
