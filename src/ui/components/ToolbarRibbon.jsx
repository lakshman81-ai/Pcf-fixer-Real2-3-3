import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useAppContext } from '../../store/AppContext';
import { FolderOpen, Pencil, FileText, Zap, Pointer, Move, Maximize, ZoomIn, Box, Grid, SquareDashedMousePointer, Search, Trash2, Camera, Compass, PenTool } from 'lucide-react';

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

const TextBtn = ({ onClick, title, label, icon: Icon, color = 'slate' }) => {
    const colors = {
        slate: "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600",
        orange: "bg-orange-900/50 hover:bg-orange-800 text-orange-400 border-orange-800",
        red: "bg-red-900/50 hover:bg-red-800 text-red-400 border-red-800",
        blue: "bg-blue-900/50 hover:bg-blue-800 text-blue-400 border-blue-800",
        emerald: "bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 border-emerald-800",
    };
    return (
        <button onClick={onClick} className={`px-2 py-1 text-[11px] font-medium rounded border transition flex items-center gap-1 ${colors[color]}`} title={title}>
            {Icon && <Icon className="w-3 h-3" />}
            {label}
        </button>
    );
};

export function ToolbarRibbon({ onFix6mm, onFix25mm, onAutoRef, onAutoCenter, onToggleSideInspector, showSideInspector, onPointerDown }) {
    const [activeTab, setActiveTab] = useState('TOOLS');

    const { canvasMode, setCanvasMode, orthoMode, toggleOrthoMode, multiSelectedIds, translucentMode, setTranslucentMode, colorMode, setColorMode } = useStore();
    const { dispatch } = useAppContext();

    const handleHide = () => useStore.getState().hideSelected();
    const handleIsolate = () => useStore.getState().isolateSelected();

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

    const handleUndo = () => useStore.getState().undo();

    return (
        <div className="z-40 bg-slate-900/95 backdrop-blur border border-slate-700 rounded shadow-xl flex flex-col pointer-events-auto"
             style={{ width: 'fit-content', minWidth: '400px' }}>

            {/* Quick Access / Top Row */}
            <div className="flex items-center justify-between px-2 bg-slate-800/80 border-b border-slate-700 cursor-move" onPointerDown={onPointerDown}>
                <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                    <button onClick={() => setActiveTab('FILE')} className={`px-3 py-1 text-xs font-semibold ${activeTab === 'FILE' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>FILE</button>
                    <button onClick={() => setActiveTab('ANALYSIS')} className={`px-3 py-1 text-xs font-semibold ${activeTab === 'ANALYSIS' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>ANALYSIS</button>
                    <button onClick={() => setActiveTab('VIEW')} className={`px-3 py-1 text-xs font-semibold ${activeTab === 'VIEW' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>VIEW</button>
                    <button onClick={() => setActiveTab('TOOLS')} className={`px-3 py-1 text-xs font-semibold ${activeTab === 'TOOLS' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>TOOLS</button>
                    <button onClick={() => setActiveTab('EXPORT')} className={`px-3 py-1 text-xs font-semibold ${activeTab === 'EXPORT' ? 'text-white border-b-2 border-blue-500' : 'text-slate-400 hover:text-slate-200'}`}>EXPORT</button>
                </div>

                {/* QAT */}
                <div className="flex items-center gap-2 pr-1" onPointerDown={(e) => e.stopPropagation()}>
                    <TextBtn onClick={() => setCanvasMode('DRAW_CANVAS')} color="emerald" label="Draw Canvas" icon={PenTool} title="Open Draw Canvas" />
                    <button className="text-slate-400 hover:text-white" title="Minimize Ribbon">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6"/></svg>
                    </button>
                </div>
            </div>

            {/* Tab Contents */}
            <div className="flex items-start px-2 py-2 gap-2 overflow-x-auto custom-scrollbar" onPointerDown={(e) => e.stopPropagation()}>

                {activeTab === 'FILE' && (
                    <>
                        <ToolGroup title="Config" shortTitle="CFG">
                            <ToolBtn onClick={() => useStore.getState().setShowSettings(true)} title="Settings">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                            </ToolBtn>
                        </ToolGroup>
                    </>
                )}

                {activeTab === 'ANALYSIS' && (
                    <>
                        <ToolGroup title="Auto Fixes" shortTitle="FIX">
                            <div className="flex gap-2">
                                <TextBtn onClick={onFix6mm} color="orange" label="Fix 6mm" icon={Zap} title="Auto-close all gaps <= 6mm" />
                                <TextBtn onClick={onFix25mm} color="red" label="Fix 25mm" icon={Zap} title="Insert pipe spool for gaps 6-25mm" />
                                <TextBtn onClick={onAutoRef} color="blue" label="Auto Pipe Ref" icon={Pencil} title="Auto-assign Pipeline Refs to blank components on branch" />
                            </div>
                        </ToolGroup>
                        <ToolGroup title="Check" shortTitle="CHK">
                            <ToolBtn active={useStore.getState().showGapRadar} onClick={() => useStore.getState().setShowGapRadar(!useStore.getState().showGapRadar)} color="amber" title="Toggle Gap Radar">
                                <Search className="w-4 h-4" />
                            </ToolBtn>
                        </ToolGroup>
                    </>
                )}

                {activeTab === 'VIEW' && (
                    <>
                        <ToolGroup title="Navigate" shortTitle="NAV">
                            <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas-set-view', { detail: { viewType: 'HOME' } }))} title="Fit All (F)">
                                <Maximize className="w-4 h-4" />
                            </ToolBtn>
                            <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas-auto-center'))} title="Zoom Selected (Z)">
                                <ZoomIn className="w-4 h-4" />
                            </ToolBtn>
                            <ToolBtn active={!useStore.getState().orthoMode} onClick={() => useStore.getState().toggleOrthoMode()} color="blue" title="Toggle Perspective / Orthographic (O)">
                                <Box className="w-4 h-4" />
                            </ToolBtn>
                            <ToolBtn active={useStore.getState().clippingPlaneEnabled} onClick={() => useStore.getState().setClippingPlaneEnabled(!useStore.getState().clippingPlaneEnabled)} color="slate" title="Toggle Section Box">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18"/><path d="M3 12h18"/><path d="M3 3h18v18H3z"/></svg>
                            </ToolBtn>
                        </ToolGroup>

                        <ToolGroup title="Visibility" shortTitle="VIS">
                            <ToolBtn active={useStore.getState().hiddenElementIds.length > 0} onClick={() => useStore.getState().unhideAll()} color="emerald" title="Show All Components (U)">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </ToolBtn>
                            <ToolBtn active={false} onClick={handleIsolate} color="amber" title="Isolate Selected (H)">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3"/><path d="M12 21V3"/></svg>
                            </ToolBtn>
                            <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                            <ToolBtn active={useStore.getState().translucentMode} onClick={() => useStore.getState().setTranslucentMode(!useStore.getState().translucentMode)} color="blue" title="Toggle Translucent View">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                            </ToolBtn>
                        </ToolGroup>

                        <ToolGroup title="Labels & Colors" shortTitle="LBL">
                            <ToolBtn active={useStore.getState().showRowLabels} onClick={() => useStore.getState().setShowRowLabels(!useStore.getState().showRowLabels)} title="Toggle Labels (L)">
                                <div className="font-bold text-xs">L</div>
                            </ToolBtn>
                            <ToolBtn active={useStore.getState().showRefLabels} onClick={() => useStore.getState().setShowRefLabels(!useStore.getState().showRefLabels)} title="Toggle Ref No.">
                                <div className="font-bold text-[10px]">Ref</div>
                            </ToolBtn>
                            <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                            <select
                                value={colorMode}
                                onChange={(e) => setColorMode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setColorMode('');
                                        e.target.blur();
                                    }
                                }}
                                className="h-7 bg-slate-700 text-slate-300 text-[11px] rounded border border-slate-600 px-2 outline-none focus:border-indigo-500 cursor-pointer w-24"
                            >
                                <option value="">Colors</option>
                                <option value="TYPE">By Type</option>
                                <option value="SPOOL">By Spool</option>
                                <option value="PIPELINE_REF">By Pipe Ref</option>
                                <option value="ERROR">By Error</option>
                            </select>
                        </ToolGroup>
                    </>
                )}

                {activeTab === 'TOOLS' && (
                    <>
                        <ToolGroup title="Select" shortTitle="SEL">
                            <ToolBtn active={canvasMode === 'MARQUEE_SELECT'} onClick={() => setCanvasMode(canvasMode === 'MARQUEE_SELECT' ? 'VIEW' : 'MARQUEE_SELECT')} color="blue" title="Box Select (B)">
                                <SquareDashedMousePointer className="w-4 h-4" />
                            </ToolBtn>
                            <ToolBtn active={canvasMode === 'MARQUEE_ZOOM'} onClick={() => setCanvasMode(canvasMode === 'MARQUEE_ZOOM' ? 'VIEW' : 'MARQUEE_ZOOM')} color="indigo" title="Box Zoom (Shift+B)">
                                <ZoomIn className="w-4 h-4" />
                            </ToolBtn>
                        </ToolGroup>

                        <ToolGroup title="Modify" shortTitle="MOD">
                            <ToolBtn active={canvasMode === 'CONNECT'} onClick={() => setCanvasMode(canvasMode === 'CONNECT' ? 'VIEW' : 'CONNECT')} color="amber" title="Connect (C)">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            </ToolBtn>
                            <ToolBtn active={canvasMode === 'STRETCH'} onClick={() => setCanvasMode(canvasMode === 'STRETCH' ? 'VIEW' : 'STRETCH')} color="emerald" title="Stretch (T)">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M15 16l4-4-4-4"/><path d="M9 8l-4 4 4 4"/></svg>
                            </ToolBtn>
                            <ToolBtn active={canvasMode === 'BREAK'} onClick={() => setCanvasMode(canvasMode === 'BREAK' ? 'VIEW' : 'BREAK')} color="red" title="Break (B)">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
                            </ToolBtn>
                            <ToolBtn active={canvasMode === 'INSERT_SUPPORT'} onClick={() => setCanvasMode(canvasMode === 'INSERT_SUPPORT' ? 'VIEW' : 'INSERT_SUPPORT')} color="emerald" title="Insert Support (I)">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V8"/><path d="M8 8h8"/><path d="M12 8l-3 -6h6z"/></svg>
                            </ToolBtn>
                            <ToolBtn onClick={handleDelete} color="red" title="Delete Selected (Del)">
                                <Trash2 className="w-4 h-4" />
                            </ToolBtn>
                        </ToolGroup>

                        <ToolGroup title="Measure" shortTitle="MEAS">
                            <ToolBtn active={canvasMode === 'MEASURE'} onClick={() => setCanvasMode(canvasMode === 'MEASURE' ? 'VIEW' : 'MEASURE')} color="amber" title="Measure (M)">
                                <Compass className="w-4 h-4" />
                            </ToolBtn>
                        </ToolGroup>
                    </>
                )}

                {activeTab === 'EXPORT' && (
                    <>
                        <ToolGroup title="Export" shortTitle="EXP">
                            <TextBtn onClick={() => alert("PCF Export logic here")} color="slate" label="PCF" icon={FileText} title="Export PCF" />
                            <TextBtn onClick={() => alert("CSV Export logic here")} color="slate" label="CSV" icon={Grid} title="Export CSV" />
                            <TextBtn onClick={() => alert("PNG Export logic here")} color="slate" label="PNG" icon={Camera} title="Export PNG" />
                        </ToolGroup>
                    </>
                )}

            </div>
        </div>
    );
}

export function ToolbarRibbon1(props) { return null; }
export function ToolbarRibbon2(props) { return null; }
