import re

with open('src/ui/tabs/DataTableTab.jsx', 'r') as f:
    content = f.read()

# Fix syntax error caused by `{renderSortHeader('bore', 'BORE', 'bg-blue-50/50')}` where it should just be a function call `renderSortHeader(...)` if it's right after `&&`
content = content.replace("&& {renderSortHeader", "&& renderSortHeader")

with open('src/ui/tabs/DataTableTab.jsx', 'w') as f:
    f.write(content)
