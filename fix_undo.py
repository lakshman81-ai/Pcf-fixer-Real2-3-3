import re

with open('src/store/useStore.js', 'r') as f:
    content = f.read()

# Add proper redo to useStore.js
redo_code = """
  // Undo/Redo tracking
  pastStates: [],
  futureStates: [],
  pushHistory: (actionName) => set((state) => {
    // keep up to 20 states
    const newPast = [...state.pastStates, state.dataTable].slice(-20);
    return { pastStates: newPast, futureStates: [] }; // clear future on new action
  }),
  undo: () => set((state) => {
    if (state.pastStates.length === 0) return state;
    const prev = state.pastStates[state.pastStates.length - 1];
    const newPast = state.pastStates.slice(0, -1);
    const newFuture = [state.dataTable, ...state.futureStates];

    // dispatch an event for AppContext to sync
    setTimeout(() => window.dispatchEvent(new CustomEvent('zustand-undo')), 0);

    return {
      dataTable: prev,
      pastStates: newPast,
      futureStates: newFuture
    };
  }),
  redo: () => set((state) => {
    if (state.futureStates.length === 0) return state;
    const next = state.futureStates[0];
    const newFuture = state.futureStates.slice(1);
    const newPast = [...state.pastStates, state.dataTable];

    setTimeout(() => window.dispatchEvent(new CustomEvent('zustand-redo')), 0);

    return {
      dataTable: next,
      pastStates: newPast,
      futureStates: newFuture
    };
  }),
"""

content = re.sub(r'pastStates: \[\],\s*pushHistory: .*?\},', redo_code, content, flags=re.DOTALL)
content = re.sub(r'undo: \(\) => set\(\(state\) => \{.*?\n  \}\),', '', content, flags=re.DOTALL) # remove old undo if it exists below


with open('src/store/useStore.js', 'w') as f:
    f.write(content)
