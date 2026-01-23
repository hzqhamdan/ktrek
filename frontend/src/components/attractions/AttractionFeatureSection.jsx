// src/components/attractions/AttractionFeatureSection.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Award, Image as ImageIcon } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";
import { getImageUrl, getPlaceholderImage } from "../../utils/constants";
import { cn } from "../../lib/utils";

export function AttractionFeatureSection({
  attractions = [],
  isAuthenticated = false,
}) {
  const navigate = useNavigate();
  
  if (!attractions || attractions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No attractions available yet.</p>
      </div>
    );
  }
  
  const handleAttractionClick = (attractionId) => {
    // Public users can view attraction details without login
    // Authenticated users can still access the dashboard version
    if (isAuthenticated) {
      navigate(`/dashboard/attractions/${attractionId}`);
    } else {
      navigate(`/attractions/${attractionId}`);
    }
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10 py-10 w-full">
      {attractions.map((attraction, index) => (
        <AttractionFeature
          key={attraction.id}
          attraction={attraction}
          index={index}
          isAuthenticated={isAuthenticated}
          onClick={() => handleAttractionClick(attraction.id)}
        />
      ))}
    </div>
  );
}

const AttractionFeature = ({ attraction, index, isAuthenticated, onClick }) => {
  // Determine if attraction has progress (for authenticated users)
  const progress = attraction.progress_percentage || 0;
  const completedTasks = attraction.completed_tasks || 0;
  const totalTasks = attraction.total_tasks || 0;
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex flex-col relative group/feature cursor-pointer transition-all duration-300 rounded-2xl shadow-lg border border-gray-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden h-full"
      )}
      style={{ backgroundColor: '#F1EEE7' }}
    >
      {/* Hover glow */}
      <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-br from-primary-50/60 to-transparent pointer-events-none" />
      {/* Image with overlay */}
      <div className="mb-4 relative z-10 px-5 pt-5">
        <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden shadow-md group-hover/feature:shadow-xl transition-shadow duration-200">
          <img
            src={
              getImageUrl(attraction.image) ||
              getPlaceholderImage(400, 300, "No Image")
            }
            alt={attraction.name}
            className="w-full h-full object-cover group-hover/feature:scale-110 transition-transform duration-300"
            onError={(e) => {
              e.target.src = getPlaceholderImage(400, 300, "No Image");
            }}
          />
          {/* Progress badge for authenticated users */}
          {isAuthenticated && progress > 0 && (
            <div className="absolute top-2 right-2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              {progress}%
            </div>
          )}
          {/* Location badge */}
          <div className="absolute bottom-2 left-2 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700 flex items-center gap-1 shadow-md" style={{ backgroundColor: 'rgba(241, 238, 231, 0.9)' }}>
            <MapPin className="w-3 h-3" /> {attraction.location}
          </div>
        </div>
      </div>
      {/* Title with animated bar */}
      <div className="text-lg font-bold mb-2 relative z-10 px-5 min-h-[3rem]">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-gray-300 dark:bg-neutral-700 group-hover/feature:bg-primary-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-gray-900 line-clamp-2">
          {attraction.name}
        </span>
      </div>
      {/* Description */}
      <p className="text-base text-gray-800 font-medium leading-relaxed max-w-xs relative z-10 px-5 mb-4 line-clamp-3 flex-1">
        {attraction.description}
      </p>
      {/* Stats for authenticated users */}
      {isAuthenticated && (
        <div className="flex gap-4 px-5 relative z-10 mt-auto pb-5">
          <div className="flex items-center gap-1 text-xs text-gray-700">
            <Clock className="w-4 h-4 text-primary-500" />
            <span>{totalTasks} tasks</span>
          </div>
          {completedTasks > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600">
              <Award className="w-4 h-4" />
              <span>{completedTasks} done</span>
            </div>
          )}
        </div>
      )}
      {/* View details button on hover */}
      <div className="opacity-0 group-hover/feature:opacity-100 transition-opacity duration-200 mt-4 px-5 relative z-10 pb-5 flex justify-center">
        <div className="flex items-center justify-center">
          <div className="inline-block">
            <GlassButton size="sm" contentClassName="flex items-center gap-1">
              <span>View Details</span>
              <span className="transition-transform duration-200 group-hover/feature:translate-x-1">→</span>
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttractionFeatureSection;
