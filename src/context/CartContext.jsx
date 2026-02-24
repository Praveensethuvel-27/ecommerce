import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { getProducts } from '../utils/api';
import { subscribeProductsChanged } from '../utils/realtime';

const CartContext = createContext(null);

function cartKey(item) {
  return `${item.productId}::${item.weight ?? ''}`;
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const payload = { ...action.payload, weight: action.payload.weight ?? '', quantity: action.payload.quantity || 1 };
      const key = cartKey(payload);
      const existing = state.items.find((i) => cartKey(i) === key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            cartKey(i) === key ? { ...i, quantity: i.quantity + payload.quantity } : i
          ),
        };
      }
      return {
        ...state,
        items: [...state.items, payload],
      };
    }
    case 'UPDATE_QUANTITY': {
      const key = cartKey(action.payload);
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter((i) => cartKey(i) !== key),
        };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          cartKey(i) === key ? { ...i, quantity: action.payload.quantity } : i
        ),
      };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => cartKey(i) !== cartKey(action.payload)),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
}

function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let active = true;
    getProducts()
      .then((list) => {
        if (active) setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const unsub = subscribeProductsChanged(() => {
      getProducts()
        .then((list) => setProducts(Array.isArray(list) ? list : []))
        .catch(() => {});
    });
    return unsub;
  }, []);

  const getPriceForWeight = (product, weight) => {
    if (!weight || !Array.isArray(product?.weightOptions) || product.weightOptions.length === 0) {
      return product?.price ?? 0;
    }
    const wo = product.weightOptions.find((w) => String(w.weight).trim() === String(weight).trim());
    return wo ? wo.price : product?.price ?? 0;
  };

  const cartItems = state.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return null;
    const price = getPriceForWeight(product, item.weight);
    return { ...product, quantity: item.quantity, weight: item.weight ?? '', cartPrice: price };
  }).filter(Boolean);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.cartPrice ?? item.price) * item.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 49;
  const total = subtotal + shipping;

  const addItem = (productId, quantity = 1, weight = '') => {
    dispatch({ type: 'ADD_ITEM', payload: { productId, quantity, weight } });
  };

  const updateQuantity = (productId, quantity, weight = '') => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity, weight } });
  };

  const removeItem = (productId, weight = '') => {
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, weight } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        subtotal,
        shipping,
        total,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

export { CartProvider, useCart };
