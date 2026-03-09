import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCompareStore = create(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,
      
      toggleItem: (product) => {
        const { items, maxItems } = get();
        const exists = items.find(i => i.id === product.id);
        
        if (exists) {
           set({ items: items.filter(i => i.id !== product.id) });
           return { added: false, success: true };
        }
        
        if (items.length >= maxItems) {
           return { added: false, success: false, error: 'Maximum 4 items allowed' };
        }
        
        set({ items: [...items, product] });
        return { added: true, success: true };
      },
      
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter(i => i.id !== id) }));
      },
      
      clear: () => set({ items: [] })
    }),
    {
      name: 'compare-storage',
    }
  )
);

export default useCompareStore;
