import { createContext, useContext, useEffect, useState } from 'react';
import { getActiveOffers } from '../utils/api';

const OffersContext = createContext({ offers: [] });

export function OffersProvider({ children }) {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    getActiveOffers()
      .then((list) => setOffers(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  return (
    <OffersContext.Provider value={{ offers }}>
      {children}
    </OffersContext.Provider>
  );
}

export function useOffers() {
  return useContext(OffersContext);
}

// Helper: get the best active offer for a product — matches by name OR slug
export function getOfferForProduct(offers, productName, productSlug) {
  if (!offers?.length) return null;

  return offers.find((o) => {
    if (!o.productName) return false;
    const offerName = o.productName.toLowerCase().trim();

    // name match (both directions)
    if (productName) {
      const name = productName.toLowerCase().trim();
      if (name.includes(offerName) || offerName.includes(name)) return true;
    }

    // slug match — convert "kasturi-manjal-image" → "kasturi manjal image"
    if (productSlug) {
      const slugAsName = productSlug.toLowerCase().replace(/-/g, ' ').trim();
      if (slugAsName.includes(offerName) || offerName.includes(slugAsName)) return true;
    }

    return false;
  }) || null;
}