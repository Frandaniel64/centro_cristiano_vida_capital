import sharp from 'sharp';
import { procesarFoto } from './procesar.js';

async function fotoDePrueba(ancho: number, alto: number, conGps = false) {
  let img = sharp({ create: { width: ancho, height: alto, channels: 3, background: '#0c74b8' } }).jpeg();
  // IFD3 es la sección GPS del EXIF.
  if (conGps) img = img.withExifMerge({ IFD3: { GPSLatitudeRef: 'S', GPSLatitude: '34/1 36/1 0/1' } });
  return img.toBuffer();
}

describe('procesarFoto', () => {
  it('genera las variantes que no superan el original, en WebP', async () => {
    const r = await procesarFoto(await fotoDePrueba(2000, 1000));
    expect(r.variantes.map((v) => v.ancho)).toEqual([480, 960, 1600]);
    const meta = await sharp(r.variantes[2].datos).metadata();
    expect(meta.format).toBe('webp');
    expect(meta.width).toBe(1600);
  });

  it('genera un JPG de 1200×630 para compartir', async () => {
    const r = await procesarFoto(await fotoDePrueba(2000, 1500));
    const meta = await sharp(r.compartir).metadata();
    expect(meta).toMatchObject({ format: 'jpeg', width: 1200, height: 630 });
    expect(meta.exif).toBeUndefined();
  });

  it('una foto chica no se agranda', async () => {
    const r = await procesarFoto(await fotoDePrueba(700, 500));
    expect(r.variantes.map((v) => v.ancho)).toEqual([480, 700]);
    expect(r).toMatchObject({ ancho: 700, alto: 500 });
  });

  it('borra los metadatos, incluida la ubicación GPS', async () => {
    const original = await fotoDePrueba(800, 600, true);
    expect((await sharp(original).metadata()).exif).toBeDefined();
    const r = await procesarFoto(original);
    for (const v of r.variantes) expect((await sharp(v.datos).metadata()).exif).toBeUndefined();
  });

  it('rechaza un archivo que no es una imagen', async () => {
    await expect(procesarFoto(Buffer.from('no soy una foto'))).rejects.toThrow();
  });
});
