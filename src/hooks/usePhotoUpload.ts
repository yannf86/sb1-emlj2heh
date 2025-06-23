import { useState } from 'react';

export function usePhotoUpload() {
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);

  const handlePhotoChange = (type: 'before' | 'after', file: File | null) => {
    if (type === 'before') {
      setBeforePhoto(file);
    } else {
      setAfterPhoto(file);
    }
  };

  const resetPhotos = () => {
    setBeforePhoto(null);
    setAfterPhoto(null);
  };

  return {
    beforePhoto,
    afterPhoto,
    handlePhotoChange,
    resetPhotos
  };
}