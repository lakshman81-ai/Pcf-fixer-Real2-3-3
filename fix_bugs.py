import re

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    content = f.read()

# 1. Config icon - no popup
# The code dispatches 'open-settings'. Does anything listen?
# Let's check SettingsModal.jsx
