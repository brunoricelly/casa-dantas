import { useMemo, useState, type TouchEvent } from 'react';

type ProductImageCarouselProps = {
  images?: string[];
  fallbackImage?: string;
  alt: string;
  clickable?: boolean;
  onOpen?: () => void;
};

export default function ProductImageCarousel({
  images = [],
  fallbackImage = '/placeholder.jpg',
  alt,
  clickable = false,
  onOpen,
}: ProductImageCarouselProps) {
  const allImages = useMemo(() => {
    const list = (images || []).filter(Boolean);

    if (list.length > 0) return list;

    if (fallbackImage && fallbackImage !== '/placeholder.jpg') {
      return [fallbackImage];
    }

    return [];
  }, [images, fallbackImage]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const hasImages = allImages.length > 0;
  const hasMultiple = allImages.length > 1;

  const goTo = (index: number) => {
    setCurrentIndex(index);
  };

  const goPrev = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goNext = () => {
    if (!hasMultiple) return;
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0]?.clientX ?? null);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || !hasMultiple) return;

    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const distance = touchStartX - endX;

    if (Math.abs(distance) > 40) {
      if (distance > 0) {
        goNext();
      } else {
        goPrev();
      }
    }

    setTouchStartX(null);
  };

  const handleMainImageClick = () => {
    if (!clickable || !onOpen || !hasImages) return;
    onOpen();
  };

  return (
    <div className="space-y-3">
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-slate-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {hasImages ? (
          <button
            type="button"
            onClick={handleMainImageClick}
            className={`block h-full w-full ${
              clickable ? 'cursor-zoom-in' : 'cursor-default'
            }`}
            aria-label={clickable ? `Ampliar ${alt}` : alt}
          >
            <img
              key={allImages[currentIndex]}
              src={allImages[currentIndex]}
              alt={`${alt} - imagem ${currentIndex + 1}`}
              className="h-full w-full select-none object-contain transition-all duration-300 ease-out"
              loading="lazy"
              draggable={false}
            />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
            Sem imagem
          </div>
        )}

        {clickable && hasImages && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-black text-slate-700 shadow-md backdrop-blur">
            Ampliar
          </div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Imagem anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg font-black text-slate-700 shadow-md transition hover:scale-105"
            >
              ‹
            </button>

            <button
              type="button"
              onClick={goNext}
              aria-label="Próxima imagem"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3 py-2 text-lg font-black text-slate-700 shadow-md transition hover:scale-105"
            >
              ›
            </button>

            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-3 py-1.5 backdrop-blur">
              {allImages.map((_, index) => (
                <button
                  key={`dot-${index}`}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Ir para imagem ${index + 1}`}
                  className={`h-2.5 w-2.5 rounded-full transition ${
                    index === currentIndex ? 'bg-blue-700' : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Selecionar imagem ${index + 1}`}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                index === currentIndex
                  ? 'border-blue-700 ring-2 ring-blue-700/20'
                  : 'border-transparent hover:border-slate-300'
              }`}
            >
              <img
                src={image}
                alt={`${alt} miniatura ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
