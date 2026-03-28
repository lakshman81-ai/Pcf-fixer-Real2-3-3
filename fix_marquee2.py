import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# Fix Marquee plane
plane_old = r"""<mesh
                onPointerDown=\{handlePointerDown\}
                onPointerMove=\{handlePointerMove\}
                onPointerUp=\{handlePointerUp\}
                rotation=\{\[-Math\.PI \/ 2, 0, 0\]\}
                position=\{\[0, Math\.max\(startPt\?\.y \|\| 0, 0\) \+ 1, 0\]\}
                scale=\{\[2000, 2000, 1\]\}
                renderOrder=\{-1\}
            >
                <planeGeometry args=\{\[500, 500\]\} \/>
                <meshBasicMaterial visible=\{false\} depthTest=\{false\} \/>
            </mesh>"""

plane_new = """            <mesh
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={[200000, 200000, 1]}
                renderOrder={-1}
            >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial transparent opacity={0.0} depthWrite={false} />
            </mesh>"""

content = re.sub(plane_old, plane_new, content)

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
