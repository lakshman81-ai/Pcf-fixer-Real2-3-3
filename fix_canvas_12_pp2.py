import re

with open('src/ui/tabs/CanvasTab.jsx', 'r') as f:
    content = f.read()

# 1.2.1 Add post-processing outline using `@react-three/postprocessing`
# Since we installed the package, we can use the actual `Outline` and `Selection` passes!
# Wait, `<Selection>` wraps everything. `<Select enabled={isSelected}>` wraps individual `<mesh>` or `<group>`.
# But for InstancedMesh, `<Select>` applies to the entire mesh!
# To do this for instances, we need to extract selected instances into a separate `<Select><instancedMesh/></Select>`.
# It's much easier to just do the post-processing on ImmutableComponents and for InstancedPipes, we use the existing highlight overlay but make it look like an outline (which I already did: `cylinderGeometry args={[selectedGeom.radius * 1.2...]} basicMaterial color="#eab308"`).
# Actually, the user says "Yellow emissive only... Add outline post-processing effect... for a clear selection halo".
# So they definitely want `EffectComposer`.

effect_composer_block = """
        {/* Post Processing */}
        <Selection>
            <EffectComposer autoClear={false}>
                <Outline blur visibleEdgeColor="#eab308" hiddenEdgeColor="#ca8a04" edgeStrength={3} width={1000} />
            </EffectComposer>
            <InstancedPipes />
            <ImmutableComponents />
        </Selection>
"""
content = content.replace("        <InstancedPipes />\n        <ImmutableComponents />", effect_composer_block)

# Now, we need to wrap the `<instancedMesh>` in `<Select>`. Wait, `Selection` needs `Select`.
# For ImmutableComponents:
content = re.sub(r'<mesh (.*?key={`fl-\$\{i\}`}.*?)>', r'<Select enabled={isSelected}>\n            <mesh \1>', content)
content = re.sub(r'<mesh (.*?key={`vv-\$\{i\}`}.*?)>', r'<Select enabled={isSelected}>\n            <mesh \1>', content)
content = re.sub(r'<mesh (.*?key={`bn-\$\{i\}`}.*?)>', r'<Select enabled={isSelected}>\n            <mesh \1>', content)
content = re.sub(r'<group (.*?key={`tee-\$\{i\}`}.*?)>', r'<Select enabled={isSelected}>\n            <group \1>', content)
content = re.sub(r'<mesh (.*?key={`ol-\$\{i\}`}.*?)>', r'<Select enabled={isSelected}>\n            <mesh \1>', content)
content = re.sub(r'<group (.*?key={`supp-\$\{i\}`}.*?)>', r'<Select enabled={isSelected}>\n            <group \1>', content)
content = re.sub(r'<mesh (.*?key={`im-\$\{i\}`}.*?)>', r'<Select enabled={isSelected}>\n          <mesh \1>', content)

# Close the Select wrappers
content = re.sub(r'(</mesh>)\n(\s*)\);', r'\1\n          </Select>\n\2);', content)
content = re.sub(r'(</group>)\n(\s*)\);', r'\1\n          </Select>\n\2);', content)


# Now for InstancedPipes. It's too complex to split the instanced mesh. The existing Overlay works for pipes.
# But wait, if I use `<Select>` on InstancedPipes, the whole instanced group gets outlined.
# I'll leave the highlight overlay for pipes but wrap the Immutable ones with Select.

with open('src/ui/tabs/CanvasTab.jsx', 'w') as f:
    f.write(content)
