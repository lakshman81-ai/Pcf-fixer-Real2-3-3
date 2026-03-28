import re

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    content = f.read()

# Add Camera Presets to the View Group
view_group = r"""<ToolGroup title="View" shortTitle="VIEW">
                    <ToolBtn onClick=\{\(\) => window\.dispatchEvent\(new CustomEvent\('canvas-set-view', \{ detail: \{ viewType: 'HOME' \} \}\)\)\} title="Home / Reset View">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick=\{\(\) => window\.dispatchEvent\(new CustomEvent\('canvas-auto-center'\)\)\} title="Zoom to Fit">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14v4a2 2 0 0 0 2 2h4"/><path d="M20 10V6a2 2 0 0 0-2-2h-4"/><path d="M14 20h4a2 2 0 0 0 2-2v-4"/><path d="M4 10V6a2 2 0 0 1 2-2h4"/><circle cx="12" cy="12" r="2"/></svg>
                    </ToolBtn>
                    <ToolBtn active=\{\!useStore\.getState\(\)\.orthoMode\} onClick=\{\(\) => useStore\.getState\(\)\.toggleOrthoMode\(\)\} color="blue" title="Toggle Perspective / Orthographic \(O\)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    </ToolBtn>"""

new_view = """<ToolGroup title="View" shortTitle="VIEW">
                    <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas-set-view', { detail: { viewType: 'HOME' } }))} title="Home / Reset View">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </ToolBtn>
                    <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas-auto-center'))} title="Zoom to Fit">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 14v4a2 2 0 0 0 2 2h4"/><path d="M20 10V6a2 2 0 0 0-2-2h-4"/><path d="M14 20h4a2 2 0 0 0 2-2v-4"/><path d="M4 10V6a2 2 0 0 1 2-2h4"/><circle cx="12" cy="12" r="2"/></svg>
                    </ToolBtn>
                    <ToolBtn active={!useStore.getState().orthoMode} onClick={() => useStore.getState().toggleOrthoMode()} color="blue" title="Toggle Perspective / Orthographic (O)">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    </ToolBtn>
                    <div className="w-px h-6 bg-slate-700 mx-1 self-center"></div>
                    <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas-save-camera', { detail: { preset: 'A' } }))} title="Save Camera Preset A">
                        <div className="font-bold text-[10px]">S-A</div>
                    </ToolBtn>
                    <ToolBtn onClick={() => window.dispatchEvent(new CustomEvent('canvas-load-camera', { detail: { preset: 'A' } }))} title="Load Camera Preset A">
                        <div className="font-bold text-[10px]">L-A</div>
                    </ToolBtn>"""

content = re.sub(view_group, new_view, content)

with open('src/ui/components/ToolbarRibbon.jsx', 'w') as f:
    f.write(content)
