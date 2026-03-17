/**
 * Adds a watermark to an image file.
 * 
 * @param {File} file - The original image file.
 * @param {string} watermarkUrl - The URL of the watermark image (default: '/watermark.png').
 * @returns {Promise<File>} - A promise that resolves to the watermarked image file.
 */
export async function addWatermark(file, watermarkUrl = '/watermark.png') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas dimensions to match image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Load watermark
        const watermark = new Image();
        watermark.src = watermarkUrl;
        watermark.crossOrigin = 'anonymous'; // Helper if watermark is hosted externally eventually

        watermark.onload = () => {
          // Watermark configuration
          const watermarkAspectRatio = watermark.width / watermark.height;
          
          // Calculate watermark size (e.g., 30% of image width)
          let wmWidth = canvas.width * 0.3; 
          let wmHeight = wmWidth / watermarkAspectRatio;

          // Check if height matches roughly (to avoid it being too tall on wide images)
          if (wmHeight > canvas.height * 0.3) {
             wmHeight = canvas.height * 0.3;
             wmWidth = wmHeight * watermarkAspectRatio;
          }

          // Calculate position (Center)
          const x = (canvas.width - wmWidth) / 2;
          const y = (canvas.height - wmHeight) / 2;

          // Draw watermark with opacity
          ctx.globalAlpha = 0.5; // 50% opacity
          ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
          ctx.globalAlpha = 1.0; // Reset opacity

          // Convert back to file
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob failed'));
              return;
            }
            const watermarkedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(watermarkedFile);
          }, file.type, 0.9); // 0.9 quality
        };

        watermark.onerror = (err) => {
          console.error('Error loading watermark image:', err);
          // If watermark fails, return original file as fallback
          resolve(file); 
        };
      };

      img.onerror = (err) => {
        reject(err);
      };
    };

    reader.onerror = (err) => {
      reject(err);
    };
  });
}
