import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Let's fix the Select wrapper injection which probably created unbalanced tags.
# I will revert the CanvasTab.jsx and apply it carefully.
