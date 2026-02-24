import { useState } from 'react';

function ImageGallery({ images = [], alt = 'Product' }) {
  const [selected, setSelected] = useState(0);
  const imgs = images.length ? images : ['/placeholder-product.jpg'];

  return (
    <div className="space-y-4">
      <div className="aspect-square rounded-2xl overflow-hidden bg-[#E8F0E8] relative group">
        <img
          src={imgs[selected]}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
      {imgs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {imgs.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                selected === i
                  ? 'border-[#2D5A27]'
                  : 'border-transparent hover:border-[#8B7355]/40'
              }`}
            >
              <img
                src={img}
                alt={`${alt} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
