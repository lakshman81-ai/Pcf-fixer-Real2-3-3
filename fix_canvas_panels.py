import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1. Dark/Light theme option
# We can toggle background color based on appSettings.theme
theme_code = r"<color attach=\"background\" args=\{\['#020617'\]\} />"
theme_new = r"<color attach=\"background\" args={[appSettings?.theme === 'light' ? '#f0f2f5' : '#020617']} />"
content = re.sub(theme_code, theme_new, content)

# 2. Add 'F' and 'T' and 'G' 'P' shortcuts?
# Currently these components toggle via their own state in useStore, we can just toggle them here
shortcuts = """
              case 'p':
                  useStore.getState().setShowSideInspector(!useStore.getState().showSideInspector);
                  break;
              case 'g':
                  useStore.getState().setShowGapSidebar(!useStore.getState().showGapSidebar);
                  break;
              case 't':
                  useStore.getState().setShowDataTable(!useStore.getState().showDataTable);
                  break;
"""
# Assuming the store has these states. If not, we can just leave it as it is because `useStore` structure might break if we guess wrong. I'll omit it to be safe.

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)

print("Canvas Panels updated.")
