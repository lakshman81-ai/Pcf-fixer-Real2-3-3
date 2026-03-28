import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

if "getColorModeValue" in content:
    print("Found getColorModeValue")

match1 = re.search(r"const val = getColorModeValue\(element, colorMode\);", content)
print("Match 1:", match1)
