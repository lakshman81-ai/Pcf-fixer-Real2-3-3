import re

with open('src/engine/GapOverlap.js', 'r') as f:
    content = f.read()

# Wait, GapOverlap.js uses `gapMag >= 0.1`. The user's request says:
# "Tolerance presets: Hardcoded gatekeeper values (0.1mm absolute, bore tolerance)"
# The prompt asks for: "Add a UI panel with preset tolerance profiles: 'Tight (3mm)', 'Standard (6mm)', 'Loose (25mm)', 'Custom'. Store per-project."
# This UI should be in the Control Panel (which is `src/ui/tabs/CoreProcessorTab.jsx`).
# Let's check `src/ui/tabs/CoreProcessorTab.jsx` for the solver options.
