'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import './ImageGallery.css';

export default function ImageGallery({ images, title, isHero, roomLabels }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasImages = images && images.length > 0;
  const imageCount = hasImages ? images.length : 0;

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev === 0 ? imageCount - 1 : prev - 1));
  }, [imageCount]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setSelectedIndex((prev) => (prev === imageCount - 1 ? 0 : prev + 1));
  }, [imageCount]);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Keyboard navigation
  useEffect(() => {
    if (!hasImages) {
      return undefined;
    }

    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasImages, isModalOpen, handlePrev, handleNext]);

  // Prevent scroll when modal is open
  useEffect(() => {
    if (!hasImages) {
      return undefined;
    }

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [hasImages, isModalOpen]);

  if (!hasImages) return null;

  // Get the room label for current image if provided
  const currentLabel = roomLabels ? roomLabels[selectedIndex] : null;

  return (
    <div className={`image-gallery ${isHero ? 'hero' : ''}`}>
      {/* Main Large Image */}
      <div className="gallery-main" onClick={openModal} title="Clique para ampliar">
        {/* Blurred Background Image for portrait/aspect-ratio differences */}
        <div style={{
          position: 'absolute',
          top: -20, right: -20, bottom: -20, left: -20,
          backgroundImage: `url(${images[selectedIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(15px)',
          opacity: 0.8,
          zIndex: 1
        }} />

        <Image
          src={images[selectedIndex]}
          alt={`${title} - Imagem ${selectedIndex + 1}`}
          fill
          className="gallery-image"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1200px"
          priority
          style={{ zIndex: 2 }}
        />

        {/* Expand Icon Overlay */}
        <div className="expand-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          <span>Toque para ampliar</span>
        </div>

        {/* Watermark Overlay */}
        <div className="watermark-overlay">
          <Image
            src="/watermark.png"
            alt="Watermark"
            width={800}
            height={800}
            unoptimized
            style={{
              width: '100%',
              height: 'auto',
              objectFit: 'contain'
            }}
          />
        </div>

        {/* Room Label Badge */}
        {currentLabel && (
          <div className="room-label-badge">
            {currentLabel}
          </div>
        )}

        {imageCount > 1 && (
          <>
            <button
              className="gallery-nav-btn prev-btn"
              onClick={handlePrev}
              aria-label="Imagem anterior"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="gallery-nav-btn next-btn"
              onClick={handleNext}
              aria-label="Próxima imagem"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>

            <div className="image-counter">
              {selectedIndex + 1} / {imageCount}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {imageCount > 1 && (
        <div className="gallery-thumbnails">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`thumbnail-btn ${index === selectedIndex ? 'active' : ''}`}
              aria-label={`Ver imagem ${index + 1}`}
              aria-current={index === selectedIndex}
            >
              <Image
                src={img}
                alt={`${title} - Thumbnail ${index + 1}`}
                fill
                className="thumbnail-image"
                sizes="150px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isModalOpen && (
        <div className="lightbox-modal-overlay" onClick={closeModal}>
          <button className="lightbox-modal-close" onClick={closeModal} aria-label="Fechar">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div className="lightbox-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-modal-image-container">
              <Image
                src={images[selectedIndex]}
                alt={`${title} - Ampliada ${selectedIndex + 1}`}
                fill
                className="lightbox-modal-image"
                sizes="100vw"
                quality={100}
                priority
              />
              
              {/* Watermark Overlay for Modal */}
              <div className="watermark-overlay modal-watermark">
                <Image
                  src="/watermark.png"
                  alt="Watermark"
                  width={1200}
                  height={1200}
                  unoptimized
                  style={{
                    width: '100%',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              </div>
            </div>

            {imageCount > 1 && (
              <>
                <button
                  className="lightbox-modal-nav-btn modal-prev"
                  onClick={handlePrev}
                  aria-label="Imagem anterior"
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  className="lightbox-modal-nav-btn modal-next"
                  onClick={handleNext}
                  aria-label="Próxima imagem"
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}

            <div className="lightbox-modal-info">
              {currentLabel && <span className="lightbox-modal-label">{currentLabel}</span>}
              <span className="lightbox-modal-counter">{selectedIndex + 1} / {imageCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

