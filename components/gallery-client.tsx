"use client";

import { useEffect, useState } from "react";
import InfiniteGallery from "@/components/ui/3d-gallery-photography";
import { Camera } from "lucide-react";

type GalleryImage = {
  src: string;
  alt: string;
};

export default function GalleryClientPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadImages = async () => {
      try {
        const response = await fetch("/api/gallery-images", { cache: "no-store" });
        const data = (await response.json()) as {
          images?: GalleryImage[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Failed to load gallery images");
        }

        if (active) {
          setImages(data.images || []);
        }
      } catch (err) {
        if (active) {
          const message = err instanceof Error ? err.message : "Unknown error";
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadImages();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-screen w-full">
      <InfiniteGallery
        images={images}
        speed={1.2}
        zSpacing={3}
        visibleCount={12}
        falloff={{ near: 0.8, far: 14 }}
        className="h-screen w-full rounded-lg overflow-hidden"
      />

      <div className="h-screen inset-0 pointer-events-none fixed flex items-center justify-center text-center px-3 mix-blend-exclusion text-white">
        <h1 className="font-serif text-4xl md:text-7xl tracking-tight">
          <span className="italic">I create;</span> therefore I am
        </h1>
      </div>

      <div className="fixed top-6 left-6 z-20 pointer-events-none flex items-center gap-2 text-slate-900">
        <Camera className="h-5 w-5" strokeWidth={2.25} />
        <span className="font-serif text-lg tracking-wide lowercase">photography</span>
      </div>

      <div className="text-center fixed bottom-10 left-0 right-0 font-mono uppercase text-[11px] font-semibold text-slate-900">
        {loading ? <p>Loading your Cloudinary portfolio...</p> : null}
        {error ? <p className="text-red-300">{error}</p> : null}
        {!loading && !error ? <p>Use mouse wheel, arrow keys, or touch to navigate</p> : null}
        {!loading && !error ? (
          <p className="opacity-60">Auto-play resumes after 3 seconds of inactivity</p>
        ) : null}
      </div>
    </main>
  );
}
