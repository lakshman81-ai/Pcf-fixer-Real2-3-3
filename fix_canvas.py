import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1. Update ToolbarRibbon import
content = content.replace(
    "import { ToolbarRibbon } from '../components/ToolbarRibbon';",
    "import { ToolbarRibbon1, ToolbarRibbon2 } from '../components/ToolbarRibbon';"
)

# 2. Add getColorModeValue at top
# We will inject this right before the component definition. Let's find "const typeColor"
get_color_str = """
const getColorModeValue = (row, mode) => {
    if (!mode) return null;
    if (mode === 'PIPELINE_REF') return row.pipelineRef;
    if (mode === 'LINENO_KEY') return row.LINENO_KEY;
    if (mode === 'RATING') return row.RATING;
    if (mode === 'PIPING_CLASS') return row.PIPING_CLASS;
    if (mode.startsWith('CA')) {
        const num = mode.replace('CA', '');
        if (row.ca && row.ca[num]) return row.ca[num];
        if (row[`ca${num}`]) return row[`ca${num}`];
        if (row[`CA${num}`]) return row[`CA${num}`];
    }
    return row[mode] || null;
};
"""

content = content.replace(
    "const typeColor = (type, appSettings) => {",
    get_color_str + "\nconst typeColor = (type, appSettings) => {"
)

# 3. Translucency inside InstancedPipes
content = content.replace(
    "const dataTable = useStore(state => state.dataTable);",
    "const dataTable = useStore(state => state.dataTable);\n  const translucentMode = useStore(state => state.translucentMode);"
)
content = content.replace(
    "<meshStandardMaterial color=\"#3b82f6\" />",
    "<meshStandardMaterial color=\"#3b82f6\" transparent={translucentMode} opacity={translucentMode ? 0.4 : 1.0} depthWrite={!translucentMode} />"
)

# 4. Translucency inside ImmutableComponents
content = content.replace(
    "const appSettings = useStore(state => state.appSettings);",
    "const appSettings = useStore(state => state.appSettings);\n  const translucentMode = useStore(state => state.translucentMode);"
)

# ImmutableComponents uses multiple meshStandardMaterial, need to replace all that look like `<meshStandardMaterial color={`
content = content.replace(
    "<meshStandardMaterial color={isSelected ? '#eab308' : color} />",
    "<meshStandardMaterial color={isSelected ? '#eab308' : color} transparent={translucentMode} opacity={translucentMode ? 0.4 : 1.0} depthWrite={!translucentMode} />"
)
content = content.replace(
    "<meshStandardMaterial color={finalColor} />",
    "<meshStandardMaterial color={finalColor} transparent={translucentMode} opacity={translucentMode ? 0.4 : 1.0} depthWrite={!translucentMode} />"
)

# 5. Support CA150/CA100 Logic Fix
support_logic_old = """        if (type === 'SUPPORT') {
          const isRest = ['CA150', 'REST'].includes((el.type || '').toUpperCase()) ||
                         Object.values(el).some(v => typeof v === 'string' && ['CA150', 'REST'].includes(v.toUpperCase()));
          const isGui = ['CA100', 'GUI'].includes((el.type || '').toUpperCase()) ||
                        Object.values(el).some(v => typeof v === 'string' && ['CA100', 'GUI'].includes(v.toUpperCase()));"""

support_logic_new = """        if (type === 'SUPPORT') {
          const isRest = ['CA150', 'REST'].includes((el.type || '').toUpperCase()) ||
                         ['CA150', 'REST'].includes((el.skey || '').toUpperCase()) ||
                         ['CA150', 'REST'].includes((el.type_supp || '').toUpperCase()) ||
                         Object.values(el).some(v => typeof v === 'string' && ['CA150', 'REST'].includes(v.toUpperCase()));
          const isGui = ['CA100', 'GUI'].includes((el.type || '').toUpperCase()) ||
                        ['CA100', 'GUI'].includes((el.skey || '').toUpperCase()) ||
                        ['CA100', 'GUI'].includes((el.type_supp || '').toUpperCase()) ||
                        Object.values(el).some(v => typeof v === 'string' && ['CA100', 'GUI'].includes(v.toUpperCase()));"""

content = content.replace(support_logic_old, support_logic_new)

# 6. EPLabels depthTest
labels_old = """                        {showRowLabels && (
                            <Text position={[pt.x, pt.y + 30, pt.z]} color="#eab308" fontSize={50} outlineWidth={2} outlineColor="#0f172a">
                                R{el._rowIndex}
                            </Text>
                        )}
                        {showRefLabels && el.pipelineRef && (
                            <Text position={[pt.x, pt.y + 80, pt.z]} color="#38bdf8" fontSize={50} outlineWidth={2} outlineColor="#0f172a">
                                {el.pipelineRef}
                            </Text>
                        )}"""

labels_new = """                        {showRowLabels && (
                            <Text position={[pt.x, pt.y + 30, pt.z]} color="#eab308" fontSize={50} outlineWidth={2} outlineColor="#0f172a" depthTest={false}>
                                R{el._rowIndex}
                            </Text>
                        )}
                        {showRefLabels && el.pipelineRef && (
                            <Text position={[pt.x, pt.y + 80, pt.z]} color="#38bdf8" fontSize={50} outlineWidth={2} outlineColor="#0f172a" depthTest={false}>
                                {el.pipelineRef}
                            </Text>
                        )}"""
content = content.replace(labels_old, labels_new)

# 7. ESC key universal reset
esc_old = """              case 'escape':
                  setCanvasMode('VIEW');
                  clearMultiSelect();
                  useStore.getState().setSelected(null);
                  break;"""

esc_new = """              case 'escape':
                  setCanvasMode('VIEW');
                  useStore.getState().setColorMode('');
                  clearMultiSelect();
                  useStore.getState().setSelected(null);
                  break;"""
content = content.replace(esc_old, esc_new)

# 8. Render ToolbarRibbon1 and ToolbarRibbon2 instead of just one toolbar.
# Need to add state for the second toolbar.
state_old = """  const [toolbarPos, setToolbarPos] = useState({ x: 16, y: 16 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleToolbarPointerDown = (e) => {
    setIsDraggingToolbar(true);
    setDragOffset({
        x: e.clientX - toolbarPos.x,
        y: e.clientY - toolbarPos.y
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleToolbarPointerMove = (e) => {
    if (!isDraggingToolbar) return;
    setToolbarPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
    });
  };

  const handleToolbarPointerUp = (e) => {
    setIsDraggingToolbar(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };"""

state_new = """  const [toolbarPos, setToolbarPos] = useState({ x: 16, y: 16 });
  const [toolbar2Pos, setToolbar2Pos] = useState({ x: 16, y: 120 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [isDraggingToolbar2, setIsDraggingToolbar2] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleToolbarPointerDown = (e) => {
    setIsDraggingToolbar(true);
    setDragOffset({
        x: e.clientX - toolbarPos.x,
        y: e.clientY - toolbarPos.y
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleToolbarPointerMove = (e) => {
    if (!isDraggingToolbar) return;
    setToolbarPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
    });
  };

  const handleToolbarPointerUp = (e) => {
    setIsDraggingToolbar(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleToolbar2PointerDown = (e) => {
    setIsDraggingToolbar2(true);
    setDragOffset({
        x: e.clientX - toolbar2Pos.x,
        y: e.clientY - toolbar2Pos.y
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleToolbar2PointerMove = (e) => {
    if (!isDraggingToolbar2) return;
    setToolbar2Pos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
    });
  };

  const handleToolbar2PointerUp = (e) => {
    setIsDraggingToolbar2(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };"""
content = content.replace(state_old, state_new)

# Now replace the actual rendering
render_old = """      <div
        className="absolute z-40 pointer-events-auto shadow-lg"
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
        onPointerMove={handleToolbarPointerMove}
        onPointerUp={handleToolbarPointerUp}
      >
        <ToolbarRibbon
            onFix6mm={executeFix6mm}
            onFix25mm={executeFix25mm}
            onAutoRef={executeAutoPipelineRef}
            onAutoCenter={handleAutoCenter}
            onToggleSideInspector={() => setRightPanelOpen(!rightPanelOpen)}
            showSideInspector={rightPanelOpen}
            onPointerDown={handleToolbarPointerDown}
        />
      </div>"""

render_new = """      <div
        className="absolute z-40 pointer-events-auto shadow-lg"
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
        onPointerMove={handleToolbarPointerMove}
        onPointerUp={handleToolbarPointerUp}
      >
        <ToolbarRibbon1
            onAutoCenter={handleAutoCenter}
            onToggleSideInspector={() => setRightPanelOpen(!rightPanelOpen)}
            showSideInspector={rightPanelOpen}
            onPointerDown={handleToolbarPointerDown}
        />
      </div>

      <div
        className="absolute z-40 pointer-events-auto shadow-lg"
        style={{ left: toolbar2Pos.x, top: toolbar2Pos.y }}
        onPointerMove={handleToolbar2PointerMove}
        onPointerUp={handleToolbar2PointerUp}
      >
        <ToolbarRibbon2
            onFix6mm={executeFix6mm}
            onFix25mm={executeFix25mm}
            onAutoRef={executeAutoPipelineRef}
            onPointerDown={handleToolbar2PointerDown}
        />
      </div>"""
content = content.replace(render_old, render_new)

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)

print("CanvasTab replacements done.")
