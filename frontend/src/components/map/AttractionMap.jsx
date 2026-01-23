// src/components/map/AttractionMap.jsx
import React, { useRef, useEffect, useState } from "react";
import { getImageUrl } from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const AttractionMap = ({ attractions = [], mapboxToken }) => {
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter attractions that have valid coordinates
  const validAttractions = attractions.filter(
    (attr) =>
      attr.latitude &&
      attr.longitude &&
      !isNaN(attr.latitude) &&
      !isNaN(attr.longitude)
  );

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [102.2381, 6.1254], // [lng, lat] - Center of Kelantan
      zoom: 9,
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");

    mapRef.current = map;

    map.on("load", () => {
      setMapLoaded(true);
    });

    // Cleanup on unmount
    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      markersRef.current.forEach((marker) => marker.remove());
      map.remove();
    };
  }, [mapboxToken]);

  // Add markers when map is loaded and attractions are available
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || validAttractions.length === 0) return;

    const map = mapRef.current;

    // Remove existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    validAttractions.forEach((attraction) => {
      // Create custom marker element
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.innerHTML = `
        <div class="marker-container">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" class="marker-icon">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#DD0426" stroke="white" stroke-width="1" />
            <circle cx="12" cy="9" r="3" fill="white" />
          </svg>
          <div class="marker-pulse"></div>
        </div>
      `;

      // Create marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([
          parseFloat(attraction.longitude),
          parseFloat(attraction.latitude),
        ])
        .addTo(map);

      // Add click event to marker
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("Marker clicked:", attraction.name);
        showPopup(attraction, map);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (validAttractions.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validAttractions.forEach((attraction) => {
        bounds.extend([
          parseFloat(attraction.longitude),
          parseFloat(attraction.latitude),
        ]);
      });
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 80, right: 80 },
        maxZoom: 12,
        duration: 1000,
      });
    }
  }, [mapLoaded, validAttractions]);

  const showPopup = (attraction, map) => {
    console.log("showPopup called for:", attraction.name);
    console.log("Map object:", map);
    console.log("Coordinates:", attraction.latitude, attraction.longitude);

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
    }

    // Create popup content
    const popupContent = document.createElement("div");
    popupContent.className = "popup-content";
    let imageHtml = "";
    if (attraction.image) {
      const imageUrl = getImageUrl(attraction.image);
      imageHtml = `
        <img src="${imageUrl}" alt="${attraction.name}" class="popup-image" onerror="this.style.display='none'" />
      `;
    }
    popupContent.innerHTML = `
      <div style="padding: 12px; width: 280px; max-width: 100%;">
        ${imageHtml}
        <h3 style="font-weight: bold; font-size: 17px; color: #1f2937; margin-bottom: 8px; line-height: 1.3;">
          ${attraction.name}
        </h3>
        <p style="font-size: 13px; color: #4b5563; margin-bottom: 6px;">
          ${attraction.location}
        </p>
        <p style="font-size: 13px; color: #6b7280; margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
          ${attraction.description || ""}
        </p>
        <div class="glass-button-wrap" style="display:block; width:fit-content; max-width:100%; margin:0 auto;">
          <button class="glass-button popup-button" data-attraction-id="${attraction.id}">
            <span class="glass-button-text" style="display:flex; align-items:center; gap:6px; padding:10px 16px; font-weight:600; font-size:14px;">
              <span>View Details</span>
              <span>→</span>
            </span>
          </button>
          <div class="glass-button-shadow"></div>
        </div>
      </div>
    `;

    // Add click event to button
    const button = popupContent.querySelector(".popup-button");
    button.addEventListener("click", () => {
      // Public users can view attraction details without login
      const isAuthenticated = localStorage.getItem('token');
      if (isAuthenticated) {
        navigate(`/dashboard/attractions/${attraction.id}`);
      } else {
        navigate(`/attractions/${attraction.id}`);
      }
    });

    // Create and show popup
    try {
      const popup = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        offset: 25,
        maxWidth: "300px",
        className: "custom-popup",
      })
        .setLngLat([
          parseFloat(attraction.longitude),
          parseFloat(attraction.latitude),
        ])
        .setDOMContent(popupContent)
        .addTo(map);
      console.log("Popup created and added to map");
      popupRef.current = popup;
    } catch (error) {
      console.error("Error creating popup:", error);
    }
  };

  if (!mapboxToken) {
    return (
      <div className="w-full h-[500px] bg-gray-100 flex items-center justify-center rounded-lg">
        <div className="text-center p-6">
          <p className="text-gray-600 font-semibold mb-2">
            Map Configuration Required
          </p>
          <p className="text-gray-500 text-sm">
            Please add VITE_MAPBOX_TOKEN to your .env file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl relative">
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Legend overlay */}
      {mapLoaded && validAttractions.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-4 py-3 pointer-events-none">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill="#DD0426"
                stroke="white"
                strokeWidth="1"
              />
              <circle cx="12" cy="9" r="3" fill="white" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-gray-700">
                {" "}
                {validAttractions.length} Attraction
                {validAttractions.length !== 1 ? "s" : ""}{" "}
              </p>
              <p className="text-xs text-gray-500">Click marker for details</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttractionMap;
