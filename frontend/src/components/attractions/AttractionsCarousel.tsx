import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ThreeDPhotoCarousel, AttractionCard } from "../ui/3d-carousel";
import { MapPin } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { motion, AnimatePresence } from "framer-motion";

interface Attraction {
  id: number;
  name: string;
  description: string;
  image?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}

interface AttractionsCarouselProps {
  attractions: Attraction[];
}

const AttractionsCarousel: React.FC<AttractionsCarouselProps> = ({ attractions }) => {
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(
    attractions.length > 0 ? attractions[0] : null
  );

  // Transform attractions data to carousel cards format
  const carouselCards: AttractionCard[] = useMemo(() => {
    return attractions.map((attraction) => ({
      id: attraction.id,
      name: attraction.name,
      imageUrl: attraction.image || `https://picsum.photos/400/400?random=${attraction.id}`,
      description: attraction.description,
    }));
  }, [attractions]);

  // Handle when carousel centers on a new attraction
  const handleCenterChange = (card: AttractionCard, index: number) => {
    const attraction = attractions.find((a) => a.id === card.id);
    if (attraction && attraction.id !== selectedAttraction?.id) {
      setSelectedAttraction(attraction);
    }
  };

  // Image clicks rotate the wheel (handled inside ThreeDPhotoCarousel).
  // Navigation stays on the "View Details" button below.

  if (attractions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No attractions available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* 3D Carousel Section */}
      <div className="w-full">
        <ThreeDPhotoCarousel 
          cards={carouselCards}
          onCenterChange={handleCenterChange}
        />
      </div>

      {/* Attraction Description Section */}
      <AnimatePresence mode="wait">
        {selectedAttraction && (
          <motion.div 
            key={selectedAttraction.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full flex justify-center px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-4xl w-full">
              {/* Attraction Info Container - Blended Background */}
              <div 
                className="rounded-2xl p-12 shadow-lg border border-gray-200 backdrop-blur-sm"
                style={{ backgroundColor: 'rgba(241, 238, 231, 0.95)' }}
              >
                {/* Content */}
                <div className="flex flex-col items-center text-center gap-8">
                  {/* Attraction Name */}
                  <h2 className="text-3xl font-bold text-gray-900">
                    {selectedAttraction.name}
                  </h2>

                  {/* Location */}
                  {selectedAttraction.location ? (
                    <div className="flex items-center justify-center text-gray-600 gap-2">
                      <MapPin className="w-5 h-5 text-primary-500" />
                      <span className="text-sm">{selectedAttraction.location}</span>
                    </div>
                  ) : (
                    // Keep spacing consistent even when location is missing
                    <div className="h-6" />
                  )}

                  {/* Description */}
                  <p className="text-gray-700 leading-relaxed text-lg max-w-3xl">
                    {selectedAttraction.description}
                  </p>

                  {/* Action Button - Centered */}
                  <div>
                    <Link to={`/attractions/${selectedAttraction.id}`}>
                      <GlassButton size="lg" contentClassName="flex items-center gap-2">
                        <span>View Details</span>
                        <span>→</span>
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AttractionsCarousel;
