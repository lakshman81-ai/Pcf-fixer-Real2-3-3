import re

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    content = f.read()

# Fix the translucent mode button that got truncated in the previous replace
visibility_group = r"""<ToolGroup title="Visibility" shortTitle="VIS">
                    <ToolBtn active=\{useStore.getState\(\).hiddenElementIds.length > 0\} onClick=\{\(\) => useStore.getState\(\).unhideAll\(\)\} color="emerald" title="Show All Components \(U\)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </ToolBtn>
                    <ToolBtn active=\{false\} onClick=\{\(\) => useStore.getState\(\).isolateSelected\(\)\} color="amber" title="Isolate Selected \(H\)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3"/><path d="M12 21V3"/></svg>
                    </ToolBtn>
                    <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                    <ToolBtn active=\{useStore.getState\(\).translucentMode\} onClick=\{\(\) => useStore.getState\(\).setTranslucentMode\(!useStore.getState\(\).translucentMode\)\} color="blue" title="Toggle Translucent View">

                </ToolGroup>"""

new_visibility = """<ToolGroup title="Visibility" shortTitle="VIS">
                    <ToolBtn active={useStore.getState().hiddenElementIds.length > 0} onClick={() => useStore.getState().unhideAll()} color="emerald" title="Show All Components (U)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </ToolBtn>
                    <ToolBtn active={false} onClick={() => useStore.getState().isolateSelected()} color="amber" title="Isolate Selected (H)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3"/><path d="M12 21V3"/></svg>
                    </ToolBtn>
                    <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                    <ToolBtn active={useStore.getState().translucentMode} onClick={() => useStore.getState().setTranslucentMode(!useStore.getState().translucentMode)} color="blue" title="Toggle Translucent View">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>
                    </ToolBtn>
                </ToolGroup>"""

content = re.sub(visibility_group, new_visibility, content)

with open('src/ui/components/ToolbarRibbon.jsx', 'w') as f:
    f.write(content)
