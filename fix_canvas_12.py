import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1.2.1 Selection OutlinePass highlighting
# `OutlinePass` requires `@react-three/postprocessing` or standard three.js passes.
# If postprocessing is not installed, it breaks the app.
# Let's check if it's installed.
