/**
 * Full-screen background image component.
 */

import { useEffect, useState } from 'react';
import type { Media } from '@story-adventure/shared';

interface BackgroundImageProps {
  media: Media | null | undefined;
}

export function BackgroundImage({ media }: BackgroundImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (media?.type === 'image' && media.src) {
      setImageSrc(media.src);
    } else {
      setImageSrc(null);
    }
  }, [media]);

  if (!imageSrc) {
    return null;
  }

  return (
    <div
      id="background"
      style={{
        backgroundColor: 'black',
        margin: 0,
        textAlign: 'center',
        padding: '2px',
        zIndex: -1,
        width: '99vw',
        height: '99vh',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
      <img
        id="background_image"
        src={imageSrc}
        alt="Background"
        style={{
          maxWidth: '99vw',
          maxHeight: '99vh',
          margin: 0,
          zIndex: -1,
        }}
      />
    </div>
  );
}
