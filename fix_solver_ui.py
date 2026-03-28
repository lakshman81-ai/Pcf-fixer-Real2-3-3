import re

with open('src/ui/tabs/DataTableTab.jsx', 'r') as f:
    content = f.read()

# 1.1.4 Batch approve/reject by type
# "Approve All" approves everything. Add filter dropdowns: approve/reject only GAP_FILL, only GAP_SNAP_IMMUTABLE, etc.
# In DataTableTab.jsx, there's `handleAutoApproveAll`. Let's add a dropdown next to it.
auto_approve = """
                        <button onClick={handleAutoApproveAll} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-xs font-bold border border-indigo-200 transition-all shadow-sm ml-2" title="Approve all Tier 1/2 automated fixes">
                            <span className="mr-1">⚡</span>Auto Approve (&lt;25mm)
                        </button>
"""
batch_approve = """
                        <div className="flex items-center ml-2 border border-indigo-200 rounded shadow-sm bg-indigo-50 h-6">
                            <button onClick={() => handleAutoApproveAll('ALL')} className="px-2.5 py-1 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border-r border-indigo-200 h-full flex items-center" title="Approve all Tier 1/2 automated fixes">
                                <span className="mr-1">⚡</span>Approve All
                            </button>
                            <select
                                onChange={(e) => {
                                    if (e.target.value) {
                                        handleAutoApproveAll(e.target.value);
                                        e.target.value = ""; // reset after action
                                    }
                                }}
                                className="bg-transparent text-indigo-700 text-[10px] font-bold px-1 outline-none cursor-pointer h-full border-0"
                            >
                                <option value="" disabled>Batch Actions...</option>
                                <option value="GAP_FILL">Approve GAP_FILL</option>
                                <option value="GAP_SNAP_IMMUTABLE_BLOCK">Approve GAP_SNAP</option>
                                <option value="SYNTHESIZE_VALVE">Approve Valves</option>
                                <option value="REJECT_ALL">Reject All Proposals</option>
                            </select>
                        </div>
"""
content = content.replace(auto_approve, batch_approve)

# Update `handleAutoApproveAll` logic
handle_auto_approve_old = """
  const handleAutoApproveAll = () => {
      const updatedTable = dataTable.map(r => {
          if (r.fixingActionTier && r.fixingActionTier <= 2) {
              if (stage === "2") useStore.getState().setProposalStatus(r._rowIndex, true);
              return { ...r, _fixApproved: true };
          }
          return r;
      });
      if (stage === "1") dispatch({ type: "SET_DATA_TABLE", payload: updatedTable });
      if (stage === "2") dispatch({ type: "SET_STAGE_2_DATA", payload: updatedTable });
      if (stage === "3") dispatch({ type: "SET_STAGE_3_DATA", payload: updatedTable });
  };
"""

handle_auto_approve_new = """
  const handleAutoApproveAll = (actionType = 'ALL') => {
      const updatedTable = dataTable.map(r => {
          if (actionType === 'REJECT_ALL') {
              if (r.fixingAction && !r.fixingAction.includes('ERROR') && r._fixApproved === undefined) {
                  if (stage === "2") useStore.getState().setProposalStatus(r._rowIndex, false);
                  return { ...r, _fixApproved: false };
              }
              return r;
          }

          if (r.fixingActionTier && r.fixingActionTier <= 2) {
              const actionMatch = actionType === 'ALL' || (r.fixingAction && r.fixingAction.includes(actionType));
              if (actionMatch && r._fixApproved === undefined) {
                  if (stage === "2") useStore.getState().setProposalStatus(r._rowIndex, true);
                  return { ...r, _fixApproved: true };
              }
          }
          return r;
      });

      const msg = actionType === 'REJECT_ALL' ? "Rejected all pending proposals." : `Approved ${actionType === 'ALL' ? 'all Tier 1/2' : actionType} proposals.`;
      dispatch({ type: "ADD_LOG", payload: { stage: "FIXING", type: "Info", message: msg }});

      if (stage === "1") dispatch({ type: "SET_DATA_TABLE", payload: updatedTable });
      if (stage === "2") dispatch({ type: "SET_STAGE_2_DATA", payload: updatedTable });
      if (stage === "3") dispatch({ type: "SET_STAGE_3_DATA", payload: updatedTable });
  };
"""

content = content.replace(handle_auto_approve_old, handle_auto_approve_new)

with open('src/ui/tabs/DataTableTab.jsx', 'w') as f:
    f.write(content)
