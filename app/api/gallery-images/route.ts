import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  format?: string;
  resource_type?: string;
};

type CloudinaryResponse = {
  resources?: CloudinaryResource[];
};

type CachedImages = {
  images: { src: string; alt: string }[];
  expiresAt: number;
};

let galleryCache: CachedImages | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

function toAltText(publicId: string): string {
  const base = publicId.split("/").pop() ?? publicId;
  return base.replace(/[-_]+/g, " ").trim() || "Portfolio image";
}

function transformedUrl(secureUrl: string): string {
  return secureUrl.replace("/upload/", "/upload/f_auto,q_auto,w_1200/");
}

function isLikelyPersonalUpload(publicId: string): boolean {
  const base = publicId.split("/").pop() ?? publicId;
  const upper = base.toUpperCase();

  return (
    /^IMG[-_]?\d/.test(upper) ||
    /^PXL[-_]?\d/.test(upper) ||
    /^MVIMG[-_]?\d/.test(upper) ||
    /^VID[-_]?\d/.test(upper) ||
    /^DSC[-_]?\d/.test(upper) ||
    /^PHOTO[-_]?\d/.test(upper) ||
    /^20\d{6}/.test(upper)
  );
}

export async function GET() {
  if (galleryCache && Date.now() < galleryCache.expiresAt) {
    return NextResponse.json({ images: galleryCache.images });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      {
        error:
          "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.",
      },
      { status: 500 }
    );
  }

  const configuredFolder = (process.env.CLOUDINARY_PORTFOLIO_FOLDER || "").trim();
  const configuredMax = Number.parseInt(process.env.CLOUDINARY_MAX_IMAGES || "30", 10);
  const maxImages = Number.isFinite(configuredMax)
    ? Math.min(Math.max(configuredMax, 12), 80)
    : 30;
  const folderPrefix = configuredFolder
    ? configuredFolder.endsWith("/")
      ? configuredFolder
      : `${configuredFolder}/`
    : null;

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
  const images: { src: string; alt: string }[] = [];

  try {
    const params = new URLSearchParams({
      type: "upload",
      max_results: "120",
    });
    if (folderPrefix) {
      params.set("prefix", folderPrefix);
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Cloudinary API error (${response.status}): ${errorText}` },
        { status: 500 }
      );
    }

    const data = (await response.json()) as CloudinaryResponse;
    const batch = data.resources ?? [];

    for (const resource of batch) {
      const format = (resource.format || "").toLowerCase();
      const publicId = (resource.public_id || "").toLowerCase();
      const secureUrl = (resource.secure_url || "").toLowerCase();
      const isSupportedFormat = ["jpg", "jpeg", "png", "webp"].includes(format);
      const isSampleAsset =
        publicId.startsWith("samples/") ||
        publicId === "sample" ||
        publicId.includes("/sample") ||
        secureUrl.includes("/samples/");
      const isPersonalCandidate = folderPrefix ? true : isLikelyPersonalUpload(resource.public_id);

      if (
        !isSupportedFormat ||
        isSampleAsset ||
        resource.resource_type !== "image" ||
        !isPersonalCandidate
      ) {
        continue;
      }

      images.push({
        src: transformedUrl(resource.secure_url),
        alt: toAltText(resource.public_id),
      });

      if (images.length >= maxImages) {
        break;
      }
    }

    galleryCache = {
      images,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };

    return NextResponse.json({ images });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch Cloudinary images: ${message}` },
      { status: 500 }
    );
  }
}
