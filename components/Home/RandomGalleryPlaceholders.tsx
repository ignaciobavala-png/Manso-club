import { getGalleryImages } from '@/lib/gallery';
import Image from 'next/image';

const fallbackImages = [
  { id: 'fallback-1', src: "/assets/manso1.webp" },
  { id: 'fallback-2', src: "/assets/manso2.webp" },
  { id: 'fallback-3', src: "/assets/manso3.webp" },
  { id: 'fallback-4', src: "/assets/manso5.webp" },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const RandomGalleryPlaceholders = async ({ count = 4 }: { count?: number }) => {
  const dbImages = await getGalleryImages();
  const allImages = dbImages.length > 0
    ? dbImages.map(img => ({ id: img.id, src: img.photo_url }))
    : fallbackImages;

  const selected = shuffleArray(allImages).slice(0, count);

  return (
    <>
      {selected.map((img, i) => (
        <span key={i} className="inline-flex w-8 h-8 sm:w-32 sm:h-16 rounded overflow-hidden flex-shrink-0 relative">
          <Image
            src={img.src}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 64px, 128px"
          />
        </span>
      ))}
    </>
  );
};
