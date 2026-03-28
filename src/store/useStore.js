import { create } from 'zustand';

// Decoupled, Atomic Zustand store primarily aimed at driving high-performance
// visual updates for the 3D Canvas without forcing global React Context re-renders.

export const useStore = create((set, get) => ({
  // The global source of truth for raw pipe geometries
  dataTable: [],

  // Proposals emitted from the SmartFixer
  proposals: [],

  // Method to approve/reject a proposal directly from Canvas
  setProposalStatus: (rowIndex, status) => set((state) => {
      // Find proposal matching the row and update its status
      const updatedProposals = state.proposals.map(prop => {
          if (prop.elementA?._rowIndex === rowIndex || prop.elementB?._rowIndex === rowIndex) {
              return { ...prop, _fixApproved: status };
          }
          return prop;
      });
      // Also sync back to dataTable so it is reflected globally when re-synced
      const updatedTable = state.dataTable.map(r =>
          r._rowIndex === rowIndex ? { ...r, _fixApproved: status } : r
      );

      // Need a way to tell the app context to sync from zustand.
      // We will dispatch a custom window event that StatusBar/AppContext can listen to.
      window.dispatchEvent(new CustomEvent('zustand-fix-status-changed', {
          detail: { rowIndex, status }
      }));

      return { proposals: updatedProposals, dataTable: updatedTable };
  }),

  // Canvas Mode Machine

  showSideInspector: false,
  setShowSideInspector: (val) => set({ showSideInspector: val }),
  showSettings: false,
  setShowSettings: (val) => set({ showSettings: val }),

  canvasMode: 'VIEW', // 'VIEW' | 'CONNECT' | 'STRETCH' | 'BREAK' | 'INSERT_SUPPORT' | 'MEASURE' | 'MARQUEE_SELECT' | 'MARQUEE_ZOOM' | 'MARQUEE_DELETE'
  setCanvasMode: (mode) => set({ canvasMode: mode }),


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

  interactionMode: 'ROTATE', // 'ROTATE' | 'PAN'
  setInteractionMode: (mode) => set({ interactionMode: mode }),

  // Undo Stack
  history: [],
  historyIdx: -1,
  pushHistory: (label) => set((state) => {
    // Take a deep snapshot of the current dataTable
    const snapshot = state.dataTable.map(r => ({
      ...r,
      ep1: r.ep1 ? { ...r.ep1 } : null,
      ep2: r.ep2 ? { ...r.ep2 } : null,
      cp: r.cp ? { ...r.cp } : null,
      bp: r.bp ? { ...r.bp } : null,
    }));

    // Slice off any redo history
    const newHistory = state.history.slice(0, state.historyIdx + 1);
    newHistory.push({ label, data: snapshot });

    // Buffer depth: 20
    if (newHistory.length > 20) {
      newHistory.shift();
    }
    return { history: newHistory, historyIdx: newHistory.length - 1 };
  }),


  // Selection & Toggles
  orthoMode: false,
  toggleOrthoMode: () => set((state) => ({ orthoMode: !state.orthoMode })),

  hiddenElementIds: [],
  setHiddenElementIds: (ids) => set({ hiddenElementIds: ids }),
  hideSelected: () => set((state) => {
    const toHide = [...state.multiSelectedIds];
    if (state.selectedElementId) toHide.push(state.selectedElementId);
    return {
      hiddenElementIds: [...new Set([...state.hiddenElementIds, ...toHide])],
      multiSelectedIds: [],
      selectedElementId: null
    };
  }),
  isolateSelected: () => set((state) => {
    const allIds = state.dataTable.map(r => r._rowIndex);
    const selectedIds = state.multiSelectedIds.length > 0 ? state.multiSelectedIds : (state.selectedElementId ? [state.selectedElementId] : []);
    const toHide = allIds.filter(id => !selectedIds.includes(id));
    return { hiddenElementIds: toHide };
  }),
  unhideAll: () => set({ hiddenElementIds: [] }),

  colorMode: 'TYPE', // 'TYPE' | 'SPOOL' | 'PIPELINE_REF'
  setColorMode: (mode) => set({ colorMode: mode }),

  multiSelectedIds: [],
  toggleMultiSelect: (id) => set((state) => {
    const isSelected = state.multiSelectedIds.includes(id);
    if (isSelected) {
      return { multiSelectedIds: state.multiSelectedIds.filter(selectedId => selectedId !== id) };
    } else {
      return { multiSelectedIds: [...state.multiSelectedIds, id] };
    }
  }),
  setMultiSelect: (ids) => set({ multiSelectedIds: ids }),
  clearMultiSelect: () => set({ multiSelectedIds: [] }),
  deleteElements: (ids) => set((state) => {
    const updatedTable = state.dataTable
      .filter(r => !ids.includes(r._rowIndex))
      .map((row, idx) => ({ ...row, _rowIndex: idx + 1 })); // Re-index after delete
    // Important: we also dispatch to AppContext in the CanvasTab
    return { dataTable: updatedTable, multiSelectedIds: [] };
  }),
  dragAxisLock: null, // 'X' | 'Y' | 'Z' | null
  setDragAxisLock: (axis) => set({ dragAxisLock: axis }),
  showRowLabels: false,
  setShowRowLabels: (show) => set({ showRowLabels: show }),
  showRefLabels: false,
  setShowRefLabels: (show) => set({ showRefLabels: show }),
  showGapRadar: false,
  setShowGapRadar: (show) => set({ showGapRadar: show }),

  showSettings: false,
  setShowSettings: (show) => set({ showSettings: show }),

  appSettings: {
    gridSnapResolution: 100,
    cameraFov: 45,
    cameraNear: 1,
    cameraFar: 500000,
    centerOrbitOnSelect: true,
    showGrid: true,
    showAxes: true,
    componentColors: {
      PIPE: '#cbd5e1',     // Light slate (subtle)
      BEND: '#94a3b8',     // Slate (subtle contrast)
      TEE: '#94a3b8',      // Slate
      OLET: '#64748b',     // Darker slate
      REDUCER: '#64748b',  // Darker slate
      VALVE: '#3b82f6',    // Blue
      FLANGE: '#60a5fa',   // Lighter blue
      SUPPORT: '#10b981'   // Emerald/Green (unique)
    }
  },
  updateAppSettings: (newSettings) => set(state => ({ appSettings: { ...state.appSettings, ...newSettings } })),

  // Measure tool
  contextMenu: null, // { x, y, rowIndex } or null
  setContextMenu: (menu) => set({ contextMenu: menu }),
  closeContextMenu: () => set({ contextMenu: null }),

  measurePts: [],
  addMeasurePt: (pt) => set((state) => {
    if (state.measurePts.length >= 2) return { measurePts: [pt] }; // reset on 3rd click
    return { measurePts: [...state.measurePts, pt] };
  }),
  clearMeasure: () => set({ measurePts: [] }),

  // Global snapping state
  cursorSnapPoint: null,
  setCursorSnapPoint: (pt) => set({ cursorSnapPoint: pt }),

  // Highlighting/Interaction state for the canvas
  selectedElementId: null,
  hoveredElementId: null,

  // Section Box / Clipping
  clippingPlaneEnabled: false,
  setClippingPlaneEnabled: (enabled) => set({ clippingPlaneEnabled: enabled }),

  // Sync function to mirror AppContext if required,
  // or act as the standalone state manager.
  setDataTable: (table) => set({ dataTable: table }),

  setProposals: (proposals) => set({ proposals }),

  // Interaction handlers
  setSelected: (id) => set({ selectedElementId: id }),
  setHovered: (id) => set({ hoveredElementId: id }),

  // A helper method that safely retrieves pipes only
  getPipes: () => {
    const s = get();
    return s.dataTable.filter(r => (r.type || "").toUpperCase() === 'PIPE' && !s.hiddenElementIds.includes(r._rowIndex));
  },

  // A helper method that safely retrieves all non-PIPE components for distinct 3D rendering
  // Note: We now include SUPPORT components in immutables so they render visibly.
  getImmutables: () => {
    const s = get();
    return s.dataTable.filter(r => (r.type || "").toUpperCase() !== 'PIPE' && !s.hiddenElementIds.includes(r._rowIndex));
  },

}));
