import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 4. R, Ref No translucent mode
# We need to change the translucent mode logic so that toggling labels implicitly toggles translucent mode OR we just respect the toggle buttons correctly.
# "R, Ref No. (no sure if working, change to translucent 40% mode, on Esc return to original state)"
# So the user wants the canvas to go translucent automatically when R or Ref is on.
# We can use a useEffect in EPLabelsLayer.
label_translucent = """
    // Automatically enable translucent mode when labels are active for better visibility
    useEffect(() => {
        if (showRowLabels || showRefLabels) {
            useStore.getState().setTranslucentMode(true);
        }
    }, [showRowLabels, showRefLabels]);
"""

content = re.sub(r'    useEffect\(\(\) => \{\n        if \(\(showRowLabels \|\| showRefLabels\) && dataTable\.length > 500\)', label_translucent + r'\n    useEffect(() => {\n        if ((showRowLabels || showRefLabels) && dataTable.length > 500)', content)

# 5. Translucent Icon Missing
# I did add the translucent icon in the last commit, but it seems I used an SVG that didn't render correctly or the user couldn't find it.
# It's currently `<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 12h18"/><path d="M12 3v18"/>`
# I'll replace it with a more obvious "Layers" or "Eye" style icon in ToolbarRibbon.jsx

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    tb_content = f.read()

icon_old = r'<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M3 12h18"/><path d="M12 3v18"/></svg>'
icon_new = r'<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>'

tb_content = re.sub(icon_old, icon_new, tb_content)

with open('src/ui/components/ToolbarRibbon.jsx', 'w') as f:
    f.write(tb_content)
