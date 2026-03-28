import re

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    content = f.read()

# Restore missing buttons (Config and Side Inspector) to the View or CFG group.
# Look for where I overwrote the `CFG` and side inspector.
# Wait, I didn't see CFG or Side Inspector anywhere in the file.
# Oh, it was at the top before I ran the `cat` command (I truncated the top). Let me grep for it.
