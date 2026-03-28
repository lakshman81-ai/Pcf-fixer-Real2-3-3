import re

with open('src/ui/components/GapSidebar.jsx', 'r') as f:
    content = f.read()

# Add search/filter gaps box
# Add resizable panel via CSS `resize-x` and `overflow-auto`
# Add Inline coordinate display

filter_state = """
    const [filterText, setFilterText] = useState('');
"""

content = content.replace("    const dataTable = useStore(state => state.dataTable);", "    const dataTable = useStore(state => state.dataTable);" + filter_state)

filter_logic = """
    const filteredGaps = useMemo(() => {
        if (!filterText) return gaps;
        const lower = filterText.toLowerCase();
        return gaps.filter(g =>
            String(g.elA._rowIndex).includes(lower) ||
            String(g.elB._rowIndex).includes(lower) ||
            g.elA.type?.toLowerCase().includes(lower) ||
            g.elB.type?.toLowerCase().includes(lower)
        );
    }, [gaps, filterText]);
"""

content = content.replace("    const handleZoomToGap = (gap) => {", filter_logic + "\n    const handleZoomToGap = (gap) => {")

# Update panel to be resizable and add search bar
panel_ui = """
    return (
        <div className={`bg-slate-900/90 border border-slate-700 shadow-xl rounded backdrop-blur flex flex-col pointer-events-auto transition-all ${isCollapsed ? 'w-48' : 'w-80 resize-x overflow-hidden max-w-[500px] min-w-[250px]'}`} style={{ maxHeight: 'calc(100vh - 12rem)' }}>
            <div className="flex items-center justify-between p-3 border-b border-slate-700/50 bg-slate-800/80 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                <div className="flex items-center gap-2">
                    <span className="text-amber-500">⚠</span>
                    <h3 className="text-sm font-bold text-slate-200">Gap Radar ({filteredGaps.length})</h3>
                </div>
                <button className="text-slate-400 hover:text-white">
                    {isCollapsed ? '▼' : '▲'}
                </button>
            </div>

            {!isCollapsed && (
                <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-2 border-b border-slate-700/50 bg-slate-800/40">
                        <input
                            type="text"
                            placeholder="Filter gaps..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                        />
                    </div>
                    <div className="overflow-y-auto p-2 flex flex-col gap-2 custom-scrollbar">
                        {filteredGaps.map((gap, i) => (
                            <div key={i} className="bg-slate-800/60 border border-slate-700 hover:border-amber-500/50 rounded p-2 cursor-pointer transition-colors group" onClick={() => handleZoomToGap(gap)}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="text-[10px] font-bold text-amber-500">Gap: {gap.dist.toFixed(1)}mm</div>
                                    <button className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity bg-slate-700 px-1.5 py-0.5 rounded">Zoom</button>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-300">R{gap.elA._rowIndex} <span className="text-slate-500 text-[10px]">{gap.elA.type}</span></span>
                                    <span className="text-slate-500 text-[10px]">➔</span>
                                    <span className="text-slate-300">R{gap.elB._rowIndex} <span className="text-slate-500 text-[10px]">{gap.elB.type}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
"""

content = re.sub(r'    return \(\n.*?\n    \);\n', panel_ui, content, flags=re.DOTALL)

with open('src/ui/components/GapSidebar.jsx', 'w') as f:
    f.write(content)
