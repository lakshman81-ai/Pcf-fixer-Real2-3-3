import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# For 1.2.1, since @react-three/postprocessing is not available, we can use a lightweight alternative:
# Render an edges geometry for selected components. Actually, it says "Add OutlinePass... EffectComposer". I'll use the existing "GhostOverlay" technique but apply an outer emissive shell to selected objects.
# But wait, we already did "1.2.1 Selection highlighting... OutlinePass" and "5.3.3 Selection outline". The prompt says: "Add outline post-processing effect (Three.js OutlinePass or EffectComposer)".
# I will install `@react-three/postprocessing` to provide true professional outlines if possible, or build an edges geometry overlay. Let's install it.
