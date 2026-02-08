import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Full-screen background image component.
 */
import { useEffect, useState } from 'react';
export function BackgroundImage({ media }) {
    const [imageSrc, setImageSrc] = useState(null);
    useEffect(() => {
        if (media?.type === 'image' && media.src) {
            setImageSrc(media.src);
        }
        else {
            setImageSrc(null);
        }
    }, [media]);
    if (!imageSrc) {
        return null;
    }
    return (_jsx("div", { id: "background", style: {
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
        }, children: _jsx("img", { id: "background_image", src: imageSrc, alt: "Background", style: {
                maxWidth: '99vw',
                maxHeight: '99vh',
                margin: 0,
                zIndex: -1,
            } }) }));
}
