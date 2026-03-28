import { create } from 'zustand';

export const useDrawStore = create((set) => ({
    // Drawing geometry
    drawnElements: [],
    addDrawnElement: (element) => set((state) => ({
        drawnElements: [...state.drawnElements, { ...element, _id: Date.now() + Math.random() }]
    })),
    updateDrawnElement: (id, updates) => set((state) => ({
        drawnElements: state.drawnElements.map(el => el._id === id ? { ...el, ...updates } : el)
    })),
    removeDrawnElement: (id) => set((state) => ({
        drawnElements: state.drawnElements.filter(el => el._id !== id)
    })),

    // Tool Modes
    activeTool: 'DRAW_PIPE', // 'DRAW_PIPE', 'DRAW_BEND', 'DRAW_TEE', 'INSERT_VALVE', 'SELECT', 'ORBIT'
    setActiveTool: (tool) => set({ activeTool: tool }),

    // Settings
    gridSnap: true,
    setGridSnap: (val) => set({ gridSnap: val }),
    snapResolution: 10,
    setSnapResolution: (val) => set({ snapResolution: val }),

    // Selection
    selectedIds: [],
    setSelectedIds: (ids) => set({ selectedIds: ids }),

    // Camera preset
    orthoMode: false,
    setOrthoMode: (val) => set({ orthoMode: val })
}));
