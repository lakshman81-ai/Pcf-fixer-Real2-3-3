import re

with open('src/ui/components/SideInspector.jsx', 'r') as f:
    content = f.read()

# Add `showSideInspector` to return null if not shown.
hide_code = """
  const showSideInspector = useStore(state => state.showSideInspector);

  if (!showSideInspector || !selectedElementId) return null;
"""
content = re.sub(r'  const pushHistory = useStore\(state => state\.pushHistory\);', hide_code + '\n  const pushHistory = useStore(state => state.pushHistory);', content)

# Or maybe it didn't return null before, but the user expects the toggle button to work.

with open('src/ui/components/SideInspector.jsx', 'w') as f:
    f.write(content)
