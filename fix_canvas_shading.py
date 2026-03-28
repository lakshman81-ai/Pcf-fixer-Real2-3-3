import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Fix the duplicate assignment caused by replace
content = content.replace("              colStr = getCAColor(val);\n              colStr = getCAColor(val);", "              colStr = getCAColor(val);")
content = content.replace("                color = getCAColor(val);\n                color = getCAColor(val);", "                color = getCAColor(val);")

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
