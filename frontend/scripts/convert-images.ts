/**
 * Image Conversion Script
 *
 * Converts all PNG images in public/locations/ to AVIF and WebP formats
 * Run with: bun run scripts/convert-images.ts
 */

import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const LOCATIONS_DIR: string = join(process.cwd(), 'public', 'locations');
const PORTRAITS_DIR: string = join(process.cwd(), 'public', 'portraits');

async function convertImage(inputPath: string, outputPath: string, format: 'avif' | 'webp'): Promise<void> {
  try {
    const image = sharp(inputPath);

    if (format === 'avif') {
      await image.avif({ quality: 75, effort: 6 }).toFile(outputPath);
    } else if (format === 'webp') {
      await image.webp({ quality: 85 }).toFile(outputPath);
    }

    console.log(`✓ Created ${outputPath}`);
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error);
  }
}

async function convertDirectory(dir: string, label: string): Promise<void> {
  if (!existsSync(dir)) {
    console.log(`Directory ${dir} doesn't exist, skipping...`);
    return;
  }

  console.log(`\n📸 Converting ${label}...`);

  const files: string[] = readdirSync(dir) as string[];
  const pngFiles: string[] = files.filter((f: string) => f.endsWith('.png'));

  console.log(`Found ${pngFiles.length} PNG files`);

  for (const file of pngFiles) {
    const baseName: string = file.replace('.png', '');
    const inputPath: string = join(dir, file);

    // Convert to AVIF
    const avifPath: string = join(dir, `${baseName}.avif`);
    await convertImage(inputPath, avifPath, 'avif');

    // Convert to WebP
    const webpPath: string = join(dir, `${baseName}.webp`);
    await convertImage(inputPath, webpPath, 'webp');
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting image conversion...\n');

  // Convert location illustrations
  await convertDirectory(LOCATIONS_DIR, 'Location Illustrations');

  // Convert witness portraits
  await convertDirectory(PORTRAITS_DIR, 'Witness Portraits');

  console.log('\n✅ Image conversion complete!');
  console.log('\nFile size savings:');
  console.log('- AVIF: ~50-70% smaller than PNG');
  console.log('- WebP: ~25-35% smaller than PNG');
}

main().catch(console.error);
