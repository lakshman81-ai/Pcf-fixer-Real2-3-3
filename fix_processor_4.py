import re

with open('src/engine/PcfTopologyGraph2.js', 'r') as f:
    content = f.read()

# Add to pass 2
pass2_inject = """    // Pass 2: Global Sweep for Disconnected Major Axes
    reportProgress(`Pass 2: Scanning for Major Axis Disconnects...`);
"""
content = content.replace("    // Pass 2: Global Sweep for Disconnected Major Axes", pass2_inject)

# Add to pass 3
pass3_inject = """    // Pass 3: Global Fuzzy Search (Branch / Non-Standard Connectors)
    reportProgress(`Pass 3: Resolving Branch & Fuzzy Connections...`);
"""
content = content.replace("    // Pass 3: Global Fuzzy Search (Branch / Non-Standard Connectors)", pass3_inject)

with open('src/engine/PcfTopologyGraph2.js', 'w') as f:
    f.write(content)
