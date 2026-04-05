"use client";

import { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface GalleryImage {
  id: number | string;
  src: string;
}

interface GalleryCardStackProps {
  images: GalleryImage[];
}

const ROTATION_MAP = [-6, -3, 0, 3, 6];

export const GalleryCardStack = ({ images }: GalleryCardStackProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const advance = () => setCurrentIndex((i) => i + 1);

  // slot 0 = top card (currentIndex), slot 1 = next, slot 4 = furthest back
  // BUG FIX: was `images.length - 1 - slot` which caused wrong image ordering
  const visibleCards = Array.from({ length: Math.min(5, images.length) }, (_, slot) => ({
    image: images[(currentIndex + slot) % images.length],
    slot,
  }));

  return (
    <div
      className="relative flex items-center justify-center w-full overflow-hidden"
      style={{ height: "420px" }}
    >
      {visibleCards.map(({ image, slot }) => {
        const isTop = slot === 0;
        const rotation = ROTATION_MAP[Math.min(slot, ROTATION_MAP.length - 1)] ?? 0;
        const yOffset = slot * 6;
        const cardScale = 1 - slot * 0.04;

        if (isTop) {
          return (
            <TopCard
              key={`top-${currentIndex}`}
              image={image}
              rotation={rotation}
              yOffset={yOffset}
              scale={cardScale}
              onAdvance={advance}
            />
          );
        }

        return (
          <motion.div
            key={`${image.id}-${slot}`}
            className="absolute rounded-2xl overflow-hidden shadow-xl border border-white/10"
            style={{
              width: "72vw",
              maxWidth: "320px",
              aspectRatio: "3/4",
              zIndex: 10 - slot,
            }}
            initial={{ rotate: rotation, y: yOffset, scale: cardScale }}
            animate={{ rotate: rotation, y: yOffset, scale: cardScale }}
            transition={{ type: "spring", stiffness: 280, damping: 22 }}
          >
            <img
              src={image.src}
              alt="Manso Club"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        );
      })}

      <div className="absolute bottom-2 left-0 right-0 flex justify-center">
        <span className="text-xs text-black/30 tracking-widest uppercase">deslizá</span>
      </div>
    </div>
  );
};

interface TopCardProps {
  image: GalleryImage;
  rotation: number;
  yOffset: number;
  scale: number;
  onAdvance: () => void;
}

const TopCard = ({ image, rotation, yOffset, scale, onAdvance }: TopCardProps) => {
  const x = useMotionValue(0);
  const opacity = useMotionValue(0);
  const rotateCard = useTransform(x, [-200, 200], [-25, 25]);
  const isSwipingRef = useRef(false);
  // BUG FIX: track timeout ref to cancel on unmount — prevents memory leak on rapid swipes
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    animate(opacity, 1, { duration: 0.25, ease: "easeOut" });
    return () => {
      // BUG FIX: clear safety timeout if component unmounts before it fires
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [opacity]);

  const triggerSwipeOut = (direction: 1 | -1) => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;

    let done = false;
    const complete = () => {
      if (done) return;
      done = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onAdvance();
    };

    animate(x, direction * 600, {
      type: "tween",
      duration: 0.22,
      ease: "easeIn",
      onComplete: complete,
    });
    animate(opacity, 0, { duration: 0.18, ease: "easeIn" });
    timeoutRef.current = setTimeout(complete, 320);
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipedFarEnough = Math.abs(info.offset.x) > 80;
    const swipedFastEnough = Math.abs(info.velocity.x) > 300;

    if (swipedFarEnough || swipedFastEnough) {
      triggerSwipeOut(info.offset.x >= 0 ? 1 : -1);
    } else {
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };

  return (
    <motion.div
      className="absolute rounded-2xl overflow-hidden shadow-2xl border border-white/20 cursor-grab active:cursor-grabbing"
      style={{
        width: "72vw",
        maxWidth: "320px",
        aspectRatio: "3/4",
        x,
        rotate: rotateCard,
        opacity,
        y: yOffset,
        scale,
        zIndex: 20,
        touchAction: "none",
      }}
      // BUG FIX: was `drag={isSwipingRef.current ? false : "x"}` — ref changes don't
      // cause re-renders so that condition was always "x". Lock is handled in triggerSwipeOut.
      drag="x"
      dragConstraints={{ left: -1500, right: 1500 }}
      dragElastic={0}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      whileTap={{ scale: scale * 1.02 }}
    >
      <img
        src={image.src}
        alt="Manso Club"
        className="w-full h-full object-cover"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </motion.div>
  );
};
