import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Make sure Hover Element ID dependencies trigger rerender for InstancedPipes
# We need to add hoveredElementId to the dependency array of useEffect
content = content.replace("[pipes, dummy, colorMode, spools, c, multiSelectedIds]", "[pipes, dummy, colorMode, spools, c, multiSelectedIds, hoveredElementId]")

# Make sure tooltips track properly
# the tooltip already tracks `hoveredElementId` globally

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
