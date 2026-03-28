import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1. Double Click Zoom
# For InstancedPipes:
dc_handler = """
  const handleDoubleClick = (e) => {
      e.stopPropagation();
      const instanceId = e.instanceId;
      if (instanceId !== undefined && pipes[instanceId]) {
          const pipe = pipes[instanceId];
          window.dispatchEvent(new CustomEvent('canvas-auto-center', { detail: { elements: [pipe] } }));
      }
  };
"""
content = re.sub(r'const handlePointerMissed = \(e\) => \{', dc_handler + '\n  const handlePointerMissed = (e) => {', content)

# update instancedMesh to handle double click
content = content.replace("<instancedMesh ref={meshRef} args={[null, null, pipes.length]} onPointerDown={handlePointerDown} castShadow receiveShadow>", "<instancedMesh ref={meshRef} args={[null, null, pipes.length]} onPointerDown={handlePointerDown} onDoubleClick={handleDoubleClick} castShadow receiveShadow>")

# For ImmutableComponents:
imm_dc_handler = """
        const handleDoubleClick = (e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('canvas-auto-center', { detail: { elements: [el] } }));
        };
"""
content = re.sub(r'const handleSelect = \(e\) => \{', imm_dc_handler + '\n        const handleSelect = (e) => {', content)

# Update mesh in immutables to handle double click
content = re.sub(r'<mesh (.*?)onPointerDown=\{handleSelect\}', r'<mesh \1onPointerDown={handleSelect} onDoubleClick={handleDoubleClick}', content)
content = re.sub(r'<group (.*?)onPointerDown=\{handleSelect\}', r'<group \1onPointerDown={handleSelect} onDoubleClick={handleDoubleClick}', content)

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)

print("Camera Navigation updated.")
