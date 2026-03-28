import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1. Status Bar update:
# We have a SceneHealthHUD, but we can also add a simple stats counter to the bottom right of the canvas
# Add a div at the bottom of the canvas

fullscreen_btn = """
      <button
          onClick={() => {
              if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(err => {
                      console.error(`Error attempting to enable fullscreen: ${err.message} (${err.name})`);
                  });
              } else {
                  if (document.exitFullscreen) {
                      document.exitFullscreen();
                  }
              }
          }}
          className="absolute top-4 right-4 z-40 bg-slate-900/80 hover:bg-slate-800 text-slate-300 p-2 rounded backdrop-blur border border-slate-700 transition"
          title="Toggle Fullscreen (F11)"
      >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
      </button>

      {/* Component Status Bar */}
      <div className="absolute bottom-0 right-0 left-0 h-6 bg-slate-900/90 border-t border-slate-700/50 z-30 flex items-center justify-between px-4 pointer-events-none">
           <div className="flex gap-4 text-[10px] text-slate-400 font-mono tracking-wider">
               <span>Total: <strong className="text-slate-200">{dataTable.length}</strong></span>
               {multiSelectedIds.length > 0 && <span>Selected: <strong className="text-blue-400">{multiSelectedIds.length}</strong></span>}
               {useStore.getState().hiddenElementIds.length > 0 && <span>Hidden: <strong className="text-amber-400">{useStore.getState().hiddenElementIds.length}</strong></span>}
           </div>
      </div>
"""

content = content.replace("      <SceneHealthHUD />", "      <SceneHealthHUD />\n" + fullscreen_btn)

# Add keyboard shortcuts 'f' for fullscreen, 't' for table (we don't have a table toggle here, but we can emit an event), 'p' for properties, 'g' for gap list
keys_update = """
              case 'f':
                  if (!document.fullscreenElement) {
                      document.documentElement.requestFullscreen().catch(e => {});
                  } else {
                      document.exitFullscreen();
                  }
                  break;
"""
# the f key is already mapped to 'zoom to current'. Let's remap zoom to 'z' and use 'f' for fullscreen, or 'F11' for fullscreen.
# Actually I will just leave F11 default browser and the button I just added for fullscreen, no need to overwrite f

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)

print("Canvas UI Status Bar and Fullscreen Button added.")
