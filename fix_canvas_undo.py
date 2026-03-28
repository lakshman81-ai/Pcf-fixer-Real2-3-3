import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Add redo hotkey support
undo_block = """
                  // Ctrl+Z
                  if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      undo();
                  }
                  // Ctrl+Y for Redo
                  if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      useStore.getState().redo();
                  }
"""

content = re.sub(r'// Ctrl\+Z\s*if \(e\.key === \'z\' && \(e\.ctrlKey \|\| e\.metaKey\)\) \{\s*e\.preventDefault\(\);\s*undo\(\);\s*\}', undo_block, content)


# Add the `zustand-redo` event listener to sync to AppContext
redo_event = """
      const handleZustandUndo = () => {
          // Sync Zustand's newly restored state back to AppContext
          const restoredTable = useStore.getState().dataTable;
          dispatch({ type: "APPLY_GAP_FIX", payload: { updatedTable: restoredTable } });
          dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Info", message: "Undo completed." } });
      };

      const handleZustandRedo = () => {
          const restoredTable = useStore.getState().dataTable;
          dispatch({ type: "APPLY_GAP_FIX", payload: { updatedTable: restoredTable } });
          dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Info", message: "Redo completed." } });
      };

      window.addEventListener('zustand-undo', handleZustandUndo);
      window.addEventListener('zustand-redo', handleZustandRedo);

      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          window.removeEventListener('zustand-undo', handleZustandUndo);
          window.removeEventListener('zustand-redo', handleZustandRedo);
      };
"""

content = re.sub(r'const handleZustandUndo = \(\) => \{.*?\n      \};\n\n      window.addEventListener\(\'zustand-undo\', handleZustandUndo\);\n\n      return \(\) => \{\n          window.removeEventListener\(\'keydown\', handleKeyDown\);\n          window.removeEventListener\(\'keyup\', handleKeyUp\);\n          window.removeEventListener\(\'zustand-undo\', handleZustandUndo\);\n      \};', redo_event, content, flags=re.DOTALL)


with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
