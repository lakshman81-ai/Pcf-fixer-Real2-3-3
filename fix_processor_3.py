import re

with open('src/engine/PcfTopologyGraph2.js', 'r') as f:
    content = f.read()

# Fix the loop bound I just broke
content = content.replace("for (let i = 0; i < physicals.length; i++) {\n        const current = physicals[i];\n        if (i % 50 === 0) reportProgress(`Pass 1: Tracing component ${i + 1}/${physicals.length}`);", "for (let i = 0; i < physicals.length - 1; i++) {\n        const current = physicals[i];\n        if (i % 50 === 0) reportProgress(`Pass 1: Tracing component ${i + 1}/${physicals.length}`);")

with open('src/engine/PcfTopologyGraph2.js', 'w') as f:
    f.write(content)
