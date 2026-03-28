import re

with open('src/engine/PcfTopologyGraph2.js', 'r') as f:
    content = f.read()

# Add progress tracking
progress_inject = """
    // Pass 1: Sequential Topological Tracing
    // Filter physical components
    const physicals = dataTable.filter(c =>
        c.type && !['SUPPORT', 'MESSAGE-SQUARE', 'PIPELINE-REFERENCE'].includes(c.type) && !c.type.startsWith('UNITS-') && c.type !== 'ISOGEN-FILES' && c.type !== 'UNKNOWN'
    );

    // Add global progress hook if passed via config
    const reportProgress = (msg) => {
        if (config.onProgress) config.onProgress(msg);
    };

    const proposals = [];
"""

content = content.replace("""    // Pass 1: Sequential Topological Tracing
    // Filter physical components
    const physicals = dataTable.filter(c =>
        c.type && !['SUPPORT', 'MESSAGE-SQUARE', 'PIPELINE-REFERENCE'].includes(c.type) && !c.type.startsWith('UNITS-') && c.type !== 'ISOGEN-FILES' && c.type !== 'UNKNOWN'
    );

    const proposals = [];""", progress_inject)


loop1_inject = """    // Detect Gaps & Misalignments
    for (let i = 0; i < physicals.length; i++) {
        const current = physicals[i];
        if (i % 50 === 0) reportProgress(`Pass 1: Tracing component ${i + 1}/${physicals.length}`);
"""
content = content.replace("""    // Detect Gaps & Misalignments
    for (let i = 0; i < physicals.length - 1; i++) {""", loop1_inject)
# oops loop bound changed, let me fix it

with open('src/engine/PcfTopologyGraph2.js', 'w') as f:
    f.write(content)
