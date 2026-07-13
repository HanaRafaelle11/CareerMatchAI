import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const brandDir = path.join(publicDir, 'brand');

// Ensure brand directory exists
if (!fs.existsSync(brandDir)) {
  fs.mkdirSync(brandDir, { recursive: true });
}

console.log('--- Talenta Asset Generator ---');

async function generate() {
  try {
    // 1. Symbol PNG (1024px transparent)
    console.log('Generating symbol.png...');
    await sharp(path.join(brandDir, 'symbol.svg'))
      .resize(1024, 1024)
      .toFile(path.join(brandDir, 'symbol.png'));

    // 2. Horizontal Logo PNG (1024px wide transparent)
    console.log('Generating logo-horizontal.png...');
    await sharp(path.join(brandDir, 'logo-horizontal.svg'))
      .resize({ width: 1024 })
      .toFile(path.join(brandDir, 'logo-horizontal.png'));

    // 3. Horizontal White Logo PNG (1024px wide transparent)
    console.log('Generating logo-horizontal-white.png...');
    await sharp(path.join(brandDir, 'logo-horizontal-white.svg'))
      .resize({ width: 1024 })
      .toFile(path.join(brandDir, 'logo-horizontal-white.png'));

    // 4. Vertical Logo PNG (1024px wide transparent)
    console.log('Generating logo-vertical.png...');
    await sharp(path.join(brandDir, 'logo-vertical.svg'))
      .resize({ width: 1024 })
      .toFile(path.join(brandDir, 'logo-vertical.png'));

    // 5. PWA Icon 192 (192px transparent)
    console.log('Generating pwa-icon-192.png...');
    await sharp(path.join(brandDir, 'symbol.svg'))
      .resize(192, 192)
      .toFile(path.join(publicDir, 'pwa-icon-192.png'));

    // 6. PWA Icon 512 (512px transparent)
    console.log('Generating pwa-icon-512.png...');
    await sharp(path.join(brandDir, 'symbol.svg'))
      .resize(512, 512)
      .toFile(path.join(publicDir, 'pwa-icon-512.png'));

    // 7. PWA Maskable Icon 192 (192px with #0F172A background, symbol at 60% size)
    console.log('Generating pwa-icon-192-maskable.png...');
    const symbolBuffer192 = await sharp(path.join(brandDir, 'symbol.svg'))
      .resize(115, 115) // ~60% of 192
      .toBuffer();
    await sharp({
      create: {
        width: 192,
        height: 192,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A
      }
    })
      .composite([{ input: symbolBuffer192, gravity: 'center' }])
      .toFile(path.join(publicDir, 'pwa-icon-192-maskable.png'));

    // 8. PWA Maskable Icon 512 (512px with #0F172A background, symbol at 60% size)
    console.log('Generating pwa-icon-512-maskable.png...');
    const symbolBuffer512 = await sharp(path.join(brandDir, 'symbol.svg'))
      .resize(307, 307) // ~60% of 512
      .toBuffer();
    await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A
      }
    })
      .composite([{ input: symbolBuffer512, gravity: 'center' }])
      .toFile(path.join(publicDir, 'pwa-icon-512-maskable.png'));

    // 9. Apple Touch Icon (180x180 with #0F172A background, symbol at 60% size)
    console.log('Generating apple-touch-icon.png...');
    const symbolBufferApple = await sharp(path.join(brandDir, 'symbol.svg'))
      .resize(108, 108) // 60% of 180
      .toBuffer();
    await sharp({
      create: {
        width: 180,
        height: 180,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A
      }
    })
      .composite([{ input: symbolBufferApple, gravity: 'center' }])
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // 10. Open Graph Image (1200x630, #0F172A background, logo-horizontal-white centered)
    console.log('Generating og-image.png...');
    const horizontalWhiteLogoBuffer = await sharp(path.join(brandDir, 'logo-horizontal-white.svg'))
      .resize({ width: 640 }) // Balanced size on 1200 width
      .toBuffer();
    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A
      }
    })
      .composite([{ input: horizontalWhiteLogoBuffer, gravity: 'center' }])
      .toFile(path.join(publicDir, 'og-image.png'));

    // 11. Splash Screen for Mobile (1242x2688, #0F172A background, logo-vertical-white centered)
    console.log('Generating splash-screen.png...');
    const verticalWhiteLogoBuffer = await sharp(path.join(brandDir, 'logo-vertical-white.svg'))
      .resize({ width: 480 }) // Centered at 1242 width
      .toBuffer();
    await sharp({
      create: {
        width: 1242,
        height: 2688,
        channels: 4,
        background: { r: 15, g: 23, b: 42, alpha: 1 } // #0F172A
      }
    })
      .composite([{ input: verticalWhiteLogoBuffer, gravity: 'center' }])
      .toFile(path.join(publicDir, 'splash-screen.png'));

    console.log('✔ All assets generated successfully!');
  } catch (error) {
    console.error('❌ Error generating assets:', error);
    process.exit(1);
  }
}

generate();
