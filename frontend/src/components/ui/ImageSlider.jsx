import { useState, useEffect, useCallback } from 'react';

const CAPTIONS = [
  {
    heading: 'Your placement journey starts here',
    sub: 'Explore 50+ companies visiting campus this season and land your dream role.',
  },
  {
    heading: 'Collaborate, grow, and succeed together',
    sub: 'Join 2000+ students who have built their careers through our portal.',
  },
  {
    heading: 'Campus to corporate — made simple',
    sub: 'Apply in one click, track your applications, get placed.',
  },
];

export default function ImageSlider({ images, interval = 4500 }) {
  const [current, setCurrent]   = useState(0);
  const [fading, setFading]     = useState(false);   // true during cross-fade

  const goTo = useCallback((idx) => {
    if (idx === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(idx);
      setFading(false);
    }, 350);
  }, [current]);

  const next = useCallback(() => {
    goTo((current + 1) % images.length);
  }, [current, goTo, images.length]);

  // Auto-advance
  useEffect(() => {
    const id = setInterval(next, interval);
    return () => clearInterval(id);
  }, [next, interval]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">

      {/* Slides */}
      {images.map((src, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
            idx === current ? (fading ? 'opacity-0' : 'opacity-100') : 'opacity-0'
          }`}
        >
          <img
            src={src}
            alt={`Slide ${idx + 1}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
          {/* Gradient overlay — bottom-heavy for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        </div>
      ))}

      {/* Caption overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
        <p
          key={current}
          className="text-white text-xl font-bold leading-snug mb-1.5 animate-fade-in"
        >
          {CAPTIONS[current % CAPTIONS.length]?.heading}
        </p>
        <p
          key={`sub-${current}`}
          className="text-white/75 text-sm leading-relaxed mb-5 animate-fade-in"
        >
          {CAPTIONS[current % CAPTIONS.length]?.sub}
        </p>

        {/* Dot indicators */}
        <div className="flex items-center gap-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`rounded-full transition-all duration-300 cursor-pointer ${
                idx === current
                  ? 'w-6 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/45 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
