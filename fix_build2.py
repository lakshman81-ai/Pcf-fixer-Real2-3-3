import re

with open('src/ui/tabs/DataTableTab.jsx', 'r') as f:
    content = f.read()

content = content.replace("renderSortHeader('_rowIndex', '# Row', 'sticky left-0 z-30 bg-slate-100')}", "renderSortHeader('_rowIndex', '# Row', 'sticky left-0 z-30 bg-slate-100')")
content = content.replace("renderSortHeader('type', 'Type', 'sticky left-[160px] z-30 bg-slate-100')}", "renderSortHeader('type', 'Type', 'sticky left-[160px] z-30 bg-slate-100')")
content = content.replace("renderSortHeader('bore', 'BORE', 'bg-blue-50/50')}}", "renderSortHeader('bore', 'BORE', 'bg-blue-50/50')}")

with open('src/ui/tabs/DataTableTab.jsx', 'w') as f:
    f.write(content)
