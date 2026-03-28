import re

with open('src/workers/topologyWorker.js', 'r') as f:
    content = f.read()

# Pass down onProgress callback through config so PcfTopologyGraph2 can use it
config_update = """
    const onProgress = (msg) => {
        self.postMessage({ type: 'TOPOLOGY_PROGRESS', message: msg });
    };

    const effectiveConfig = currentPass ? { ...config, currentPass, onProgress } : { ...config, onProgress };
"""
content = content.replace("const effectiveConfig = currentPass ? { ...config, currentPass } : config;", config_update)

with open('src/workers/topologyWorker.js', 'w') as f:
    f.write(content)
