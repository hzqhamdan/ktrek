import React from "react";

import AttractionCard from "./AttractionCard";

const AttractionGrid = ({ attractions, isAuthenticated = true, hideImages = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {attractions.map((attraction) => (
        <AttractionCard 
          key={attraction.id} 
          attraction={attraction} 
          isAuthenticated={isAuthenticated}
          hideImage={hideImages}
        />
      ))}
    </div>
  );
};

export default AttractionGrid;
