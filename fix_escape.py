import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Make ESC turn off translucent and labels
esc_new = """              case 'escape':
                  setCanvasMode('VIEW');
                  useStore.getState().setColorMode('');
                  clearMultiSelect();
                  useStore.getState().setSelected(null);
                  useStore.getState().setShowRowLabels(false);
                  useStore.getState().setShowRefLabels(false);
                  useStore.getState().setTranslucentMode(false);
                  break;"""

content = re.sub(r'              case \'escape\':\n                  setCanvasMode\(\'VIEW\'\);\n                  useStore\.getState\(\)\.setColorMode\(\'\'\);\n                  clearMultiSelect\(\);\n                  useStore\.getState\(\)\.setSelected\(null\);\n                  break;', esc_new, content)

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
