import re

with open("src/ui/tabs/CanvasTab.jsx", "r") as f:
    content = f.read()

content = content.replace("import DrawCanvas from '../draw_canvas/DrawCanvas';", "import { DrawCanvas } from '../draw_canvas/DrawCanvas';")

with open("src/ui/tabs/CanvasTab.jsx", "w") as f:
    f.write(content)

print("Fixed DrawCanvas import")
