import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Fix syntax error caused by regex blind replacement earlier
content = content.replace("receiveShadow castShadow receiveShadow>", "receiveShadow>")
content = content.replace("castShadow receiveShadow castShadow receiveShadow>", "castShadow receiveShadow>")
content = content.replace("onPointerDown={handleSelect} onDoubleClick={handleDoubleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} castShadow receiveShadow onDoubleClick={handleDoubleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}", "onPointerDown={handleSelect} onDoubleClick={handleDoubleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} castShadow receiveShadow")

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
