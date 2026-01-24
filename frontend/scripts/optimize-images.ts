/**
 * Image Optimization Script
 *
 * Converts PNG images to AVIF and WebP formats for better performance.
 * Run with: bun run scripts/optimize-images.ts
 *
 * @module scripts/optimize-images
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, parse } from 'path';

const PUBLIC_DIR = join(import.meta.dir, '../public');
const IMAGE_DIRS = ['portraits', 'locations'];

interface ConversionResult {
  file: string;
  avif: boolean;
  webp: boolean;
  error?: string;
}

async function findPngFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isFile() && entry.toLowerCase().endsWith('.png')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Could not read directory ${dir}:`, error);
  }

  return files;
}

async function convertImage(pngPath: string): Promise<ConversionResult> {
  const { dir, name } = parse(pngPath);
  const avifPath = join(dir, `${name}.avif`);
  const webpPath = join(dir, `${name}.webp`);

  const result: ConversionResult = {
    file: pngPath,
    avif: false,
    webp: false,
  };

  try {
    const image = sharp(pngPath);

    // Check if AVIF already exists
    try {
      await stat(avifPath);
      console.log(`  ⏭️  AVIF exists: ${name}.avif`);
      result.avif = true;
    } catch {
      // AVIF doesn't exist, create it
      await image.clone().avif({ quality: 80 }).toFile(avifPath);
      console.log(`  ✅ Created: ${name}.avif`);
      result.avif = true;
    }

    // Check if WebP already exists
    try {
      await stat(webpPath);
      console.log(`  ⏭️  WebP exists: ${name}.webp`);
      result.webp = true;
    } catch {
      // WebP doesn't exist, create it
      await image.clone().webp({ quality: 85 }).toFile(webpPath);
      console.log(`  ✅ Created: ${name}.webp`);
      result.webp = true;
    }
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`  ❌ Error processing ${name}.png:`, result.error);
  }

  return result;
}

async function main() {
  console.log('🖼️  Image Optimization Script\n');
  console.log('Converting PNG images to AVIF and WebP formats...\n');

  const results: ConversionResult[] = [];

  for (const imageDir of IMAGE_DIRS) {
    const dir = join(PUBLIC_DIR, imageDir);
    console.log(`📁 Processing ${imageDir}/`);

    const pngFiles = await findPngFiles(dir);

    if (pngFiles.length === 0) {
      console.log('   No PNG files found.\n');
      continue;
    }

    for (const pngFile of pngFiles) {
      const result = await convertImage(pngFile);
      results.push(result);
    }

    console.log('');
  }

  // Summary
  const successful = results.filter(r => r.avif && r.webp && !r.error);
  const failed = results.filter(r => r.error);

  console.log('📊 Summary:');
  console.log(`   Total PNG files: ${results.length}`);
  console.log(`   Successfully optimized: ${successful.length}`);
  if (failed.length > 0) {
    console.log(`   Failed: ${failed.length}`);
  }
  console.log('\n✨ Done!');
}

main().catch(console.error);
