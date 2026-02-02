"use client"

import { memo, useEffect, useLayoutEffect, useMemo, useState } from "react"
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useTransform,
} from "framer-motion"
import ProxyImage from "../../components/common/ProxyImage"

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect

type UseMediaQueryOptions = {
  defaultValue?: boolean
  initializeWithValue?: boolean
}

const IS_SERVER = typeof window === "undefined"

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {}
): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue
    }
    return window.matchMedia(query).matches
  }

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query)
    }
    return defaultValue
  })

  const handleChange = () => {
    setMatches(getMatches(query))
  }

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query)
    handleChange()

    matchMedia.addEventListener("change", handleChange)

    return () => {
      matchMedia.removeEventListener("change", handleChange)
    }
  }, [query])

  return matches
}

const duration = 0.15
const transition = { duration, ease: [0.32, 0.72, 0, 1] }
const transitionOverlay = { duration: 0.5, ease: [0.32, 0.72, 0, 1] }

interface AttractionCard {
  id: number
  name: string
  imageUrl: string
  description?: string
}

const Carousel = memo(
  ({
    handleClick,
    onCenterChange,
    cards,
    isCarouselActive,
    rotation,
  }: {
    handleClick: (card: AttractionCard, index: number) => void
    onCenterChange?: (card: AttractionCard, index: number) => void
    cards: AttractionCard[]
    isCarouselActive: boolean
    rotation: any
  }) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)")
    const cylinderWidth = isScreenSizeSm ? 1100 : 1800
    const faceCount = cards.length
    const faceWidth = cylinderWidth / faceCount
    const radius = cylinderWidth / (2 * Math.PI)
    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value}deg)`
    )

    // Calculate which card is currently centered
    useEffect(() => {
      const unsubscribe = rotation.on("change", (latest) => {
        if (onCenterChange && cards.length > 0) {
          // Calculate the centered index based on rotation
          const anglePerCard = 360 / faceCount
          const normalizedRotation = ((latest % 360) + 360) % 360
          const centeredIndex = Math.round(normalizedRotation / anglePerCard) % faceCount
          const actualIndex = (faceCount - centeredIndex) % faceCount
          
          if (cards[actualIndex]) {
            onCenterChange(cards[actualIndex], actualIndex)
          }
        }
      })
      return () => unsubscribe()
    }, [rotation, cards, faceCount, onCenterChange])

    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          drag={isCarouselActive ? "x" : false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDrag={(_, info) => {
            if (!isCarouselActive) return
            // Increased sensitivity: higher multiplier for more responsive dragging
            const DRAG_ROTATION_MULTIPLIER = 0.025
            rotation.set(rotation.get() + info.delta.x * DRAG_ROTATION_MULTIPLIER)
          }}
          onDragEnd={(_, info) => {
            if (!isCarouselActive) return
            // Increased inertia / throw sensitivity for more momentum
            const INERTIA_ROTATION_MULTIPLIER = 0.02
            const target = rotation.get() + info.velocity.x * INERTIA_ROTATION_MULTIPLIER
            animate(rotation, target, {
              type: "spring",
              stiffness: 100,
              damping: 30,
              mass: 0.3,
            })
          }}
        >
          {cards.map((card, i) => (
            <motion.div
              key={`key-${card.id}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center rounded-xl p-2"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${
                  i * (360 / faceCount)
                }deg) translateZ(${radius}px)`,
              }}
              onClick={() => handleClick(card, i)}
            >
              <ProxyImage
                src={card.imageUrl}
                alt={card.name}
                className="pointer-events-none w-full rounded-xl object-cover aspect-square shadow-lg"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    )
  }
)

function ThreeDPhotoCarousel({ 
  cards,
  onCenterChange,
  onCardClick,
}: { 
  cards: AttractionCard[]
  onCenterChange?: (card: AttractionCard, index: number) => void
  onCardClick?: (card: AttractionCard) => void
}) {
  const [isCarouselActive, setIsCarouselActive] = useState(true)
  // Shared rotation so we can programmatically rotate on click
  const rotation = useMotionValue(0)

  useEffect(() => {
    console.log("Cards loaded:", cards)
  }, [cards])

  const rotateToIndex = (index: number) => {
    if (!cards.length) return

    const faceCount = cards.length
    const anglePerCard = 360 / faceCount

    // To bring index to front, rotate by -index * angle
    const targetBase = -index * anglePerCard

    // Choose the closest equivalent angle to current rotation (avoid long spins)
    const current = rotation.get()
    const k = Math.round((current - targetBase) / 360)
    const target = targetBase + k * 360

    animate(rotation, target, {
      type: "spring",
      stiffness: 120,
      damping: 28,
      mass: 0.6,
    })
  }

  const handleClick = (card: AttractionCard, index: number) => {
    // Click-to-focus: rotate the wheel toward the clicked card
    rotateToIndex(index)

    // Optional external click handler (e.g. analytics)
    if (onCardClick) {
      onCardClick(card)
    }
  }

  return (
    <motion.div layout className="relative">
      <div className="relative h-[500px] w-full overflow-hidden">
        <Carousel
          handleClick={handleClick}
          onCenterChange={onCenterChange}
          cards={cards}
          isCarouselActive={isCarouselActive}
          rotation={rotation}
        />
      </div>
    </motion.div>
  )
}

export { ThreeDPhotoCarousel }
export type { AttractionCard }
