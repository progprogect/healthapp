'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface VideoPresentationProps {
  videoUrl: string;
  thumbnailUrl?: string;
  specialistName: string;
  className?: string;
}

export default function VideoPresentation({ 
  videoUrl, 
  thumbnailUrl, 
  specialistName,
  className = '' 
}: VideoPresentationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
    setIsLoading(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
  };

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {!isPlaying ? (
        <div className="relative aspect-video cursor-pointer group" onClick={handlePlay}>
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={`Видео-презентация ${specialistName}`}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <p className="text-lg font-medium">Видео-презентация</p>
                <p className="text-sm opacity-80">Нажмите для воспроизведения</p>
              </div>
            </div>
          )}
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-white bg-opacity-90 rounded-full flex items-center justify-center shadow-lg group-hover:bg-opacity-100 transition-all">
              <svg className="w-8 h-8 ml-1 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative aspect-video">
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="w-full h-full"
            onLoadedData={handleVideoLoad}
            onEnded={handleVideoEnd}
            poster={thumbnailUrl}
          >
            Ваш браузер не поддерживает видео.
          </video>
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

