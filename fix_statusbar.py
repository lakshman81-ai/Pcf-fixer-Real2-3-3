import re

with open('src/ui/components/StatusBar.jsx', 'r') as f:
    content = f.read()

# Make sure StatusBar consumes `onProgress` correctly
onprogress_code = """
  const { runTopology, isRunning: isWorkerRunning } = useTopologyWorker({
    onComplete: (result) => {
        setIsRunning(false);
        const processedTable = [...dataTable];

        result.logs.forEach(l => dispatch({ type: "ADD_LOG", payload: l }));

        if (result.proposals && result.proposals.length > 0) {
            useStore.getState().setProposals(result.proposals);
            dispatch({ type: "ADD_LOG", payload: { stage: "FIXING", type: "Info", message: `Generated ${result.proposals.length} smart fix proposals.` }});

            result.proposals.forEach(prop => {
                const row = processedTable.find(r => r._rowIndex === prop.elementA._rowIndex);
                if (row) {
                    row.fixingAction = prop.description;
                    row.fixingActionTier = prop.dist < 25 ? 2 : 3;
                    if (prop.score !== undefined) row.fixingActionScore = prop.score;
                }
            });
        }
        dispatch({ type: "SET_STAGE_2_DATA", payload: processedTable });
        setZustandData(processedTable);
        dispatch({ type: "SET_STATUS_MESSAGE", payload: `Smart Fix Complete: ${result.proposals?.length || 0} proposals generated.` });
    },
    onError: (err) => {
        setIsRunning(false);
        dispatch({ type: "SET_STATUS_MESSAGE", payload: `Smart Fix Error: ${err}` });
    },
    onProgress: (msg) => {
        dispatch({ type: "SET_STATUS_MESSAGE", payload: msg });
    }
  });
"""

# replace the useTopologyWorker block
content = re.sub(r'const \{ runTopology, isRunning: isWorkerRunning \} = useTopologyWorker\(\{.*?\}\);', onprogress_code, content, flags=re.DOTALL)

with open('src/ui/components/StatusBar.jsx', 'w') as f:
    f.write(content)
