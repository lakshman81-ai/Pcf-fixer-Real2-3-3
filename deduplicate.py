import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Replace any occurrence of multiple translucentMode declarations
# Find block where it happens
content = re.sub(r'const translucentMode = useStore\(state => state.translucentMode\);\n\s*const translucentMode = useStore\(state => state.translucentMode\);', 'const translucentMode = useStore(state => state.translucentMode);', content)

# And if they are separated by something
content = re.sub(r'const translucentMode = useStore\(state => state.translucentMode\);\n\s*const appSettings = useStore\(state => state.appSettings\);\n\s*const translucentMode = useStore\(state => state.translucentMode\);', 'const appSettings = useStore(state => state.appSettings);\n  const translucentMode = useStore(state => state.translucentMode);', content)

content = re.sub(r'const dataTable = useStore\(state => state.dataTable\);\n\s*const translucentMode = useStore\(state => state.translucentMode\);\n\s*const translucentMode = useStore\(state => state.translucentMode\);', 'const dataTable = useStore(state => state.dataTable);\n  const translucentMode = useStore(state => state.translucentMode);', content)

# Manual sweep to replace exactly 2 instances in same block
def deduplicate_decl(text, var_name):
    lines = text.split('\n')
    out = []
    seen = set()
    for line in lines:
        if var_name in line and "const " in line and "=" in line:
            if line.strip() in seen:
                continue
            seen.add(line.strip())
        out.append(line)
        # reset seen per component definition. we can guess by `const ` block end
        if line.strip() == "};" or line.strip() == "return (":
            seen.clear()
    return '\n'.join(out)

content = deduplicate_decl(content, "const translucentMode")

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
