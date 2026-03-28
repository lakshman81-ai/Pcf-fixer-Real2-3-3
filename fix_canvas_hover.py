import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1. Update Hover Highlight for InstancedPipes
hover_code = """
  const hoveredElementId = useStore(state => state.hoveredElementId);
  const setHovered = useStore(state => state.setHovered);
"""

# inject hover tracking variables inside InstancedPipes component
content = re.sub(r'const InstancedPipes = \(\) => \{', r'const InstancedPipes = () => {\n' + hover_code, content)

# update colors in InstancedPipes
color_update = """
      const isSelected = multiSelectedIds.includes(element._rowIndex);
      const isHovered = hoveredElementId === element._rowIndex;

      if (isSelected) {
          colStr = '#eab308'; // yellow for selection
      } else if (isHovered) {
          colStr = '#fde047'; // lighter yellow for hover
      }
"""
content = re.sub(r'const isSelected = multiSelectedIds\.includes\(element\._rowIndex\);\s*if \(isSelected\) \{\s*colStr = \'#eab308\'; // yellow for selection\s*\}', color_update, content)

pointer_events = """
        <instancedMesh
            ref={meshRef}
            args={[null, null, pipes.length]}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
            onPointerMove={(e) => {
                const instanceId = e.instanceId;
                if (instanceId !== undefined && pipes[instanceId]) {
                    e.stopPropagation();
                    setHovered(pipes[instanceId]._rowIndex);
                }
            }}
            onPointerOut={() => setHovered(null)}
            castShadow
            receiveShadow
        >
"""
content = re.sub(r'<instancedMesh ref=\{meshRef\} args=\{\[null, null, pipes\.length\]\} onPointerDown=\{handlePointerDown\} onDoubleClick=\{handleDoubleClick\} castShadow receiveShadow>', pointer_events, content)


# 2. Update Hover Highlight for ImmutableComponents
imm_hover = """
  const hoveredElementId = useStore(state => state.hoveredElementId);
  const setHovered = useStore(state => state.setHovered);
"""

content = re.sub(r'const ImmutableComponents = \(\) => \{', r'const ImmutableComponents = () => {\n' + imm_hover, content)

imm_color_update = """
        const isSelected = multiSelectedIds.includes(el._rowIndex);
        const isHovered = hoveredElementId === el._rowIndex;
        if (isSelected) color = '#eab308';
        else if (isHovered) color = '#fde047';
"""
content = re.sub(r'const isSelected = multiSelectedIds\.includes\(el\._rowIndex\);\s*if \(isSelected\) color = \'#eab308\';', imm_color_update, content)

imm_pointer_events = """
        const handlePointerOver = (e) => {
            e.stopPropagation();
            setHovered(el._rowIndex);
        };
        const handlePointerOut = (e) => {
            setHovered(null);
        };
"""
content = re.sub(r'const handleSelect = \(e\) => \{', imm_pointer_events + '\n        const handleSelect = (e) => {', content)


# replace `<mesh ...>` tags to include `onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}`
content = re.sub(r'<mesh (.*?)onPointerDown=\{handleSelect\} onDoubleClick=\{handleDoubleClick\} castShadow receiveShadow>', r'<mesh \1onPointerDown={handleSelect} onDoubleClick={handleDoubleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} castShadow receiveShadow>', content)
content = re.sub(r'<group (.*?)onPointerDown=\{handleSelect\} onDoubleClick=\{handleDoubleClick\}>', r'<group \1onPointerDown={handleSelect} onDoubleClick={handleDoubleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>', content)

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)

print("Selection and Interactions hover logic updated.")
