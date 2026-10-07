import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('luxe_cart');
    return saved ? JSON.parse(saved) : [
      { id: '1', name: 'عطر ميس ديور أو دو بارفان', price: 5900, qty: 1, image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300' },
      { id: '2', name: 'أحمر شفاه مايبيلين', price: 1950, qty: 1, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300' },
      { id: '3', name: 'كريم أساس لوريال باريس', price: 2850, qty: 1, image: 'https://images.unsplash.com/photo-1599733589046-10c005739ef9?w=300' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('luxe_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const shipping = cart.length > 0 ? 500 : 0;
  const discount = cart.length > 0 ? 1000 : 0;
  const total = Math.max(0, subtotal + shipping - discount);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQty, removeFromCart, subtotal, shipping, discount, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
