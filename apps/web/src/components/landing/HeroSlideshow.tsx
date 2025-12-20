'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface HomepageSlide {
  id: string;
  title: string;
  description?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'YOUTUBE';
  mediaUrl: string;
  linkUrl?: string;
  linkText?: string;
  sortOrder: number;
}

interface HeroSlideshowProps {
  slides: HomepageSlide[];
  autoplayDelay?: number;
}

export function HeroSlideshow({ slides, autoplayDelay = 5000 }: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, duration: 25 },
    [Autoplay({ delay: autoplayDelay, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (!slides || slides.length === 0) {
    return null;
  }

  const extractYouTubeId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  return (
    <div className="relative w-full h-[80vh] overflow-hidden bg-black">
      {/* Embla Carousel */}
      <div className="h-full" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className="flex-[0_0_100%] min-w-0 relative h-full"
            >
              {/* Media Background */}
              <div className="absolute inset-0">
                {slide.mediaType === 'IMAGE' && (
                  <Image
                    src={slide.mediaUrl}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    className="object-cover"
                    sizes="100vw"
                  />
                )}

                {slide.mediaType === 'VIDEO' && (
                  <video
                    src={slide.mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}

                {slide.mediaType === 'YOUTUBE' && extractYouTubeId(slide.mediaUrl) && (
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(slide.mediaUrl)}?autoplay=1&mute=1&loop=1&playlist=${extractYouTubeId(slide.mediaUrl)}&controls=0&showinfo=0&modestbranding=1`}
                    allow="autoplay; encrypted-media"
                    className="w-full h-[120%] -mt-[10%] pointer-events-none"
                    style={{ border: 'none' }}
                  />
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/60" />
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 h-full flex items-center justify-center px-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="text-center max-w-4xl"
                >
                  <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight text-white drop-shadow-lg">
                    {slide.title}
                  </h1>
                  
                  {slide.description && (
                    <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow">
                      {slide.description}
                    </p>
                  )}

                  {slide.linkUrl && (
                    <Link
                      href={slide.linkUrl}
                      className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-primary-500/50 transition-all transform hover:scale-105"
                    >
                      {slide.linkText || 'Tudj meg többet'}
                    </Link>
                  )}
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center group"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all flex items-center justify-center group"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'w-8 bg-white'
                  : 'w-2 bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
