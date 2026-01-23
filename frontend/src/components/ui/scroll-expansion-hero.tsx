'use client';

import React, {
  useEffect,
  useRef,
  useState,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from 'react';
import { motion } from 'framer-motion';

export interface ScrollExpandMediaProps {
  mediaType?: 'video' | 'image';
  mediaSrc: string;
  posterSrc?: string;
  bgImageSrc: string;
  title?: string;
  date?: string;
  scrollToExpand?: string;
  textBlend?: boolean;
  children?: ReactNode;
  showBeginButton?: boolean;
  beginButtonText?: string;
  onBeginClick?: () => void;
}

/**
 * Vite/React adaptation of the original Next.js component.
 * - Replaces next/image with standard <img> tags.
 * - Keeps framer-motion + Tailwind styling.
 */
const ScrollExpandMedia = ({
  mediaType = 'video',
  mediaSrc,
  posterSrc,
  bgImageSrc,
  title,
  date,
  scrollToExpand,
  textBlend,
  children,
  showBeginButton = false,
  beginButtonText = "Begin the Adventure",
  onBeginClick,
}: ScrollExpandMediaProps) => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [mediaFullyExpanded, setMediaFullyExpanded] = useState<boolean>(false);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [isMobileState, setIsMobileState] = useState<boolean>(false);

  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
    setMediaFullyExpanded(false);
  }, [mediaType]);

  useEffect(() => {
    const handleWheel = (e: globalThis.WheelEvent) => {
      if (mediaFullyExpanded && e.deltaY < 0 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        const scrollDelta = e.deltaY * 0.0009;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }
      }
    };

    const handleTouchStart = (e: globalThis.TouchEvent) => {
      setTouchStartY(e.touches[0].clientY);
    };

    const handleTouchMove = (e: globalThis.TouchEvent) => {
      if (!touchStartY) return;

      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;

      if (mediaFullyExpanded && deltaY < -20 && window.scrollY <= 5) {
        setMediaFullyExpanded(false);
        e.preventDefault();
      } else if (!mediaFullyExpanded) {
        e.preventDefault();
        // Increase sensitivity for mobile, especially when scrolling back
        const scrollFactor = deltaY < 0 ? 0.008 : 0.005; // Higher sensitivity for scrolling back
        const scrollDelta = deltaY * scrollFactor;
        const newProgress = Math.min(
          Math.max(scrollProgress + scrollDelta, 0),
          1
        );
        setScrollProgress(newProgress);

        if (newProgress >= 1) {
          setMediaFullyExpanded(true);
          setShowContent(true);
        } else if (newProgress < 0.75) {
          setShowContent(false);
        }

        setTouchStartY(touchY);
      }
    };

    const handleTouchEnd = (): void => {
      setTouchStartY(0);
    };

    const handleScroll = (): void => {
      if (!mediaFullyExpanded) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [scrollProgress, mediaFullyExpanded, touchStartY]);

  useEffect(() => {
    const checkIfMobile = (): void => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const mediaWidth = 300 + scrollProgress * (isMobileState ? 650 : 1250);
  const mediaHeight = 400 + scrollProgress * (isMobileState ? 200 : 400);
  const textTranslateX = scrollProgress * (isMobileState ? 180 : 150);

  const firstWord = title ? title.split(' ')[0] : '';
  const restOfTitle = title ? title.split(' ').slice(1).join(' ') : '';

  return (
    <div
      ref={sectionRef}
      className='transition-colors duration-700 ease-in-out overflow-x-hidden'
    >
      <section className='relative flex flex-col items-center justify-start min-h-[100dvh]'>
        <div className='relative w-full flex flex-col items-center min-h-[100dvh]'>
          <motion.div
            className='absolute inset-0 z-0 h-full'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 - scrollProgress }}
            transition={{ duration: 0.1 }}
          >
            <img
              src={bgImageSrc}
              alt='Background'
              className='w-screen h-screen object-cover object-center'
              loading='eager'
            />
            <div className='absolute inset-0 bg-black/10' />
          </motion.div>

          <div className='container mx-auto flex flex-col items-center justify-start relative z-10'>
            {/* Title overlay - positioned at viewport level, ABOVE everything */}
            <div
              className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-center gap-4 transition-none flex-col pointer-events-none ${
                textBlend ? 'mix-blend-difference' : 'mix-blend-normal'
              }`}
              style={{ 
                zIndex: 99999,
                width: '100vw',
                maxWidth: '95vw'
              }}
            >
              <motion.h2
                className='text-4xl md:text-5xl lg:text-6xl font-bold transition-none px-4'
                style={{ 
                  transform: `translateX(-${textTranslateX}vw)`,
                  color: '#BFDBFE' // text-blue-200 fallback
                }}
              >
                {firstWord}
              </motion.h2>
              <motion.h2
                className='text-4xl md:text-5xl lg:text-6xl font-bold text-center transition-none px-4'
                style={{ 
                  transform: `translateX(${textTranslateX}vw)`,
                  color: '#BFDBFE' // text-blue-200 fallback
                }}
              >
                {restOfTitle}
              </motion.h2>
            </div>

            <div className='flex flex-col items-center justify-center w-full h-[100dvh] relative'>
              <div
                className='absolute z-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-none rounded-2xl'
                style={{
                  width: `${mediaWidth}px`,
                  height: `${mediaHeight}px`,
                  maxWidth: '95vw',
                  maxHeight: '85vh',
                  boxShadow: '0px 0px 50px rgba(0, 0, 0, 0.3)',
                }}
              >
                {mediaType === 'video' ? (
                  mediaSrc.includes('youtube.com') ? (
                    <div className='relative w-full h-full pointer-events-none'>
                      <iframe
                        width='100%'
                        height='100%'
                        src={
                          mediaSrc.includes('embed')
                            ? mediaSrc +
                              (mediaSrc.includes('?') ? '&' : '?') +
                              'autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1'
                            : mediaSrc.replace('watch?v=', 'embed/') +
                              '?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=' +
                              mediaSrc.split('v=')[1]
                        }
                        className='w-full h-full rounded-xl'
                        frameBorder={0}
                        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                        allowFullScreen
                        title={title || 'Embedded video'}
                      />
                      <div
                        className='absolute inset-0 z-0'
                        style={{ pointerEvents: 'none' }}
                      />

                      <motion.div
                        className='absolute inset-0 bg-black/30 rounded-xl z-0'
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  ) : (
                    <div className='relative w-full h-full pointer-events-none'>
                      <video
                        src={mediaSrc}
                        poster={posterSrc}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload='auto'
                        className='w-full h-full object-cover rounded-xl'
                        controls={false}
                        disablePictureInPicture
                        disableRemotePlayback
                        onError={(e) => {
                          // If video fails to load, hide it and show poster/background instead
                          const videoEl = e.currentTarget;
                          videoEl.style.display = 'none';
                          console.warn('Video failed to load, using poster/background fallback');
                        }}
                      />
                      <div
                        className='absolute inset-0 z-0'
                        style={{ pointerEvents: 'none' }}
                      />

                      <motion.div
                        className='absolute inset-0 bg-black/30 rounded-xl z-0'
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 0.5 - scrollProgress * 0.3 }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                  )
                ) : (
                  <div className='relative w-full h-full'>
                    <img
                      src={mediaSrc}
                      alt={title || 'Media content'}
                      className='w-full h-full object-cover rounded-xl'
                      loading='lazy'
                    />

                    <motion.div
                      className='absolute inset-0 bg-black/50 rounded-xl z-0'
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.7 - scrollProgress * 0.3 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )}

                <div className='flex flex-col items-center text-center relative z-10 mt-12 gap-6 transition-none'>
                  {showBeginButton ? (
                    <motion.button
                      onClick={() => {
                        // Animate expansion smoothly from current progress to 1
                        const startProgress = scrollProgress;
                        const duration = 1500; // 1.5 seconds for smooth expansion
                        const startTime = Date.now();
                        
                        const animateExpansion = () => {
                          const elapsed = Date.now() - startTime;
                          const progress = Math.min(elapsed / duration, 1);
                          
                          // Easing function for smooth animation (ease-in-out)
                          const easeProgress = progress < 0.5
                            ? 2 * progress * progress
                            : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                          
                          const newProgress = startProgress + (1 - startProgress) * easeProgress;
                          setScrollProgress(newProgress);
                          
                          if (progress < 1) {
                            requestAnimationFrame(animateExpansion);
                          } else {
                            setMediaFullyExpanded(true);
                            setShowContent(true);
                            
                            // Smooth scroll animation after expansion completes
                            setTimeout(() => {
                              const targetScroll = window.innerHeight + 100;
                              const startScroll = window.scrollY;
                              const distance = targetScroll - startScroll;
                              const scrollDuration = 1200; // 1.2 seconds for scroll
                              const scrollStartTime = Date.now();
                              
                              const animateScroll = () => {
                                const elapsed = Date.now() - scrollStartTime;
                                const progress = Math.min(elapsed / scrollDuration, 1);
                                
                                // Ease-in-out for smooth scroll
                                const easeProgress = progress < 0.5
                                  ? 2 * progress * progress
                                  : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                                
                                window.scrollTo(0, startScroll + distance * easeProgress);
                                
                                if (progress < 1) {
                                  requestAnimationFrame(animateScroll);
                                }
                              };
                              
                              animateScroll();
                            }, 500);
                          }
                        };
                        
                        animateExpansion();
                        
                        // Call custom callback if provided
                        if (onBeginClick) {
                          onBeginClick();
                        }
                      }}
                      className='px-8 py-4 text-lg font-semibold rounded-full pointer-events-auto hero-begin-btn'
                      style={{
                        zIndex: 9999
                      }}
                      // Keep the button slightly lower for breathing space from the media
                      initial={{ opacity: 0, y: 60 }}
                      animate={{ opacity: 1 - scrollProgress * 2, y: 40 }}
                      transition={{ duration: 0.5 }}
                    >
                      {beginButtonText}
                    </motion.button>
                  ) : (
                    <>
                      {date && (
                        <p
                          className='text-2xl text-blue-200'
                          style={{ transform: `translateX(-${textTranslateX}vw)` }}
                        >
                          {date}
                        </p>
                      )}
                      {scrollToExpand && (
                        <p
                          className='text-blue-200 font-medium text-center'
                          style={{ transform: `translateX(${textTranslateX}vw)` }}
                        >
                          {scrollToExpand}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>

            <motion.section
              className='flex flex-col w-full px-8 py-10 md:px-16 lg:py-20'
              initial={{ opacity: 0 }}
              animate={{ opacity: showContent ? 1 : 0 }}
              transition={{ duration: 0.7 }}
            >
              {children}
            </motion.section>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ScrollExpandMedia;
