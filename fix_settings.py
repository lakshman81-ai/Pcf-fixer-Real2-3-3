import re

with open('src/ui/components/ToolbarRibbon.jsx', 'r') as f:
    content = f.read()

# Replace open-settings event with setShowSettings state toggle
content = content.replace("onClick={() => window.dispatchEvent(new CustomEvent('open-settings'))}", "onClick={() => useStore.getState().setShowSettings(true)}")

# Replace onToggleSideInspector with standard state access if it's not working, or make sure it's passed
# Wait, the user complains `toggle side panel not working`. `showSideInspector` and `onToggleSideInspector` are passed as props to ToolbarRibbon1.
# But in CanvasTab.jsx where we split it into ToolbarRibbon1 and 2, let's check how it's passed.
# Actually, the state for SideInspector is likely in useStore. Let's use useStore natively instead of passing props.

content = content.replace("active={showSideInspector} onClick={onToggleSideInspector}", "active={useStore.getState().showSideInspector} onClick={() => useStore.getState().setShowSideInspector(!useStore.getState().showSideInspector)}")

with open('src/ui/components/ToolbarRibbon.jsx', 'w') as f:
    f.write(content)
