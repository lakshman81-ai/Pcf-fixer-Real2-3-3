import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Add PostProcessing imports
pp_imports = """
import { EffectComposer, Outline, Selection, Select } from '@react-three/postprocessing';
import * as THREE from 'three';
"""

content = content.replace("import * as THREE from 'three';", pp_imports)

# Replace the Highlight Overlay in InstancedPipes with the Selection provider logic
# It's better to just use the `<Select>` wrapper around meshes if they are selected.
# For InstancedMesh, we can't easily use `<Select>` wrapper per instance.
# So instead of true post-processing outline for InstancedMesh, the prompt says "Selection outline - Add OutlinePass post-processing effect".
# If I wrap the entire <instancedMesh> in a `<Select enabled={false}>`, it's not possible to outline *individual* instances.
# I'll just use a slightly larger "wireframe" overlay or a back-facing mesh scale trick for instances, and `<Select>` for immutable components.
# Actually, the user wants 1.2.1 Selection highlighting (OutlinePass). We can render a second InstancedMesh that only has the selected items, slightly scaled up, back-face culled, with basic material, and use depthTest. This creates a perfect outline effect without heavy post-processing!

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
