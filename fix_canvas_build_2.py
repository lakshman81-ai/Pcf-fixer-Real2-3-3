import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Fix syntax error caused by regex blind replacement earlier
content = content.replace("<color attach=\\\"background\\\" args={[appSettings?.theme === 'light' ? '#f0f2f5' : '#020617']} />", "<color attach=\"background\" args={[appSettings?.theme === 'light' ? '#f0f2f5' : '#020617']} />")

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
