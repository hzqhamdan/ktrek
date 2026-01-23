import React from "react";

import AttractionCard from "./AttractionCard";

const AttractionGrid = ({ attractions, isAuthenticated = true }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {attractions.map((attraction) => (
        <AttractionCard 
          key={attraction.id} 
          attraction={attraction} 
          isAuthenticated={isAuthenticated}
        />
      ))}
    </div>
  );
};

export default AttractionGrid;
