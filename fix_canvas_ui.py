import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1. Hide/Show All
# In the Key Handler we have 'u' for unhideAll, let's add a button to the ToolbarRibbon or status bar
# wait, ToolbarRibbon is in another file, let's edit ToolbarRibbon.jsx

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    toolbar_content = f.read()

# Add Isolate to Select / Modify or Visibility
visibility_group = r'<ToolGroup title="Visibility" shortTitle="VIS">'
visibility_tools = """
                <ToolGroup title="Visibility" shortTitle="VIS">
                    <ToolBtn active={useStore.getState().hiddenElementIds.length > 0} onClick={() => useStore.getState().unhideAll()} color="emerald" title="Show All Components (U)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </ToolBtn>
                    <ToolBtn active={false} onClick={() => useStore.getState().isolateSelected()} color="amber" title="Isolate Selected (H)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12H3"/><path d="M12 21V3"/></svg>
                    </ToolBtn>
                    <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                    <ToolBtn active={useStore.getState().translucentMode} onClick={() => useStore.getState().setTranslucentMode(!useStore.getState().translucentMode)} color="blue" title="Toggle Translucent View">
"""
toolbar_content = re.sub(r'<ToolGroup title="Visibility" shortTitle="VIS">.*?</ToolGroup>', visibility_tools + '\n                </ToolGroup>', toolbar_content, flags=re.DOTALL)


# 2. Add Perspective toggle
view_group = r'<ToolGroup title="View" shortTitle="VIEW">'
view_tools = """
                <ToolGroup title="View" shortTitle="VIEW">
                    <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas-set-view', { detail: { viewType: 'HOME' } }))} title="Home / Reset View">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas-auto-center'))} title="Zoom to Fit">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14v4a2 2 0 0 0 2 2h4"/><path d="M20 10V6a2 2 0 0 0-2-2h-4"/><path d="M14 20h4a2 2 0 0 0 2-2v-4"/><path d="M4 10V6a2 2 0 0 1 2-2h4"/><circle cx="12" cy="12" r="2"/></svg>
                    </ToolBtn>
                    <ToolBtn active={!useStore.getState().orthoMode} onClick={() => useStore.getState().toggleOrthoMode()} color="blue" title="Toggle Perspective / Orthographic (O)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    </ToolBtn>
"""
toolbar_content = re.sub(r'<ToolGroup title="View" shortTitle="VIEW">.*?</ToolGroup>', view_tools + '\n                </ToolGroup>', toolbar_content, flags=re.DOTALL)


with open('src/ui/components/ToolbarRibbon.jsx', 'w') as f:
    f.write(toolbar_content)

print("Toolbar UI updated with new buttons.")
