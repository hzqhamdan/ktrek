import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MapPin, CheckCircle, Clock, Award, ArrowRight } from "lucide-react";
import Card from "../common/Card";
import ProxyImage from "../common/ProxyImage";
import { getImageUrl } from "../../utils/constants";

const AttractionCard = ({ attraction, featured = false, isAuthenticated = false, hideImage = false }) => {
  const {
    id,
    name,
    location,
    description,
    image,
    total_tasks,
    completed_tasks,
    progress_percentage,
    reward_unlocked,
  } = attraction;
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  
  const progress = Number(progress_percentage || 0);
  const isCompleted = progress === 100;
  const isInProgress = progress > 0 && progress < 100;
  
  const handleClick = (e) => {
    e.preventDefault();
    // Allow public viewing of attraction details
    if (isAuthenticated) {
      navigate(`/dashboard/attractions/${id}`);
    } else {
      navigate(`/attractions/${id}`);
    }
  };
  
  return (
    <Link to={isAuthenticated ? `/dashboard/attractions/${id}` : `/attractions/${id}`} onClick={handleClick}>
      {" "}
      <Card
        className={`group overflow-hidden transition-all duration-300 h-full flex flex-col ${featured ? "border-2 border-primary-200" : ""}`}
        hoverable
        padding="none"
      >
        {" "}
        {/* Image */}{" "}
        {!hideImage && (
          <div className="relative h-48 overflow-hidden bg-gray-200">
            {" "}
            {image && !imageError ? (
              <ProxyImage
                src={getImageUrl(image)}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600">
                {" "}
                <MapPin className="text-white" size={64} />{" "}
              </div>
            )}{" "}
            {/* Status Badge */}{" "}
            {isCompleted && (
              <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 shadow-lg">
                {" "}
                <CheckCircle size={16} /> <span>Completed</span>{" "}
              </div>
            )}{" "}
            {isInProgress && (
              <div className="absolute top-3 right-3 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 shadow-lg">
                {" "}
                <Clock size={16} /> <span>In Progress</span>{" "}
              </div>
            )}{" "}
            {/* Featured Badge */}{" "}
            {featured && (
              <div className="absolute top-3 left-3 bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                {" "}
                Featured{" "}
              </div>
            )}{" "}
          </div>
        )}{" "}
        {/* Content */}{" "}
        <div className="p-4 sm:p-5 flex flex-col flex-1">
          {" "}
          {/* Title */}{" "}
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#120c07] transition-colors line-clamp-2 min-h-[3rem]">
            {" "}
            {name}{" "}
          </h3>{" "}
          {/* Location */}{" "}
          <div className="flex items-center text-gray-700 text-sm mb-3">
            {" "}
            <MapPin size={16} className="mr-1 flex-shrink-0" />{" "}
            <span className="truncate"> {location} </span>{" "}
          </div>{" "}
          {/* Description */}{" "}
          <p className="text-gray-800 text-sm leading-relaxed mb-4 line-clamp-2 min-h-[2.5rem]">
            {" "}
            {description}{" "}
          </p>{" "}
          {/* Progress Bar */}{" "}
          <div className="mb-4">
            {" "}
            <div className="flex items-center justify-between text-sm mb-2">
              {" "}
              <span className="text-gray-600 font-medium"> Progress </span>{" "}
              <span className="text-[#120c07] font-semibold">
                {" "}
                {progress} %
              </span>{" "}
            </div>{" "}
            <div className="progress-bar">
              {" "}
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                }}
              ></div>{" "}
            </div>{" "}
            <p className="text-xs text-gray-600 mt-1">
              {completed_tasks} of {total_tasks} {Number(total_tasks || 0) === 1 ? "task" : "tasks"} completed
            </p>{" "}
          </div>{" "}
          {/* Footer */}{" "}
          <div className="flex items-center justify-between mt-auto">
            {" "}
            {reward_unlocked ? (
              <div className="flex items-center space-x-1 text-yellow-600 text-sm font-medium">
                {" "}
                <Award size={16} /> <span>Reward Unlocked!</span>{" "}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {total_tasks} {Number(total_tasks || 0) === 1 ? "mission" : "missions"} available
              </div>
            )}{" "}
            <div className="flex items-center space-x-1 text-[#120c07] font-medium text-sm group-hover:space-x-2 transition-all">
              {" "}
              <span> Explore </span>{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </Card>{" "}
    </Link>
  );
};
export default AttractionCard;
