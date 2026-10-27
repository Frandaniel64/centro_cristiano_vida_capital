// Convierte las fotos de diseño (src/assets/fotos/*.jpg) a public/fotos/<nombre>/
// en WebP de 480, 960 y 1600 px y un JPG de 1200×630 para compartir: la misma
// forma que las fotos que se suben desde el panel.
// Correr cuando se agregue o cambie una foto: node scripts/optimizar-fotos.mjs
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'src/assets/fotos');
const destino = join(raiz, 'public/fotos');
const ANCHOS = [480, 960, 1600];
// Índice nombre → { ancho: url } que usa src/lib/fotos.ts.
const indice = {};

for (const archivo of (await readdir(origen)).filter((a) => /\.(jpe?g|png)$/i.test(a))) {
  const nombre = parse(archivo).name;
  const carpeta = join(destino, nombre);
  await mkdir(carpeta, { recursive: true });
  const base = sharp(join(origen, archivo)).rotate();
  const { width = 0 } = await base.metadata();
  const anchos = ANCHOS.filter((a) => a < width);
  if (anchos.length < ANCHOS.length) anchos.push(Math.min(width, ANCHOS.at(-1)));
  for (const a of new Set(anchos)) {
    await base.clone().resize({ width: a, withoutEnlargement: true }).webp({ quality: 72 }).toFile(join(carpeta, `${a}.webp`));
  }
  await base.clone().resize({ width: 1200, height: 630, fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true }).toFile(join(carpeta, 'compartir.jpg'));
  indice[nombre] = Object.fromEntries([...[...new Set(anchos)].map((a) => [a, `/fotos/${nombre}/${a}.webp`]), ['compartir', `/fotos/${nombre}/compartir.jpg`]]);
  console.log(`${nombre}: ${[...new Set(anchos)].join(', ')} + compartir`);
}

await writeFile(join(raiz, 'src/data/fotos-diseno.json'), JSON.stringify(indice, null, 2) + '\n');
