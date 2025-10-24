import { create } from 'zustand';
import { Framework } from '@/lib/mock/data';

interface FrameworkState {
  frameworks: Framework[];
  activeFrameworkId: string | null;
  
  setFrameworks: (frameworks: Framework[]) => void;
  setActiveFramework: (id: string) => void;
  getActiveFramework: () => Framework | undefined;
}

export const useFrameworkStore = create<FrameworkState>((set, get) => ({
  frameworks: [],
  activeFrameworkId: null,
  
  setFrameworks: (frameworks) => {
    const active = frameworks.find((f) => f.isActive);
    set({
      frameworks,
      activeFrameworkId: active?.id || frameworks[0]?.id || null,
    });
  },
  
  setActiveFramework: (id) => set({ activeFrameworkId: id }),
  
  getActiveFramework: () => {
    const { frameworks, activeFrameworkId } = get();
    return frameworks.find((f) => f.id === activeFrameworkId);
  },
}));
