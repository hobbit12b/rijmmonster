import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const dist = join(projectRoot, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, 'src'), { recursive: true });

await cp(join(projectRoot, 'index.html'), join(dist, 'index.html'));
await cp(join(projectRoot, 'public', 'assets'), join(dist, 'assets'), { recursive: true });
await cp(join(projectRoot, 'src', 'styles.css'), join(dist, 'src', 'styles.css'));
await cp(join(projectRoot, 'src', 'components'), join(dist, 'src', 'components'), {
  recursive: true,
  filter: (source) => source.endsWith('.css') || !source.includes('.'),
});
await writeFile(join(dist, '.nojekyll'), '');
