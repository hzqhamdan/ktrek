import React from "react";
import { Award, Calendar } from "lucide-react";
import Card from "../common/Card";
import { formatDateTime } from "../../utils/helpers";
const RewardBadge = ({ reward, unlocked = false }) => {
  return (
    <Card
      className={`text-center ${unlocked ? "border-2 border-yellow-300" : ""}`}
      padding="lg"
    >
      {" "}
      {unlocked && (
        <div className="absolute top-3 right-3 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          {" "}
          Unlocked{" "}
        </div>
      )}{" "}
      {/* Badge Image/Icon */}{" "}
      <div className="mb-4">
        {" "}
        {reward.image ? (
          <img
            src={reward.image}
            alt={reward.title}
            className="w-24 h-24 mx-auto rounded-full"
          />
        ) : (
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full">
            {" "}
            <Award className="text-white" size={48} />{" "}
          </div>
        )}{" "}
      </div>{" "}
      {/* Title */}{" "}
      <h3 className="font-bold text-lg text-gray-900 mb-2"> {reward.title} </h3>{" "}
      {/* Description */}{" "}
      <p className="text-sm text-gray-600 mb-4"> {reward.description} </p>{" "}
      {/* Attraction Name */}{" "}
      <div className="bg-gray-50 rounded-lg px-3 py-2 mb-3">
        {" "}
        <p className="text-xs text-gray-500"> From </p>{" "}
        <p className="font-medium text-gray-900 text-sm">
          {" "}
          {reward.attraction_name}{" "}
        </p>{" "}
      </div>{" "}
      {/* Unlock Date */}{" "}
      {unlocked && reward.unlocked_at && (
        <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
          {" "}
          <Calendar size={12} />{" "}
          <span> Unlocked {formatDateTime(reward.unlocked_at)} </span>{" "}
        </div>
      )}{" "}
    </Card>
  );
};
export default RewardBadge;
