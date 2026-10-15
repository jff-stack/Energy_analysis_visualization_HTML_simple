/**
 * Copies the production build (dist/) into the repository root so that the
 * root index.html and assets/ are always the built site. GitHub Pages then
 * serves a working page even if it is configured to deploy from the branch
 * rather than from the Actions workflow. Runs after every `npm run build`.
 */
import { cpSync, existsSync, rmSync } from 'node:fs'

if (!existsSync('dist/index.html')) throw new Error('dist/index.html not found. Run the build first.')
rmSync('assets', { recursive: true, force: true })
cpSync('dist/index.html', 'index.html')
cpSync('dist/assets', 'assets', { recursive: true })
console.log('Published build to repository root (index.html, assets/).')
