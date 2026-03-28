import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Fix syntax error caused by regex blind replacement earlier
content = content.replace("onPointerDown={(e) = castShadow receiveShadow> handlePointerDown(e, pipe)}>", "onPointerDown={(e) => handlePointerDown(e, pipe)}>")

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
