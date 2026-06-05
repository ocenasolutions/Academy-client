const fs = require('fs');
const path = require('path');

const routeMapping = {
  'Home.tsx': 'app/page.tsx',
  'CourseListing.tsx': 'app/courses/page.tsx',
  'CourseDetail.tsx': 'app/courses/[id]/page.tsx',
  'Login.tsx': 'app/login/page.tsx',
  'Register.tsx': 'app/register/page.tsx',
  'StudentDashboard.tsx': 'app/dashboard/student/page.tsx',
  'StudentProgress.tsx': 'app/dashboard/student/progress/page.tsx',
  'InstructorDashboard.tsx': 'app/dashboard/instructor/page.tsx',
  'AdminDashboard.tsx': 'app/dashboard/admin/page.tsx',
  'VideoLesson.tsx': 'app/course/[courseId]/lesson/[lessonId]/page.tsx',
  'Checkout.tsx': 'app/checkout/[courseId]/page.tsx',
  'Certificate.tsx': 'app/certificate/[certificateId]/page.tsx',
  'Settings.tsx': 'app/settings/page.tsx',
};

for (const [source, dest] of Object.entries(routeMapping)) {
  const sourcePath = path.join('src', 'pages', source);
  const destPath = path.join('src', dest);

  if (fs.existsSync(sourcePath)) {
    // Create destination directories if they don't exist
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    let content = fs.readFileSync(sourcePath, 'utf8');

    // Fix imports for components, contexts, data, assuming pages/ is one level deep originally.
    // In src/app/some/nested/page.tsx, relative paths need adjusting.
    // Instead of doing complex math, we can replace relative paths with absolute `@/...`
    content = content.replace(/from\s+['"]\.\.\//g, 'from \'@/');
    content = content.replace(/from\s+['"]\.\//g, 'from \'@/');

    // Replace the named export with default export for Next.js pages
    const componentNameMatch = content.match(/export\s+function\s+([A-Za-z0-9_]+)/);
    if (componentNameMatch) {
      const componentName = componentNameMatch[1];
      content = content.replace(`export function ${componentName}`, `export default function ${componentName}`);
    }

    // Write to new path
    fs.writeFileSync(destPath, content);
    console.log(`Migrated ${source} to ${dest}`);
    
    // Delete the original file
    fs.unlinkSync(sourcePath);
  }
}
