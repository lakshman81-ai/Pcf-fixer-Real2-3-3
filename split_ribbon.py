import re

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    content = f.read()

# Replace monolithic ToolbarRibbon with two separate ones

parts = content.split('return (')

imports = parts[0]
returns = parts[1]

new_content = """import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAppContext } from '../../store/AppContext';

const ToolGroup = ({ title, shortTitle, children }) => {
    const [collapsed, setCollapsed] = useState(false);
    if (collapsed) {
        return (
            <div className="flex flex-col border-r border-slate-700/50 pr-3 mr-3 last:border-0 last:mr-0 justify-center">
                <button onClick={() => setCollapsed(false)} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded border border-slate-600 transition-colors h-full flex items-center justify-center" title={`Expand ${title}`}>
                    {shortTitle}
                </button>
            </div>
        );
    }
    return (
        <div className="flex flex-col border-r border-slate-700/50 pr-3 mr-3 last:border-0 last:mr-0">
            <div className="flex items-center gap-1 mb-1 justify-center">{children}</div>
            <div className="flex items-center justify-center gap-1 mt-auto">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider text-center font-semibold">{title}</span>
                <button onClick={() => setCollapsed(true)} className="text-slate-500 hover:text-slate-300 transition-colors" title="Collapse Group">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
            </div>
        </div>
    );
};

const ToolBtn = ({ active, onClick, title, children, color = 'slate' }) => {
    const base = "w-8 h-8 flex items-center justify-center rounded transition-colors duration-200 relative group";
    const colors = {
        slate: active ? "bg-slate-600 text-white shadow-inner" : "text-slate-400 hover:bg-slate-700 hover:text-slate-200",
        amber: active ? "bg-amber-600 text-white shadow-inner" : "text-amber-500 hover:bg-amber-900/50 hover:text-amber-400",
        emerald: active ? "bg-emerald-600 text-white shadow-inner" : "text-emerald-500 hover:bg-emerald-900/50 hover:text-emerald-400",
        red: active ? "bg-red-600 text-white shadow-inner" : "text-red-500 hover:bg-red-900/50 hover:text-red-400",
        blue: active ? "bg-blue-600 text-white shadow-inner" : "text-blue-500 hover:bg-blue-900/50 hover:text-blue-400",
        indigo: active ? "bg-indigo-600 text-white shadow-inner" : "text-indigo-500 hover:bg-indigo-900/50 hover:text-indigo-400",
    };
    return (
        <button onClick={onClick} className={`${base} ${colors[color]}`} title={title}>
            {children}
        </button>
    );
};

const TextBtn = ({ onClick, title, label, color = 'slate' }) => {
    const colors = {
        slate: "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600",
        orange: "bg-orange-900/50 hover:bg-orange-800 text-orange-400 border-orange-800",
        red: "bg-red-900/50 hover:bg-red-800 text-red-400 border-red-800",
        blue: "bg-blue-900/50 hover:bg-blue-800 text-blue-400 border-blue-800",
    };
    return (
        <button onClick={onClick} className={`px-2 py-1 text-[11px] font-medium rounded border transition ${colors[color]}`} title={title}>
            {label}
        </button>
    );
};

export function ToolbarRibbon({ onFix6mm, onFix25mm, onAutoRef, onAutoCenter, onToggleSideInspector, showSideInspector, onPointerDown }) {
    // This is a stub, replaced by ToolbarRibbon1 and 2
    return null;
}

export function ToolbarRibbon1({ onAutoCenter, onToggleSideInspector, showSideInspector, onPointerDown }) {
    const { canvasMode, setCanvasMode, orthoMode, toggleOrthoMode, multiSelectedIds, translucentMode, setTranslucentMode } = useStore();
    const { dispatch } = useAppContext();

    const handleHide = () => {
        useStore.getState().hideSelected();
    };

    const handleIsolate = () => {
        useStore.getState().isolateSelected();
    };

    const handleDelete = () => {
        const { multiSelectedIds, selectedElementId, pushHistory, deleteElements } = useStore.getState();
        const idsToDelete = multiSelectedIds.length > 0 ? multiSelectedIds : (selectedElementId ? [selectedElementId] : []);

        if (idsToDelete.length > 0) {
            if (window.confirm(`Delete ${idsToDelete.length} elements?`)) {
                pushHistory('Delete from Ribbon');
                dispatch({ type: "DELETE_ELEMENTS", payload: { rowIndices: idsToDelete } });
                deleteElements(idsToDelete);
            }
        }
    };

    const handleResetView = () => {
        useStore.getState().setHiddenElementIds([]);
        window.dispatchEvent(new CustomEvent('canvas-reset-view'));
    };

    const handleUndo = () => {
        useStore.getState().undo();
    };

    return (
        <div className={`z-40 bg-slate-900/95 backdrop-blur border border-slate-700 rounded shadow-xl flex flex-col pointer-events-auto`}>
            <div className={`flex items-start px-2 py-2 gap-2 overflow-x-auto custom-scrollbar`}>
                <div
                    className="flex flex-col items-center justify-center gap-1 h-full cursor-move pr-2 border-r border-slate-700/50 hover:bg-slate-800 rounded p-1 transition-colors self-center"
                    title="Drag to move toolbar"
                    onPointerDown={onPointerDown}
                >
                    <div className="w-1 h-1 bg-slate-500 rounded-full pointer-events-none"></div>
                    <div className="w-1 h-1 bg-slate-500 rounded-full pointer-events-none"></div>
                    <div className="w-1 h-1 bg-slate-500 rounded-full pointer-events-none"></div>
                </div>

                <ToolGroup title="Config" shortTitle="CFG">
                    <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))} title="Settings">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={handleUndo} title="Undo (Ctrl+Z)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                    </ToolBtn>
                    <ToolBtn active={showSideInspector} onClick={onToggleSideInspector} title="Toggle Side Panel">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
                    </ToolBtn>
                </ToolGroup>

                <ToolGroup title="View" shortTitle="VIEW">
                    <ToolBtn active={orthoMode} onClick={toggleOrthoMode} title="Orthographic (O)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={onAutoCenter} title="Fit Scene / Selected (F)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={handleResetView} color="emerald" title="Unhide All & Reset View (R)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </ToolBtn>
                </ToolGroup>

                <ToolGroup title="Visibility" shortTitle="VIS">
                    <ToolBtn onClick={handleHide} title="Hide Selected (Shift+H)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={handleIsolate} title="Isolate Selected (H)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </ToolBtn>
                    <ToolBtn active={translucentMode} onClick={() => setTranslucentMode(!translucentMode)} color="blue" title="Toggle Translucent View">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 2v20"/></svg>
                    </ToolBtn>
                </ToolGroup>

                <ToolGroup title="Labels" shortTitle="LBL">
                    <ToolBtn active={useStore.getState().showRowLabels} onClick={() => useStore.getState().setShowRowLabels(!useStore.getState().showRowLabels)} title="Toggle Row No. (R)">
                        <div className="font-bold text-xs">R</div>
                    </ToolBtn>
                    <ToolBtn active={useStore.getState().showRefLabels} onClick={() => useStore.getState().setShowRefLabels(!useStore.getState().showRefLabels)} title="Toggle Ref No.">
                        <div className="font-bold text-[10px]">Ref</div>
                    </ToolBtn>
                    <ToolBtn active={useStore.getState().showGapRadar} onClick={() => useStore.getState().setShowGapRadar(!useStore.getState().showGapRadar)} color="amber" title="Toggle Gap Radar">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <circle cx="12" cy="12" r="6"/>
                            <circle cx="12" cy="12" r="2"/>
                        </svg>
                    </ToolBtn>
                </ToolGroup>

                <ToolGroup title="Select / Modify" shortTitle="SEL">
                    <ToolBtn active={canvasMode === 'MARQUEE_SELECT'} onClick={() => setCanvasMode(canvasMode === 'MARQUEE_SELECT' ? 'VIEW' : 'MARQUEE_SELECT')} color="blue" title="Marquee Select">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 4" /></svg>
                    </ToolBtn>
                    <ToolBtn active={canvasMode === 'MARQUEE_ZOOM'} onClick={() => setCanvasMode(canvasMode === 'MARQUEE_ZOOM' ? 'VIEW' : 'MARQUEE_ZOOM')} color="indigo" title="Marquee Zoom">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><rect x="8" y="8" width="6" height="6" strokeDasharray="2 2"/></svg>
                    </ToolBtn>
                    <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                    <ToolBtn active={canvasMode === 'MARQUEE_DELETE'} onClick={() => setCanvasMode(canvasMode === 'MARQUEE_DELETE' ? 'VIEW' : 'MARQUEE_DELETE')} color="red" title="Box Delete">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeDasharray="4 4"/><path d="M9 9l6 6M15 9l-6 6"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={handleDelete} color="red" title="Delete Selected (Del)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </ToolBtn>
                </ToolGroup>

                <ToolGroup title="Edit Modes" shortTitle="EDIT">
                    <ToolBtn active={canvasMode === 'CONNECT'} onClick={() => setCanvasMode(canvasMode === 'CONNECT' ? 'VIEW' : 'CONNECT')} color="amber" title="Connect (C)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    </ToolBtn>
                    <ToolBtn active={canvasMode === 'STRETCH'} onClick={() => setCanvasMode(canvasMode === 'STRETCH' ? 'VIEW' : 'STRETCH')} color="emerald" title="Stretch (T)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M15 16l4-4-4-4"/><path d="M9 8l-4 4 4 4"/></svg>
                    </ToolBtn>
                    <ToolBtn active={canvasMode === 'BREAK'} onClick={() => setCanvasMode(canvasMode === 'BREAK' ? 'VIEW' : 'BREAK')} color="red" title="Break (B)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                    </ToolBtn>
                    <ToolBtn active={canvasMode === 'MEASURE'} onClick={() => setCanvasMode(canvasMode === 'MEASURE' ? 'VIEW' : 'MEASURE')} color="amber" title="Measure (M)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 1 0 2.829 2.828z"/><path d="m6.3 14.5-4 4"/><path d="m16 5.3-4 4"/></svg>
                    </ToolBtn>
                    <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                    <ToolBtn active={useStore.getState().clippingPlaneEnabled} onClick={() => useStore.getState().setClippingPlaneEnabled(!useStore.getState().clippingPlaneEnabled)} color="slate" title="Toggle Section Box">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M3 3h18v18H3z"/></svg>
                    </ToolBtn>
                    <ToolBtn active={canvasMode === 'INSERT_SUPPORT'} onClick={() => setCanvasMode(canvasMode === 'INSERT_SUPPORT' ? 'VIEW' : 'INSERT_SUPPORT')} color="emerald" title="Insert Support (I)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V8"/><path d="M8 8h8"/><path d="M12 8l-3 -6h6z"/></svg>
                    </ToolBtn>
                    <ToolBtn active={canvasMode === 'ASSIGN_PIPELINE'} onClick={() => setCanvasMode(canvasMode === 'ASSIGN_PIPELINE' ? 'VIEW' : 'ASSIGN_PIPELINE')} color="blue" title="Assign Pipeline Ref">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    </ToolBtn>
                </ToolGroup>
            </div>
        </div>
    );
}

export function ToolbarRibbon2({ onFix6mm, onFix25mm, onAutoRef, onPointerDown }) {
    const { colorMode, setColorMode } = useStore();

    return (
        <div className={`z-40 bg-slate-900/95 backdrop-blur border border-slate-700 rounded shadow-xl flex flex-col pointer-events-auto`}>
            <div className={`flex items-start px-2 py-2 gap-2 overflow-x-auto custom-scrollbar`}>
                <div
                    className="flex flex-col items-center justify-center gap-1 h-full cursor-move pr-2 border-r border-slate-700/50 hover:bg-slate-800 rounded p-1 transition-colors self-center"
                    title="Drag to move toolbar"
                    onPointerDown={onPointerDown}
                >
                    <div className="w-1 h-1 bg-slate-500 rounded-full pointer-events-none"></div>
                    <div className="w-1 h-1 bg-slate-500 rounded-full pointer-events-none"></div>
                    <div className="w-1 h-1 bg-slate-500 rounded-full pointer-events-none"></div>
                </div>

                <ToolGroup title="Auto Fixes" shortTitle="FIX">
                    <div className="flex gap-2">
                        <TextBtn onClick={onFix6mm} color="orange" label="Fix 6mm" title="Auto-close all gaps ≤ 6mm" />
                        <TextBtn onClick={onFix25mm} color="red" label="Fix 25mm" title="Insert pipe spool for gaps 6-25mm" />
                        <TextBtn onClick={onAutoRef} color="blue" label="Auto Pipe Ref" title="Auto-assign Pipeline Refs to blank components on branch" />
                    </div>
                </ToolGroup>

                <ToolGroup title="Shading" shortTitle="SHADE">
                    <select
                        value={colorMode}
                        onChange={(e) => setColorMode(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                                setColorMode('');
                                e.target.blur();
                            }
                        }}
                        className="h-7 bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-600 px-2 outline-none focus:border-indigo-500 cursor-pointer w-32"
                    >
                        <option value="">None (Default)</option>
                        <option value="TYPE">Color by Type</option>
                        <option value="SPOOL">Color by Spool</option>
                        <option value="PIPELINE_REF">Color by Pipeline Ref</option>
                        <option value="ERROR">Color by Error</option>
                        <option value="LINENO_KEY">Color by LineNo Key</option>
                        <option value="RATING">Color by Rating</option>
                        <option value="PIPING_CLASS">Color by Piping Class</option>
                        {[97,98,1,2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={`ca${n}`} value={`CA${n}`}>Color by CA{n}</option>
                        ))}
                    </select>
                </ToolGroup>
            </div>
        </div>
    );
}
"""

with open('src/ui/components/ToolbarRibbon.jsx', 'w') as f:
    f.write(new_content)

print("Toolbar split into 1 and 2.")
