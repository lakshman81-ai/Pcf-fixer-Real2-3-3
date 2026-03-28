import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Make sure we didn't inject `castShadow receiveShadow` too blindly on text meshes or overlays that shouldn't have them
content = content.replace("<mesh castShadow receiveShadow position={selectedGeom.pos} quaternion={selectedGeom.quat}>", "<mesh position={selectedGeom.pos} quaternion={selectedGeom.quat}>")
content = content.replace("<mesh castShadow receiveShadow position={[0, 150, 0]}>", "<mesh position={[0, 150, 0]}>")
content = content.replace("<mesh castShadow receiveShadow position={[0, 75, 0]}>", "<mesh position={[0, 75, 0]}>")
content = content.replace("<mesh castShadow receiveShadow position={[0, 250, 0]}>", "<mesh position={[0, 250, 0]}>")
content = content.replace("<mesh castShadow receiveShadow position={mid} quaternion={quaternion}>", "<mesh position={mid} quaternion={quaternion}>")
content = content.replace("<mesh castShadow receiveShadow position={vecA}>", "<mesh position={vecA}>")
content = content.replace("<mesh castShadow receiveShadow position={vecB}>", "<mesh position={vecB}>")
content = content.replace("<mesh castShadow receiveShadow position={mid}>", "<mesh position={mid}>")
content = content.replace("<mesh castShadow receiveShadow visible={false}>", "<mesh visible={false}>")
content = content.replace("<mesh castShadow receiveShadow position={cursorSnapPoint} renderOrder={999}>", "<mesh position={cursorSnapPoint} renderOrder={999}>")

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)

print("Cleaned up excessive shadow assignments.")
