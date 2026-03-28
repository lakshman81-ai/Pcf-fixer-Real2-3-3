import re

with open('src/engine/PcfTopologyGraph2.js', 'r') as f:
    content = f.read()

# 1.1.1 Add tolerance presets. The default is hardcoded at 0.1
if 'const ABS_TOL = 0.1;' in content:
    content = content.replace('const ABS_TOL = 0.1;', 'let ABS_TOL = 0.1;')
    content = content.replace('const REL_TOL = 0.001;', 'let REL_TOL = 0.001;')

# Wait, this is deeply embedded in the engine. I should see how it's called first.
with open('src/engine/PcfTopologyGraph2.js', 'w') as f:
    f.write(content)
