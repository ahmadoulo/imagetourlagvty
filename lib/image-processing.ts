import sharp from "sharp";

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif' | 'tiff';
  crop?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  blur?: number;
  rotate?: number;
}

export async function processImage(
  buffer: Buffer, 
  options: ImageProcessingOptions
): Promise<{ buffer: Buffer; contentType: string }> {
  let instance = sharp(buffer);

  // 1. Rotation
  if (options.rotate) {
    instance = instance.rotate(options.rotate);
  } else {
    instance = instance.rotate(); // auto-rotate based on EXIF
  }

  // 2. Resize & Crop
  if (options.width || options.height) {
    instance = instance.resize({
      width: options.width,
      height: options.height,
      fit: options.crop || 'cover',
      withoutEnlargement: true,
    });
  }

  // 3. Blur
  if (options.blur && options.blur > 0) {
    instance = instance.blur(options.blur);
  }

  // 4. Format & Quality
  let format = options.format;
  const quality = options.quality || 80;

  if (!format) {
    // Determine original format or default to webp for processed images
    const metadata = await instance.metadata();
    format = (metadata.format as any) || 'webp';
  }

  switch (format) {
    case 'jpeg':
    case 'jpg' as any:
      instance = instance.jpeg({ quality });
      break;
    case 'png':
      instance = instance.png({ quality });
      break;
    case 'webp':
      instance = instance.webp({ quality });
      break;
    case 'avif':
      instance = instance.avif({ quality });
      break;
    case 'tiff':
      instance = instance.tiff({ quality });
      break;
    default:
      instance = instance.webp({ quality });
      format = 'webp';
      break;
  }

  const processedBuffer = await instance.toBuffer();
  const contentType = `image/${format}`;

  return { buffer: processedBuffer, contentType };
}

/**
 * Parses Next.js SearchParams into ImageProcessingOptions
 */
export function parseImageParams(searchParams: URLSearchParams): ImageProcessingOptions | null {
  const w = searchParams.get("w") || searchParams.get("width");
  const h = searchParams.get("h") || searchParams.get("height");
  const q = searchParams.get("q") || searchParams.get("quality");
  const format = searchParams.get("format") as any;
  const crop = searchParams.get("crop") || searchParams.get("fit") as any;
  const blur = searchParams.get("blur");
  const rotate = searchParams.get("rotate");

  // Check if any processing is actually requested
  if (!w && !h && !q && !format && !crop && !blur && !rotate) {
    return null;
  }

  return {
    width: w ? parseInt(w, 10) : undefined,
    height: h ? parseInt(h, 10) : undefined,
    quality: q ? parseInt(q, 10) : undefined,
    format: format,
    crop: crop,
    blur: blur ? parseFloat(blur) : undefined,
    rotate: rotate ? parseFloat(rotate) : undefined,
  };
}
