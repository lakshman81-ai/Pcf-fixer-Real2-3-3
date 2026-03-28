import re

with open('src/ui/tabs/DataTableTab.jsx', 'r') as f:
    content = f.read()

# Update COL_GROUPS derived to include new columns
new_content = re.sub(
    r"\{ key: 'derived',   label: 'Derived / Ptrs',  cols: \['diameter','wallThick','bendPtr','rigidPtr','intPtr'\] \}",
    "{ key: 'derived',   label: 'Derived / Ptrs',  cols: ['diameter','wallThick','bendPtr','rigidPtr','intPtr', 'LINENO_KEY', 'RATING', 'PIPING_CLASS'] }",
    content
)

with open('src/ui/tabs/DataTableTab.jsx', 'w') as f:
    f.write(new_content)

print("DataTableTab updated.")
