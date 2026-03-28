import re

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    content = f.read()

# 1. Update imports and destructure translucentMode
content = content.replace(
    'const { canvasMode, setCanvasMode, colorMode, setColorMode, orthoMode, toggleOrthoMode, multiSelectedIds } = useStore();',
    'const { canvasMode, setCanvasMode, colorMode, setColorMode, orthoMode, toggleOrthoMode, multiSelectedIds, translucentMode, setTranslucentMode } = useStore();'
)

# 2. Update ToolGroup to have local collapse state
old_toolgroup = """    const ToolGroup = ({ title, children }) => (
        <div className="flex flex-col border-r border-slate-700/50 pr-3 mr-3 last:border-0 last:mr-0">
            <div className="flex items-center gap-1 mb-1 justify-center">{children}</div>
            {!isCollapsed && <span className="text-[10px] text-slate-500 uppercase tracking-wider text-center font-semibold mt-auto">{title}</span>}
        </div>
    );"""

new_toolgroup = """    const ToolGroup = ({ title, shortTitle, children }) => {
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
    };"""
content = content.replace(old_toolgroup, new_toolgroup)

# 3. Add translucent icon to visibility
vis_old = """                <ToolGroup title="Visibility" shortTitle="VIS">
                    <ToolBtn onClick={handleHide} title="Hide Selected (Shift+H)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={handleIsolate} title="Isolate Selected (H)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </ToolBtn>
                </ToolGroup>"""

vis_new = """                <ToolGroup title="Visibility" shortTitle="VIS">
                    <ToolBtn onClick={handleHide} title="Hide Selected (Shift+H)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={handleIsolate} title="Isolate Selected (H)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    </ToolBtn>
                    <ToolBtn active={translucentMode} onClick={() => setTranslucentMode(!translucentMode)} color="blue" title="Toggle Translucent View">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.6"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 2v20"/></svg>
                    </ToolBtn>
                </ToolGroup>"""
content = content.replace(vis_old, vis_new)

# 4. Support Icon
support_old = '<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>'
support_new = '<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22V8"/><path d="M8 8h8"/><path d="M12 8l-3 -6h6z"/></svg>'
content = content.replace(support_old, support_new)

# 5. Color Mode Dropdown Options
color_old = """                        <option value="ERROR">Color by Error</option>
                        {[97,98,1,2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={`ca${n}`} value={`CA${n}`}>Color by CA{n}</option>
                        ))}"""

color_new = """                        <option value="ERROR">Color by Error</option>
                        <option value="LINENO_KEY">Color by LineNo Key</option>
                        <option value="RATING">Color by Rating</option>
                        <option value="PIPING_CLASS">Color by Piping Class</option>
                        {[97,98,1,2,3,4,5,6,7,8,9,10].map(n => (
                            <option key={`ca${n}`} value={`CA${n}`}>Color by CA{n}</option>
                        ))}"""
content = content.replace(color_old, color_new)

with open('src/ui/components/ToolbarRibbon.jsx', 'w') as f:
    f.write(content)

print("Toolbar replacements done.")
