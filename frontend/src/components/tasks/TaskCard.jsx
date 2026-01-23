import React from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Lock,
  Play,
  Brain,
  Camera,
  MapPin,
  Hash,
  Compass,
  HelpCircle,
  Lightbulb,
  Eye,
  Route as RouteIcon,
  Clock,
  ChevronRight,
} from "lucide-react";
import Card from "../common/Card";
const TaskCard = ({ task, index, attractionId }) => {
  const { id, name, type, description, is_completed } = task;
  const getTaskIcon = () => {
    switch (type) {
      case "quiz":
        return <Brain size={24} className="text-[#120c07]" />;
      case "checkin":
        return <MapPin size={24} className="text-green-600" />;
      case "count_confirm":
        return <Hash size={24} className="text-blue-600" />;
      case "direction":
        return <Compass size={24} className="text-purple-600" />;
      case "riddle":
        return <HelpCircle size={24} className="text-pink-600" />;
      case "memory_recall":
        return <Lightbulb size={24} className="text-yellow-600" />;
      case "observation_match":
        return <Eye size={24} className="text-teal-600" />;
      case "route_completion":
        return <RouteIcon size={24} className="text-indigo-600" />;
      case "time_based":
        return <Clock size={24} className="text-orange-600" />;
      default:
        return <Play size={24} className="text-gray-600" />;
    }
  };
  const getTaskTypeLabel = () => {
    switch (type) {
      case "quiz":
        return "Quiz Challenge";
      case "checkin":
        return "Check-in";
      case "count_confirm":
        return "Count & Confirm";
      case "direction":
        return "Direction & Orientation";
      case "riddle":
        return "Riddle Puzzle";
      case "memory_recall":
        return "Memory Recall";
      case "observation_match":
        return "Observation Match";
      case "route_completion":
        return "Route Completion";
      case "time_based":
        return "Time-Based Challenge";
      default:
        return "Mission";
    }
  };
  const getTaskTypeColor = () => {
    switch (type) {
      case "quiz":
        return "bg-orange-100 text-[#120c07]";
      case "checkin":
        return "bg-green-100 text-green-700";
      case "count_confirm":
        return "bg-blue-100 text-blue-700";
      case "direction":
        return "bg-purple-100 text-purple-700";
      case "riddle":
        return "bg-pink-100 text-pink-700";
      case "memory_recall":
        return "bg-yellow-100 text-yellow-700";
      case "observation_match":
        return "bg-teal-100 text-teal-700";
      case "route_completion":
        return "bg-indigo-100 text-indigo-700";
      case "time_based":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  return (
    <Card
      className={`transition-all duration-200 ${is_completed ? "bg-green-50 border-green-200" : "hover:shadow-md cursor-pointer"}`}
      padding="md"
    >
      {" "}
      <Link to={is_completed ? "#" : `/tasks/${id}`} className="block">
        {" "}
        <div className="flex items-start space-x-4">
          {" "}
          {/* Index Badge */}{" "}
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${is_completed ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
            aria-label={is_completed ? "Completed" : "Not completed"}
          >
            {" "}
            {is_completed ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}{" "}
          </div>{" "}
          {/* Icon */}{" "}
          <div className="flex-shrink-0 mt-1"> {getTaskIcon()} </div>{" "}
          {/* Content */}{" "}
          <div className="flex-grow min-w-0">
            {" "}
            <div className="flex items-center space-x-2 mb-1">
              {" "}
              <span
                className={`text-xs font-medium px-2 py-1 rounded ${getTaskTypeColor()}`}
              >
                {" "}
                {getTaskTypeLabel()}{" "}
              </span>{" "}
              {Boolean(is_completed) && (
                <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700">
                  {" "}
                  Completed{" "}
                </span>
              )}{" "}
            </div>{" "}
            <h4 className="font-semibold text-gray-900 mb-1 truncate">
              {" "}
              {name}{" "}
            </h4>{" "}
            <p className="text-sm text-gray-600 line-clamp-2">
              {" "}
              {description}{" "}
            </p>{" "}
          </div>{" "}
          {/* Arrow */}{" "}
          {!is_completed && (
            <div className="flex-shrink-0 mt-3">
              {" "}
              <ChevronRight className="text-gray-400" size={20} />{" "}
            </div>
          )}{" "}
        </div>{" "}
      </Link>{" "}
    </Card>
  );
};
export default TaskCard;
