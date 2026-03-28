import re

with open('src/store/useStore.js', 'r') as f:
    content = f.read()

redo_code = """
  // Global Undo/Redo stack for UI actions
  pastStates: [],
  futureStates: [],
  pushHistory: (actionName) => set((state) => {
      const newPast = [...state.pastStates, state.dataTable].slice(-20);
      return { pastStates: newPast, futureStates: [] };
  }),
  undo: () => set((state) => {
      if (state.pastStates.length === 0) return state;
      const prev = state.pastStates[state.pastStates.length - 1];
      const newPast = state.pastStates.slice(0, -1);
      const newFuture = [state.dataTable, ...state.futureStates];
      setTimeout(() => window.dispatchEvent(new CustomEvent('zustand-undo')), 0);
      return { dataTable: prev, pastStates: newPast, futureStates: newFuture };
  }),
  redo: () => set((state) => {
      if (state.futureStates.length === 0) return state;
      const next = state.futureStates[0];
      const newFuture = state.futureStates.slice(1);
      const newPast = [...state.pastStates, state.dataTable];
      setTimeout(() => window.dispatchEvent(new CustomEvent('zustand-redo')), 0);
      return { dataTable: next, pastStates: newPast, futureStates: newFuture };
  }),

"""

content = content.replace("  interactionMode: 'ROTATE', // 'ROTATE' | 'PAN'", redo_code + "  interactionMode: 'ROTATE', // 'ROTATE' | 'PAN'")

with open('src/store/useStore.js', 'w') as f:
    f.write(content)
