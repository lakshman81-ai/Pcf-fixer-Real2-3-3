import re

with open('src/ui/components/StatusBar.jsx', 'r') as f:
    content = f.read()

# Just inject onProgress inside useTopologyWorker arguments
onprogress_inject = """
  const { runTopology, isRunning: isWorkerRunning } = useTopologyWorker({
    onProgress: (msg) => {
        dispatch({ type: "SET_STATUS_MESSAGE", payload: msg });
    },
"""
content = content.replace("  const { runTopology, isRunning: isWorkerRunning } = useTopologyWorker({", onprogress_inject)

with open('src/ui/components/StatusBar.jsx', 'w') as f:
    f.write(content)
