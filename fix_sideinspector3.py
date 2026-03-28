import re

with open('src/ui/components/SideInspector.jsx', 'r') as f:
    content = f.read()

# Fix the duplicate return null that might have happened if it already existed
content = re.sub(r'  if \(\!selectedElementId\) return null;', '', content)

with open('src/ui/components/SideInspector.jsx', 'w') as f:
    f.write(content)
