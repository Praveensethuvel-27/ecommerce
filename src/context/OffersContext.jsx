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

// Helper: get the best active offer for a product name (case-insensitive match)
export function getOfferForProduct(offers, productName) {
  if (!offers?.length || !productName) return null;
  const lower = productName.toLowerCase();
  return offers.find(
    (o) => o.productName && lower.includes(o.productName.toLowerCase())
  ) || null;
}