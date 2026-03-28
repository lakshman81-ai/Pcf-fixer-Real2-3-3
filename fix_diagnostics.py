import re

with open('src/ui/tabs/DataTableTab.jsx', 'r') as f:
    content = f.read()

# 1.1.5 Solver diagnostics export
# Add "Export Diagnostics" button (JSON export of gaps)
# We can just download the proposals state from useStore

export_diag = """
                        <button onClick={() => {
                            const proposals = useStore.getState().proposals || [];
                            const diagData = { timestamp: new Date().toISOString(), totalProposals: proposals.length, proposals };
                            const blob = new Blob([JSON.stringify(diagData, null, 2)], { type: 'application/json' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'smart_fixer_diagnostics.json';
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }} className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-[10px] font-bold border border-slate-300 transition-all shadow-sm ml-2" title="Export Solver Diagnostics JSON">
                            <span>📄</span> Export Diag
                        </button>
"""

# add right after the Toggle Diff view button
content = content.replace("                          <span className=\"mr-1\">⟺</span>Diff View\n                        </button>", "                          <span className=\"mr-1\">⟺</span>Diff View\n                        </button>\n" + export_diag)


with open('src/ui/tabs/DataTableTab.jsx', 'w') as f:
    f.write(content)
