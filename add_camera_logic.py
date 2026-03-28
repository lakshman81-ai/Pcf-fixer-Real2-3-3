import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Add logic for canvas-save-camera and canvas-load-camera
# Find `ControlsAutoCenter`
camera_logic = """
        const handleSaveCamera = (e) => {
            if (!controlsRef.current) return;
            const preset = e.detail.preset;
            const data = {
                camPos: controlsRef.current.object.position.clone(),
                camTarget: controlsRef.current.target.clone()
            };
            localStorage.setItem(`pcf-camera-preset-${preset}`, JSON.stringify(data));
        };

        const handleLoadCamera = (e) => {
            if (!controlsRef.current) return;
            const preset = e.detail.preset;
            const saved = localStorage.getItem(`pcf-camera-preset-${preset}`);
            if (saved) {
                const data = JSON.parse(saved);
                setTargetPos(new THREE.Vector3().copy(data.camTarget));
                setCamPos(new THREE.Vector3().copy(data.camPos));
                isAnimating.current = true;
            }
        };

        window.addEventListener('canvas-save-camera', handleSaveCamera);
        window.addEventListener('canvas-load-camera', handleLoadCamera);
"""

camera_cleanup = """
            window.removeEventListener('canvas-save-camera', handleSaveCamera);
            window.removeEventListener('canvas-load-camera', handleLoadCamera);
"""

content = content.replace("        window.addEventListener('canvas-auto-center', handleCenter);", camera_logic + "\n        window.addEventListener('canvas-auto-center', handleCenter);")
content = content.replace("            window.removeEventListener('canvas-auto-center', handleCenter);", camera_cleanup + "\n            window.removeEventListener('canvas-auto-center', handleCenter);")

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
