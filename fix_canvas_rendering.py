import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1. Enable Shadows on Canvas
content = content.replace("<Canvas>", "<Canvas shadows>")

# 2. Add ground plane that receives shadows, and update lights to cast shadows
# Replace gridHelper/axesHelper block with lights and plane
light_block_old = r"<ambientLight intensity=\{0.6\} />\s*<directionalLight position=\{\[1000, 1000, 500\]\} intensity=\{1.5\} />\s*<directionalLight position=\{\[-1000, -1000, -500\]\} intensity=\{0.5\} />"
light_block_new = """<ambientLight intensity={0.6} />
        <directionalLight position={[1000, 1000, 500]} intensity={1.5} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-camera-far={10000} shadow-camera-left={-2000} shadow-camera-right={2000} shadow-camera-top={2000} shadow-camera-bottom={-2000} />
        <directionalLight position={[-1000, -1000, -500]} intensity={0.5} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -100, 0]} receiveShadow>
            <planeGeometry args={[100000, 100000]} />
            <meshStandardMaterial color="#f0f2f5" depthWrite={false} />
        </mesh>"""
content = re.sub(light_block_old, light_block_new, content)

# 3. Update InstancedPipes materials to PBR and cast/receive shadow
content = content.replace("<instancedMesh ref={meshRef} args={[null, null, pipes.length]} onPointerDown={handlePointerDown}>", "<instancedMesh ref={meshRef} args={[null, null, pipes.length]} onPointerDown={handlePointerDown} castShadow receiveShadow>")
content = content.replace("""<meshStandardMaterial color="#3b82f6" transparent={translucentMode} opacity={translucentMode ? 0.4 : 1.0} depthWrite={!translucentMode} />""", """<meshStandardMaterial color="#3b82f6" transparent={translucentMode} opacity={translucentMode ? 0.4 : 1.0} depthWrite={!translucentMode} metalness={0.4} roughness={0.5} />""")

# 4. Update ImmutableComponents to cast/receive shadow and PBR
content = re.sub(r'<mesh (.*?)>', r'<mesh \1 castShadow receiveShadow>', content)
content = content.replace("""transparent={translucentMode} opacity={translucentMode ? 0.4 : 1.0} depthWrite={!translucentMode} />""", """transparent={translucentMode} opacity={translucentMode ? 0.4 : 1.0} depthWrite={!translucentMode} metalness={0.3} roughness={0.6} />""")

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)

print("Rendering quality updated.")
