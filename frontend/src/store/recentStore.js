import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useRecentStore = create(
  persist(
    (set, get) => ({
      items: [], // Array of simplified product objects
      maxItems: 12,
      
      addViewedProduct: (product) => {
        const { items, maxItems } = get();
        
        // Remove if exists to put it at the beginning
        const filtered = items.filter(i => i.id !== product.id);
        
        // Simplified object to save space in localStorage
        const slimProduct = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image || product.images?.[0] || null,
          vendor_name: product.vendor_name,
        };
        
        const newItems = [slimProduct, ...filtered].slice(0, maxItems);
        
        set({ items: newItems });
      },
      
      clear: () => set({ items: [] })
    }),
    {
      name: 'recently-viewed',
    }
  )
);

export default useRecentStore;
