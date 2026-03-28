import re

with open('src/ui/tabs/DataTableTab.jsx', 'r') as f:
    content = f.read()

# Change initial state to empty set so nothing is hidden by default
content = content.replace("const [hiddenGroups, setHiddenGroups] = React.useState(() => new Set(['derived']));", "const [hiddenGroups, setHiddenGroups] = React.useState(() => new Set([]));")

with open('src/ui/tabs/DataTableTab.jsx', 'w') as f:
    f.write(content)

print("DataTable columns unhidden by default.")
