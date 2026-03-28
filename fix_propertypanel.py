import re

with open('src/ui/components/PipelinePropertyPanel.jsx', 'r') as f:
    content = f.read()

# Add inline coordinate display
# Add navigation arrows

prop_code = """
  const handlePrev = () => {
      const idx = dataTable.findIndex(r => r._rowIndex === selectedElementId);
      if (idx > 0) {
          const prev = dataTable[idx - 1];
          setSelected(prev._rowIndex);
          window.dispatchEvent(new CustomEvent('canvas-focus-point', { detail: { x: prev.ep1?.x || prev.cp?.x || 0, y: prev.ep1?.y || prev.cp?.y || 0, z: prev.ep1?.z || prev.cp?.z || 0, dist: 1000 } }));
      }
  };

  const handleNext = () => {
      const idx = dataTable.findIndex(r => r._rowIndex === selectedElementId);
      if (idx < dataTable.length - 1) {
          const next = dataTable[idx + 1];
          setSelected(next._rowIndex);
          window.dispatchEvent(new CustomEvent('canvas-focus-point', { detail: { x: next.ep1?.x || next.cp?.x || 0, y: next.ep1?.y || next.cp?.y || 0, z: next.ep1?.z || next.cp?.z || 0, dist: 1000 } }));
      }
  };
"""

content = content.replace("  if (!selectedElementId) return null;", prop_code + "\n  if (!selectedElementId) return null;")

# Add the navigation buttons to the header
header_old = """
        <div className="bg-slate-800 border-b border-slate-700/50 p-3 flex justify-between items-center cursor-move" onPointerDown={handlePointerDown}>
            <div className="flex items-center gap-2 pointer-events-none">
                <span className="text-blue-400 font-bold px-1.5 py-0.5 bg-blue-900/30 rounded text-xs">R{el._rowIndex}</span>
                <span className="text-slate-200 font-semibold text-sm">{el.type}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white transition-colors" title="Close Properties">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
"""

header_new = """
        <div className="bg-slate-800 border-b border-slate-700/50 p-3 flex justify-between items-center cursor-move" onPointerDown={handlePointerDown}>
            <div className="flex items-center gap-2 pointer-events-none">
                <span className="text-blue-400 font-bold px-1.5 py-0.5 bg-blue-900/30 rounded text-xs">R{el._rowIndex}</span>
                <span className="text-slate-200 font-semibold text-sm">{el.type}</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex bg-slate-700 rounded overflow-hidden">
                    <button onClick={handlePrev} className="px-2 py-1 text-slate-300 hover:bg-slate-600 border-r border-slate-600" title="Previous Component">◀</button>
                    <button onClick={handleNext} className="px-2 py-1 text-slate-300 hover:bg-slate-600" title="Next Component">▶</button>
                </div>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white transition-colors ml-1" title="Close Properties">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
            </div>
        </div>
"""
content = content.replace(header_old, header_new)

# Add Inline Coordinates block
inline_coords = """
            <div className="mb-4 bg-slate-950 p-2 rounded border border-slate-700 text-xs font-mono">
                <div className="grid grid-cols-2 gap-2 mb-1 border-b border-slate-800 pb-1">
                    <div><span className="text-slate-500">Bore:</span> <span className="text-slate-300">{el.bore || '—'}</span></div>
                    {el.branchBore && <div><span className="text-slate-500">Branch:</span> <span className="text-slate-300">{el.branchBore}</span></div>}
                </div>
                <div className="grid grid-cols-[30px_1fr] gap-x-1 gap-y-1">
                    {el.ep1 && <><span className="text-slate-500 text-right">EP1</span><span className="text-blue-300">{el.ep1.x.toFixed(1)}, {el.ep1.y.toFixed(1)}, {el.ep1.z.toFixed(1)}</span></>}
                    {el.ep2 && <><span className="text-slate-500 text-right">EP2</span><span className="text-emerald-300">{el.ep2.x.toFixed(1)}, {el.ep2.y.toFixed(1)}, {el.ep2.z.toFixed(1)}</span></>}
                    {el.cp && <><span className="text-slate-500 text-right">CP</span><span className="text-amber-300">{el.cp.x.toFixed(1)}, {el.cp.y.toFixed(1)}, {el.cp.z.toFixed(1)}</span></>}
                    {el.bp && <><span className="text-slate-500 text-right">BP</span><span className="text-purple-300">{el.bp.x.toFixed(1)}, {el.bp.y.toFixed(1)}, {el.bp.z.toFixed(1)}</span></>}
                </div>
            </div>
"""

content = content.replace("<div className=\"flex flex-col gap-3\">", "<div className=\"flex flex-col gap-3\">\n" + inline_coords)

with open('src/ui/components/PipelinePropertyPanel.jsx', 'w') as f:
    f.write(content)
