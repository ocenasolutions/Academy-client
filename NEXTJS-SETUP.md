# Next.js Setup Instructions

## Prerequisites
- Node.js 18.17+
- npm (or yarn / pnpm)

## Local Development
Since this project has been fully migrated from Vite to Next.js, follow these steps to run the application locally:

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Run the development server:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Note: In this AI Studio workspace, the dev script is explicitly configured to run on port 3000 (`next dev -p 3000 --hostname 0.0.0.0`) due to container routing requirements. On your local machine, `npm run dev` will continue to seamlessly map to `localhost:3000`.

3. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Production Build & Deployment

To prepare the application for a production environment:

1. **Build the application:**
   \`\`\`bash
   npm run build
   \`\`\`
   This will execute `next build`, compiling the React application into optimized static assets and server-side components.

2. **Start the production server:**
   \`\`\`bash
   npm run start
   \`\`\`

### Deploying to Vercel
The codebase is structured to be deployed out-of-the-box on [Vercel](https://vercel.com).
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the repository in your Vercel Dashboard.
3. Keep default build settings (Framework Preset: Next.js).
4. Click Deploy.
