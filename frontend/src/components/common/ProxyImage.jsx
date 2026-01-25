/**
 * ProxyImage Component
 * Loads images through the API with ngrok-skip-browser-warning header
 * Converts to base64 to bypass ngrok interstitial page
 */

import React, { useState, useEffect } from 'react';

const ProxyImage = ({ 
  src, 
  alt = '', 
  className = '', 
  fallbackSrc = null,
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    // If it's not an ngrok URL, use it directly
    if (!src.includes('ngrok')) {
      setImageSrc(src);
      setLoading(false);
      return;
    }

    // Fetch image with ngrok-skip header and convert to base64
    const loadImage = async () => {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(src, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        
        // Check if response is actually an image
        if (!contentType || !contentType.startsWith('image/')) {
          throw new Error('Response is not an image');
        }

        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        
        setImageSrc(base64);
        setLoading(false);
        
        if (onLoad) onLoad();
      } catch (err) {
        console.error('ProxyImage load error:', err);
        setError(true);
        setLoading(false);
        
        if (fallbackSrc) {
          setImageSrc(fallbackSrc);
        }
        
        if (onError) onError(err);
      }
    };

    loadImage();
  }, [src, fallbackSrc]);

  // Convert blob to base64
  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  if (loading) {
    return (
      <div 
        className={`animate-pulse bg-gray-200 ${className}`}
        style={{ minHeight: '100px' }}
        {...props}
      />
    );
  }

  if (error && !imageSrc) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        {...props}
      >
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      {...props}
    />
  );
};

export default ProxyImage;
