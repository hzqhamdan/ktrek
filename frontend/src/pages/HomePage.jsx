// src/pages/HomePage.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { attractionsAPI } from "../api/attractions";
import AttractionFeatureSection from "../components/attractions/AttractionFeatureSection";
import AttractionsCarousel from "../components/attractions/AttractionsCarousel";
import AttractionMap from "../components/map/AttractionMap";
import AuthDivider from "../components/auth/AuthDivider";
import ScrollExpandMedia from "../components/ui/scroll-expansion-hero";
import { AdminSidebarIcon } from "../components/ui/admin-sidebar-icon";
import Loading from "../components/common/Loading";

const HomePage = () => {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAttractions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await attractionsAPI.getPublic();
        console.log("HomePage: Raw API response result:", response);

        // Handle different response formats
        const attractionsData = response.data || response;
        console.log("HomePage: Processed attractionsData:", attractionsData);

        const finalData = Array.isArray(attractionsData) ? attractionsData : [];
        console.log("HomePage: Final attractions array set to state (count):", finalData.length);

        setAttractions(finalData);
      } catch (err) {
        console.error("Failed to load attractions:", err);
        setError(err.message || "Failed to load attractions");
      } finally {
        setLoading(false);
      }
    };
    loadAttractions();
  }, []);

  // Make sure the hero always starts at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <ScrollExpandMedia
      mediaType="video"
      mediaSrc="https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYuZ5R8ahEEZ4aQK56LizRdfBSqeDMsmUIrJN1"
      posterSrc="https://images.pexels.com/videos/5752729/space-earth-universe-cosmos-5752729.jpeg"
      bgImageSrc="https://me7aitdbxq.ufs.sh/f/2wsMIGDMQRdYMNjMlBUYHaeYpxduXPVNwf8mnFA61L7rkcoS"
      title="Start Your Journey in Kelantan"
      textBlend
      showBeginButton={true}
      beginButtonText="Begin the Adventure"
    >
      <div className="min-h-screen" style={{ backgroundColor: '#F1EEE7' }}>
        {/* Hero Section - Map */}
        <div className="relative overflow-hidden">
          {/* Header Text Overlay */}
          <div className="relative z-20 py-8 px-6">
            <div className="container-custom text-center">
              <div
                className="inline-block mb-3 px-4 py-2 backdrop-blur-sm rounded-full text-sm font-semibold text-gray-900 border border-gray-200"
                style={{ backgroundColor: 'rgba(241, 238, 231, 0.8)' }}
              >
                <span className="inline-flex items-center gap-2">
                  <span>Discover Kelantan</span>
                  <AdminSidebarIcon name="attractions" className="w-4 h-4 text-[#120c07]" />
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 animate-fade-in text-gray-900">
                Welcome to K-Trek
              </h1>
              <p
                className="text-lg md:text-xl mb-4 text-gray-700 w-full text-center"
                style={{ textAlign: 'center' }}
              >
                Explore Kelantan's amazing attractions on the map below!
              </p>
            </div>
          </div>

          {/* Map Section */}
          <div className="relative z-10 pb-12 px-6">
            <div className="container-custom">
              {loading ? (
                <div
                  className="w-full h-[500px] backdrop-blur-sm rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(241, 238, 231, 0.9)' }}
                >
                  <Loading message="Loading map..." />
                </div>
              ) : error ? (
                <div
                  className="w-full h-[500px] backdrop-blur-sm rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(241, 238, 231, 0.9)' }}
                >
                  <div className="text-center p-6">
                    <p className="text-gray-700 font-semibold mb-2">Failed to load map</p>
                    <p className="text-gray-700 text-sm mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-6 py-2 text-white rounded-xl hover:shadow-lg transition-all duration-300"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <AttractionMap
                  attractions={attractions}
                  mapboxToken={import.meta.env.VITE_MAPBOX_TOKEN}
                />
              )}
            </div>
          </div>
        </div>

        <div className="container-custom px-6">
          <AuthDivider text="OR" bgClassName="bg-[#F1EEE7]" colorClassName="text-black" lineClassName="border-black" />
        </div>

        {/* 3D Carousel Section */}
        {!loading && !error && attractions.length > 0 && (
          <div className="py-16 px-6">
            <div className="container-custom mb-12 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Explore Featured Attractions in 3D
              </h2>
            </div>
            <AttractionsCarousel attractions={attractions} />
          </div>
        )}

        {/* Bottom Login/Sign Up - Always visible */}
        <div
          className="relative text-center py-16 border-t-2 border-gray-200"
          style={{ backgroundColor: '#F1EEE7' }}
        >
          {/* Decorative blur */}
          <div className="absolute top-0 left-1/2 w-64 h-64 rounded-full blur-3xl opacity-20 -translate-x-1/2 -translate-y-1/2" />

          <div className="relative z-10">
            <div className="mb-6">
              <h3 className="text-3xl font-bold bg-clip-text text-transparent mb-3">
                Ready to Start Your Adventure?
              </h3>
              <p className="text-gray-600 text-lg">
                Create an account to unlock missions and earn amazing rewards
              </p>
            </div>

            <div className="cta-row px-6">
              <Link
                to="/login"
                onClick={() => console.log("Login button clicked, navigating to /login")}
                className="link-btn"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => console.log("Register button clicked, navigating to /register")}
                className="link-btn"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ScrollExpandMedia>
  );
};

export default HomePage;
