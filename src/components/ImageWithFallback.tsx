'use client';

import React, { useState } from "react";

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  placeholderSrc?: string;
}

/**
 * ImageWithFallback
 * - Shows a placeholder until the image loads
 * - Falls back to placeholder on error or missing src
 */
const ImageWithFallback: React.FC<Props> = ({
  src,
  alt,
  className = "",
  placeholderSrc = "/placeholder.svg",
}) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const showPlaceholder = !src || errored || !loaded;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {showPlaceholder && (
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
      )}
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`w-full h-full object-cover ${showPlaceholder ? "absolute inset-0 opacity-0" : ""}`}
        />
      )}
    </div>
  );
};

export default ImageWithFallback;
