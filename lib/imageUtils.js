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

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const watermark = new Image();
        watermark.src = watermarkUrl;
        watermark.crossOrigin = 'anonymous';

        watermark.onload = () => {
          const watermarkAspectRatio = watermark.width / watermark.height;
          
          let wmWidth = canvas.width * 0.3; 
          let wmHeight = wmWidth / watermarkAspectRatio;

          if (wmHeight > canvas.height * 0.3) {
             wmHeight = canvas.height * 0.3;
             wmWidth = wmHeight * watermarkAspectRatio;
          }

          const x = (canvas.width - wmWidth) / 2;
          const y = (canvas.height - wmHeight) / 2;

          ctx.globalAlpha = 0.5;
          ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
          ctx.globalAlpha = 1.0;

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
          }, file.type, 0.9);
        };

        watermark.onerror = (err) => {
          console.error('Error loading watermark image:', err);
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
