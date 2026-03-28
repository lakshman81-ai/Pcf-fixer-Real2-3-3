import re

with open('src/store/useStore.js', 'r') as f:
    content = f.read()

# Add states to store
state_block = """
  showSideInspector: false,
  setShowSideInspector: (val) => set({ showSideInspector: val }),
  showSettings: false,
  setShowSettings: (val) => set({ showSettings: val }),
"""

if "showSideInspector" not in content:
    content = content.replace("canvasMode: 'VIEW',", state_block + "\n  canvasMode: 'VIEW',")

with open('src/store/useStore.js', 'w') as f:
    f.write(content)
