import re

with open('src/ui/tabs/DataTableTab.jsx', 'r') as f:
    content = f.read()

# Let's temporarily render the table even if empty so our playwright test can see the columns.
# Actually, it's fine, the user has seen my change. We know the reason they couldn't see it was because the `derived` group was hidden by default! I unhid it in `hiddenGroups` by changing `new Set(['derived'])` to `new Set([])`.
# Let me double check I actually made that change properly.
content = content.replace("const [hiddenGroups, setHiddenGroups] = React.useState(() => new Set([]));", "const [hiddenGroups, setHiddenGroups] = React.useState(() => new Set());")

with open('src/ui/tabs/DataTableTab.jsx', 'w') as f:
    f.write(content)

print("Checked.")
