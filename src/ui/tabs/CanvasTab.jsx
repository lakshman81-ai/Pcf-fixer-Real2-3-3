import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html, Text, GizmoHelper, GizmoViewport, OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { useAppContext } from '../../store/AppContext';
import { applyFixes } from '../../engine/FixApplicator';
import { createLogger } from '../../utils/Logger';
import { fix6mmGaps, fix25mmGapsWithPipe, breakPipeAtPoint, insertSupportAtPipe } from '../../engine/GapFixEngine';
import { autoAssignPipelineRefs } from '../../engine/TopologyEngine';
import { SideInspector } from '../components/SideInspector';
import { LogDrawer } from '../components/LogDrawer';
import { SceneHealthHUD } from '../components/SceneHealthHUD';
import { SupportPropertyPanel } from '../components/SupportPropertyPanel';
import { GapSidebar } from '../components/GapSidebar';
import { PipelinePropertyPanel } from '../components/PipelinePropertyPanel';
import { NavigationPanel } from '../components/NavigationPanel';
import { SettingsModal } from '../components/SettingsModal';
import { ClippingPlanesLayer, ClippingPanelUI } from '../components/ClippingPlanesLayer';
import { ToolbarRibbon } from '../components/ToolbarRibbon';

// ----------------------------------------------------
// Colour & geometry helpers per component type
// ----------------------------------------------------
const typeColor = (type, appSettings) => {
    const defaultColors = {
        PIPE: '#cbd5e1',
        BEND: '#94a3b8',
        TEE: '#94a3b8',
        OLET: '#64748b',
        REDUCER: '#64748b',
        VALVE: '#3b82f6',
        FLANGE: '#60a5fa',
        SUPPORT: '#10b981'
    };
    const colors = appSettings?.componentColors || defaultColors;
    return colors[(type || '').toUpperCase()] || '#64748b';
};

// Spool logic
const getCAColor = (str) => {
    if (!str) return '#64748b';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const computeSpools = (dataTable) => {
    const spools = {}; // rowIndex -> spoolId
    let spoolCounter = 1;

    // Adjacency map
    const endpoints = {}; // "x,y,z" -> [rowIndex]
    dataTable.forEach(r => {
        if ((r.type||'').toUpperCase() === 'SUPPORT') return; // Supports don't route spools
        if (r.ep1) { const key = `${parseFloat(r.ep1.x).toFixed(1)},${parseFloat(r.ep1.y).toFixed(1)},${parseFloat(r.ep1.z).toFixed(1)}`; if (!endpoints[key]) endpoints[key] = []; endpoints[key].push(r._rowIndex); }
        if (r.ep2) { const key = `${parseFloat(r.ep2.x).toFixed(1)},${parseFloat(r.ep2.y).toFixed(1)},${parseFloat(r.ep2.z).toFixed(1)}`; if (!endpoints[key]) endpoints[key] = []; endpoints[key].push(r._rowIndex); }
    });

    const visited = new Set();
    const rows = new Map(dataTable.map(r => [r._rowIndex, r]));

    const floodFill = (startId, sId) => {
        const queue = [startId];
        let iterations = 0;
        while (queue.length > 0) {
            if (iterations++ > 10000) {
                console.warn('floodFill aborted: exceeded 10000 iterations (possible cycle or massive network).');
                break;
            }
            const currId = queue.shift();
            if (visited.has(currId)) continue;

            const curr = rows.get(currId);
            if (!curr) continue;

            visited.add(currId);
            spools[currId] = sId;

            // Stop spool flood across flanges, valves, or pipeline ref changes
            const currType = (curr.type || '').toUpperCase();
            if (currType === 'FLANGE' || currType === 'VALVE' || currType === 'SUPPORT') continue;

            const neighbors = new Set();
            if (curr.ep1) { const key = `${parseFloat(curr.ep1.x).toFixed(1)},${parseFloat(curr.ep1.y).toFixed(1)},${parseFloat(curr.ep1.z).toFixed(1)}`; (endpoints[key] || []).forEach(n => neighbors.add(n)); }
            if (curr.ep2) { const key = `${parseFloat(curr.ep2.x).toFixed(1)},${parseFloat(curr.ep2.y).toFixed(1)},${parseFloat(curr.ep2.z).toFixed(1)}`; (endpoints[key] || []).forEach(n => neighbors.add(n)); }

            neighbors.forEach(nId => {
                if (!visited.has(nId) && nId !== currId) {
                    const neighbor = rows.get(nId);
                    if (neighbor) {
                        const nType = (neighbor.type || '').toUpperCase();
                        // Only flood into pipes, bends, tees, olets. We stop *after* hitting a flange/valve, but do we include the flange?
                        // Yes, the first flange belongs to the spool. But we don't route *past* it.
                        // So if neighbor is flange/valve, we add it, but its own floodFill loop will terminate immediately (see `if currType === FLANGE continue` above).

                        // We also break if pipeline refs differ (assuming both exist)
                        if (curr.pipelineRef && neighbor.pipelineRef && curr.pipelineRef !== neighbor.pipelineRef) return;

                        queue.push(nId);
                    }
                }
            });
        }
    };

    dataTable.forEach(r => {
        if (!visited.has(r._rowIndex)) {
            floodFill(r._rowIndex, spoolCounter++);
        }
    });

    return spools;
};

// Generates distinct colors based on ID
const spoolColor = (spoolId) => {
    const colors = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf', '#60a5fa', '#818cf8', '#c084fc', '#f472b6'];
    if (!spoolId) return '#64748b';
    return colors[spoolId % colors.length];
};

// ----------------------------------------------------
// Performance Optimized Instanced Pipes Rendering
// ----------------------------------------------------
const InstancedPipes = () => {
  const getPipes = useStore(state => state.getPipes);
  const colorMode = useStore(state => state.colorMode);
  const dataTable = useStore(state => state.dataTable);
  const multiSelectedIds = useStore(state => state.multiSelectedIds); // Listen for selection changes
  const appSettings = useStore(state => state.appSettings);
  const pipes = getPipes();
  const meshRef = useRef();

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const c = useMemo(() => new THREE.Color(), []);

  // Compute spools globally if needed
  const spools = useMemo(() => computeSpools(dataTable), [dataTable]);

  useEffect(() => {
    if (!meshRef.current || pipes.length === 0) return;

    pipes.forEach((element, i) => {
      const { ep1, ep2, bore } = element;
      if (!ep1 || !ep2) return;

      const vecA = new THREE.Vector3(ep1.x, ep1.y, ep1.z);
      const vecB = new THREE.Vector3(ep2.x, ep2.y, ep2.z);
      const distance = vecA.distanceTo(vecB);
      if (distance === 0) return;

      // Position: Midpoint
      const midPoint = vecA.clone().lerp(vecB, 0.5);
      dummy.position.copy(midPoint);

      // Scale: Y-axis is length in Three.js cylinders
      // For visual clarity, scale the X and Z by bore/2
      const radius = bore ? bore / 2 : 5;
      dummy.scale.set(radius, distance, radius);

      // Orientation: Point from A to B
      const direction = vecB.clone().sub(vecA).normalize();
      // Three.js cylinders point UP (Y-axis) by default
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
      dummy.quaternion.copy(quaternion);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color
      let colStr = typeColor(element.type, appSettings);
      if (colorMode === 'SPOOL') {
          colStr = spoolColor(spools[element._rowIndex]);
      } else if (colorMode !== 'TYPE' && colorMode !== '') {
          const val = getColorModeValue(element, colorMode);
          if (val) {
              colStr = getCAColor(val);
          } else {
              colStr = '#475569'; // slate-600 for missing attr
          }
      }

      // Handle multi-select highlighting for pipes
      const isSelected = multiSelectedIds.includes(element._rowIndex);
      if (isSelected) {
          colStr = '#eab308'; // yellow for selection
      }

      c.set(colStr);
      meshRef.current.setColorAt(i, c);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    meshRef.current.computeBoundingSphere();
  }, [pipes, dummy, colorMode, spools, c, multiSelectedIds]);

  const [selectedGeom, setSelectedGeom] = useState(null);

  const selectedElementId = useStore(state => state.selectedElementId);
  // Clear cylinder if nothing is selected or if the selected element was deleted
  useEffect(() => {
      if (multiSelectedIds.length === 0 && !selectedElementId) {
          setSelectedGeom(null);
      }
  }, [multiSelectedIds, selectedElementId]);

  const handlePointerDown = (e) => {
      const canvasMode = useStore.getState().canvasMode;

      // Prevent selection if in a tool mode like MEASURE, BREAK, CONNECT, INSERT_SUPPORT. Let the event bubble to global snap plane.
      if (canvasMode !== 'VIEW') {
          return;
      }

      e.stopPropagation();

      const instanceId = e.instanceId;
      if (instanceId !== undefined && pipes[instanceId]) {
          const pipe = pipes[instanceId];

          if (e.button === 2) {
              useStore.getState().setContextMenu({
                  x: e.clientX,
                  y: e.clientY,
                  rowIndex: pipe._rowIndex
              });
              return;
          }

          if (appSettings.centerOrbitOnSelect && e.point) {
              window.dispatchEvent(new CustomEvent('canvas-focus-point', { detail: { x: e.point.x, y: e.point.y, z: e.point.z, dist: null } }));
          }
          if (pipe.ep1 && pipe.ep2) {
              const midX = (pipe.ep1.x + pipe.ep2.x) / 2;
              const midY = (pipe.ep1.y + pipe.ep2.y) / 2;
              const midZ = (pipe.ep1.z + pipe.ep2.z) / 2;

              const vecA = new THREE.Vector3(pipe.ep1.x, pipe.ep1.y, pipe.ep1.z);
              const vecB = new THREE.Vector3(pipe.ep2.x, pipe.ep2.y, pipe.ep2.z);
              const distance = vecA.distanceTo(vecB);
              const radius = pipe.bore ? pipe.bore / 2 : 5;
              const direction = vecB.clone().sub(vecA).normalize();
              const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

              setSelectedGeom({ pos: [midX, midY, midZ], dist: distance, radius, quat: quaternion });

              const isMultiSelect = e.ctrlKey || e.metaKey;
              if (isMultiSelect) {
                  useStore.getState().toggleMultiSelect(pipe._rowIndex);
              } else {
                  useStore.getState().clearMultiSelect();
                  useStore.getState().setSelected(pipe._rowIndex);
                  useStore.getState().setMultiSelect([pipe._rowIndex]);
              }

              // Do not dispatch canvas-focus-point automatically anymore.
              // Instead, we just set the selection for the property panel.
          }
      }
  };

  const handlePointerMissed = (e) => {
      // Check if click originated from the HTML UI overlay. e.target is typically the canvas if valid.
      // e.type is typically 'pointerdown' or 'click' from R3F, but we can also check e.eventObject.
      // Often, R3F's onPointerMissed fires for UI clicks if they aren't stopped.
      // We can check if e.nativeEvent?.target is a DOM element outside the canvas or if there's no nativeEvent.
      if (e.nativeEvent) {
          const target = e.nativeEvent.target;
          // If the click is on an input, button, or something that is clearly UI, ignore it.
          // The canvas itself is usually a `<canvas>` element.
          if (target && target.tagName !== 'CANVAS') {
              return;
          }
      }

      // Don't clear if Ctrl is held down, allows multi-select to stay persistent across blank clicks
      if (e && (e.ctrlKey || e.metaKey)) return;
      setSelectedGeom(null);
      useStore.getState().setSelected(null);
      useStore.getState().clearMultiSelect();
  };

  if (pipes.length === 0) return null;

  return (
    <group onPointerMissed={handlePointerMissed}>
        <instancedMesh ref={meshRef} args={[null, null, pipes.length]} onPointerDown={handlePointerDown}>
          <cylinderGeometry args={[1, 1, 1, 16]} />
          <meshStandardMaterial color="#3b82f6" />
        </instancedMesh>

        {/* Highlight Overlay */}
        {selectedGeom && (
             <mesh position={selectedGeom.pos} quaternion={selectedGeom.quat}>
                 <cylinderGeometry args={[selectedGeom.radius * 1.2, selectedGeom.radius * 1.2, selectedGeom.dist, 16]} />
                 <meshBasicMaterial color="#eab308" transparent opacity={0.5} depthTest={false} />
             </mesh>
        )}
    </group>
  );
};

// ----------------------------------------------------
// Distinct geometry for non-PIPE components
// ----------------------------------------------------
const ImmutableComponents = () => {
  const getImmutables = useStore(state => state.getImmutables);
  const elements = getImmutables();
  const colorMode = useStore(state => state.colorMode);
  const dataTable = useStore(state => state.dataTable);
  const multiSelectedIds = useStore(state => state.multiSelectedIds);
  const appSettings = useStore(state => state.appSettings);

  // Re-use compute spools if needed here
  const spools = useMemo(() => computeSpools(dataTable), [dataTable]);

  if (elements.length === 0) return null;

  return (
    <group>
      {elements.map((el, i) => {
        if (!el.ep1 || !el.ep2) return null;

        const vecA = new THREE.Vector3(el.ep1.x, el.ep1.y, el.ep1.z);
        const vecB = new THREE.Vector3(el.ep2.x, el.ep2.y, el.ep2.z);
        const dist = vecA.distanceTo(vecB);
        if (dist < 0.001) return null;

        const mid = vecA.clone().lerp(vecB, 0.5);
        const dir = vecB.clone().sub(vecA).normalize();
        const up  = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
        const r = el.bore ? el.bore / 2 : 5;
        let color = typeColor(el.type, appSettings);
        if (colorMode === 'SPOOL') {
            color = spoolColor(spools[el._rowIndex]);
        } else if (colorMode !== 'TYPE' && colorMode !== '') {
            const val = getColorModeValue(el, colorMode);
            if (val) {
                color = getCAColor(val);
            } else {
                color = '#475569';
            }
        }

        const isSelected = multiSelectedIds.includes(el._rowIndex);
        if (isSelected) color = '#eab308';

        const type = (el.type || '').toUpperCase();

        const handleSelect = (e) => {
          const canvasMode = useStore.getState().canvasMode;
          if (canvasMode !== 'VIEW') return;

          e.stopPropagation();

          if (appSettings.centerOrbitOnSelect && e.point) {
              window.dispatchEvent(new CustomEvent('canvas-focus-point', { detail: { x: e.point.x, y: e.point.y, z: e.point.z, dist: null } }));
          }

          const isMultiSelect = e.ctrlKey || e.metaKey;
          if (isMultiSelect) {
              useStore.getState().toggleMultiSelect(el._rowIndex);
          } else {
              useStore.getState().clearMultiSelect();
              useStore.getState().setSelected(el._rowIndex);
              useStore.getState().setMultiSelect([el._rowIndex]);
          }
        };

        if (type === 'FLANGE') {
          // Disc — short, wide cylinder
          return (
            <mesh key={`fl-${i}`} position={mid} quaternion={quat} onPointerDown={handleSelect}>
              <cylinderGeometry args={[r * 1.6, r * 1.6, Math.max(dist * 0.15, 10), 24]} />
              <meshStandardMaterial color={isSelected ? '#eab308' : color} />
            </mesh>
          );
        }

        if (type === 'VALVE') {
          // Box body
          return (
            <mesh key={`vv-${i}`} position={mid} quaternion={quat} onPointerDown={handleSelect}>
              <boxGeometry args={[r * 2.2, dist, r * 2.2]} />
              <meshStandardMaterial color={isSelected ? '#eab308' : color} />
            </mesh>
          );
        }

        if (type === 'BEND') {
          // Slightly thicker cylinder in amber — no torus without 3 points; keep cylinder with distinct colour
          return (
            <mesh key={`bn-${i}`} position={mid} quaternion={quat} onPointerDown={handleSelect}>
              <cylinderGeometry args={[r * 1.1, r * 1.1, dist, 16]} />
              <meshStandardMaterial color={isSelected ? '#eab308' : color} />
            </mesh>
          );
        }

        if (type === 'TEE') {
          // Main run cylinder + branch stub
          const branchDir = el.cp && el.bp
            ? new THREE.Vector3(el.bp.x - el.cp.x, el.bp.y - el.cp.y, el.bp.z - el.cp.z).normalize()
            : new THREE.Vector3(0, 0, 1);
          const branchLen = el.cp && el.bp
            ? new THREE.Vector3(el.bp.x - el.cp.x, el.bp.y - el.cp.y, el.bp.z - el.cp.z).length()
            : r * 3;
          const branchMid = el.cp
            ? new THREE.Vector3(
                el.cp.x + branchDir.x * branchLen / 2,
                el.cp.y + branchDir.y * branchLen / 2,
                el.cp.z + branchDir.z * branchLen / 2
              )
            : mid.clone().addScaledVector(branchDir, branchLen / 2);
          const branchQuat = new THREE.Quaternion().setFromUnitVectors(up, branchDir);
          const branchR = el.branchBore ? el.branchBore / 2 : r * 0.6;
          return (
            <group key={`tee-${i}`} onPointerDown={handleSelect}>
              <mesh position={mid} quaternion={quat}>
                <cylinderGeometry args={[r, r, dist, 16]} />
                <meshStandardMaterial color={isSelected ? '#eab308' : color} />
              </mesh>
              <mesh position={branchMid} quaternion={branchQuat}>
                <cylinderGeometry args={[branchR, branchR, branchLen, 12]} />
                <meshStandardMaterial color={isSelected ? '#eab308' : color} />
              </mesh>
            </group>
          );
        }

        if (type === 'OLET') {
          // Small sphere at CP position
          const pos = el.cp
            ? [el.cp.x, el.cp.y, el.cp.z]
            : [mid.x, mid.y, mid.z];
          return (
            <mesh key={`ol-${i}`} position={pos} onPointerDown={handleSelect}>
              <sphereGeometry args={[r * 1.3, 12, 12]} />
              <meshStandardMaterial color={isSelected ? '#eab308' : color} />
            </mesh>
          );
        }

        if (type === 'SUPPORT') {
          const isRest = ['CA150', 'REST'].includes((el.type || '').toUpperCase()) ||
                         Object.values(el).some(v => typeof v === 'string' && ['CA150', 'REST'].includes(v.toUpperCase()));
          const isGui = ['CA100', 'GUI'].includes((el.type || '').toUpperCase()) ||
                        Object.values(el).some(v => typeof v === 'string' && ['CA100', 'GUI'].includes(v.toUpperCase()));

          const finalColor = isSelected ? '#eab308' : (isRest || isGui ? '#22c55e' : (color === '#3b82f6' ? '#94a3b8' : color));

          return (
            <group key={`supp-${i}`} position={mid} quaternion={quat} onPointerDown={handleSelect}>
              {/* Base Support Arrow (Upward) - Pointing from EP2 to EP1 (Pipe) */}
              <mesh position={[0, dist / 4, 0]}>
                <cylinderGeometry args={[0, r * 2, dist / 2, 8]} />
                <meshStandardMaterial color={finalColor} />
              </mesh>
              <mesh position={[0, -dist / 4, 0]}>
                 <cylinderGeometry args={[r, r, dist / 2, 8]} />
                 <meshStandardMaterial color={finalColor} />
              </mesh>

              {/* Lateral Arrows for CA100 / Gui */}
              {isGui && (
                <>
                  <mesh position={[dist / 3, dist / 4, 0]} rotation={[0, 0, Math.PI / 2]}>
                     <cylinderGeometry args={[0, r * 1.5, dist / 3, 8]} />
                     <meshStandardMaterial color={finalColor} />
                  </mesh>
                  <mesh position={[-dist / 3, dist / 4, 0]} rotation={[0, 0, -Math.PI / 2]}>
                     <cylinderGeometry args={[0, r * 1.5, dist / 3, 8]} />
                     <meshStandardMaterial color={finalColor} />
                  </mesh>
                </>
              )}
            </group>
          );
        }

        // Fallback: generic cylinder
        return (
          <mesh key={`im-${i}`} position={mid} quaternion={quat} onPointerDown={handleSelect}>
            <cylinderGeometry args={[r, r, dist, 16]} />
            <meshStandardMaterial color={isSelected ? '#eab308' : color} />
          </mesh>
        );
      })}
    </group>
  );
};

// ----------------------------------------------------
// Ghost overlay: wireframe of the element(s) affected
// by the currently-active proposal
// ----------------------------------------------------
const GhostOverlay = ({ activeProposal }) => {
  if (!activeProposal) return null;

  const elements = [activeProposal.elementA, activeProposal.elementB].filter(Boolean);

  return (
    <group>
      {elements.map((el, i) => {
        if (!el.ep1 || !el.ep2) return null;
        const vecA = new THREE.Vector3(el.ep1.x, el.ep1.y, el.ep1.z);
        const vecB = new THREE.Vector3(el.ep2.x, el.ep2.y, el.ep2.z);
        const dist = vecA.distanceTo(vecB);
        if (dist < 0.001) return null;
        const mid  = vecA.clone().lerp(vecB, 0.5);
        const dir  = vecB.clone().sub(vecA).normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
        const r    = el.bore ? el.bore / 2 : 5;
        return (
          <mesh key={`ghost-${i}`} position={mid} quaternion={quat}>
            <cylinderGeometry args={[r * 1.05, r * 1.05, dist, 16]} />
            {/* Faint highlight to show original position */}
            <meshBasicMaterial color="#eab308" opacity={0.3} transparent depthWrite={false} />
          </mesh>
        );
      })}
    </group>
  );
};

// ----------------------------------------------------
// Gap/Proposal Map Pin Visualization
// ----------------------------------------------------

// ----------------------------------------------------
// Active Issue Map Pin Visualization
// ----------------------------------------------------
const IssueMapPin = ({ activeIssue }) => {
  if (!activeIssue) return null;

  let pos = null;
  let label = "";
  let color = "#ef4444"; // red for validation

  if (activeIssue.type === 'validation' && activeIssue.data.ep1) {
      pos = [activeIssue.data.ep1.x, activeIssue.data.ep1.y, activeIssue.data.ep1.z];
      label = `Row ${activeIssue.data._rowIndex}`;
  } else if (activeIssue.type === 'proposal') {
      const prop = activeIssue.data;
      if (prop.ptA && prop.ptB) {
          pos = [(prop.ptA.x + prop.ptB.x)/2, (prop.ptA.y + prop.ptB.y)/2, (prop.ptA.z + prop.ptB.z)/2];
      } else if (prop.elementA && prop.elementA.ep1) {
          pos = [prop.elementA.ep1.x, prop.elementA.ep1.y, prop.elementA.ep1.z];
      }
      label = `Row ${prop.elementA?._rowIndex}`;
      color = "#3b82f6"; // blue for proposal
  }

  if (!pos) return null;

  return (
    <group position={pos}>
        {/* Pin Geometry */}
        <mesh position={[0, 150, 0]}>
            <sphereGeometry args={[50, 16, 16]} />
            <meshBasicMaterial color={color} />
        </mesh>
        <mesh position={[0, 75, 0]}>
            <coneGeometry args={[50, 150, 16]} rotation={[Math.PI, 0, 0]} />
            <meshBasicMaterial color={color} />
        </mesh>

        {/* Label Background */}
        <mesh position={[0, 250, 0]}>
            <planeGeometry args={[300, 100]} />
            <meshBasicMaterial color="white" side={THREE.DoubleSide} />
        </mesh>

        {/* Label Text */}
        <Text
            position={[0, 250, 1]}
            color="black"
            fontSize={60}
            anchorX="center"
            anchorY="middle"
            outlineWidth={2}
            outlineColor="white"
            fontWeight="bold"
        >
            {label}
        </Text>
    </group>
  );
};


// ----------------------------------------------------
// Smart Fix Proposal Rendering
// ----------------------------------------------------
const ProposalOverlay = ({ proposal }) => {
    if (!proposal || !proposal.ptA || !proposal.ptB) return null;

    const vecA = new THREE.Vector3(proposal.ptA.x, proposal.ptA.y, proposal.ptA.z);
    const vecB = new THREE.Vector3(proposal.ptB.x, proposal.ptB.y, proposal.ptB.z);
    const mid = new THREE.Vector3().addVectors(vecA, vecB).multiplyScalar(0.5);
    const dist = vecA.distanceTo(vecB);

    // Color based on action
    const action = proposal.fixType || proposal.action || '';

    // User requested: GAP_FILL (Pipe Fill) = Red translucent, TRIM (Pipe Trim) = Blue translucent
    let color = '#f59e0b'; // amber default
    if (action === 'GAP_FILL') color = '#ef4444'; // red
    if (action.includes('TRIM')) color = '#3b82f6'; // blue
    if (action === 'GAP_STRETCH_PIPE' || action === 'GAP_SNAP_IMMUTABLE_BLOCK') color = '#10b981'; // green

    // Cylinder orientation
    const dir = new THREE.Vector3().subVectors(vecB, vecA).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const bore = proposal.elementA?.bore || proposal.elementB?.bore || 50;

    return (
        <group>
            <Line points={[vecA, vecB]} color={color} lineWidth={3} dashed dashScale={10} dashSize={10} gapSize={10} />

            {/* Translucent Cylinder for Pipe Fill/Trim */}
            <mesh position={mid} quaternion={quaternion}>
                <cylinderGeometry args={[bore / 2, bore / 2, dist, 16]} />
                <meshStandardMaterial color={color} opacity={0.5} transparent depthWrite={false} side={THREE.DoubleSide} />
            </mesh>

            <mesh position={vecA}>
                <sphereGeometry args={[bore / 2 + 2, 8, 8]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <mesh position={vecB}>
                <sphereGeometry args={[bore / 2 + 2, 8, 8]} />
                <meshBasicMaterial color={color} />
            </mesh>

            <mesh position={mid}>
                <planeGeometry args={[300, 80]} />
                <meshBasicMaterial color="#1e293b" side={THREE.DoubleSide} opacity={0.8} transparent />
            </mesh>
            <Text
                position={[mid.x, mid.y, mid.z + 1]}
                color={color}
                fontSize={35}
                anchorX="center"
                anchorY="middle"
                outlineWidth={1}
                outlineColor="#0f172a"
            >
                {action} ({dist.toFixed(1)}mm)
            </Text>
        </group>
    );
};


// ----------------------------------------------------
// Single Issue Navigation Panel
// ----------------------------------------------------
const SingleIssuePanel = ({ proposals, validationIssues, currentIssueIndex, setCurrentIssueIndex, onAutoCenter, onApprove, onReject }) => {
    const allIssues = [
        ...validationIssues.map(i => ({ type: 'validation', data: i })),
        ...proposals.map(p => ({ type: 'proposal', data: p }))
    ];

    const safeIndex = Math.max(0, Math.min(currentIssueIndex, allIssues.length - 1));
    const currentItem = allIssues[safeIndex];

    // Draggable state using simple absolute positioning
    const [pos, setPos] = useState({ x: 0, y: 0 }); // Note: We handle setting this dynamically
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const panelRef = useRef(null);

    useEffect(() => {
        if (allIssues.length > 0 && onAutoCenter) {
            onAutoCenter();
        }
    }, [safeIndex, allIssues.length, onAutoCenter]);

    // Initialize position to bottom center once
    useEffect(() => {
        if (panelRef.current && pos.x === 0 && pos.y === 0) {
             const parent = panelRef.current.parentElement;
             if (parent) {
                 const pRect = parent.getBoundingClientRect();
                 const cRect = panelRef.current.getBoundingClientRect();
                 setPos({
                     x: (pRect.width / 2) - (cRect.width / 2),
                     y: pRect.height - cRect.height - 32 // 32px from bottom (bottom-8)
                 });
             }
        }
    }, [pos.x, pos.y]);

    if (allIssues.length === 0) return null;

    const handlePrev = () => setCurrentIssueIndex(Math.max(0, currentIssueIndex - 1));
    const handleNext = () => setCurrentIssueIndex(Math.min(allIssues.length - 1, currentIssueIndex + 1));

    const handlePointerDown = (e) => {
        setIsDragging(true);
        const rect = panelRef.current.getBoundingClientRect();
        // Calculate offset from the top-left of the panel
        setDragOffset({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging || !panelRef.current) return;
        const parent = panelRef.current.parentElement;
        if (!parent) return;

        const pRect = parent.getBoundingClientRect();

        // Calculate new X, Y relative to the parent container
        let newX = e.clientX - pRect.left - dragOffset.x;
        let newY = e.clientY - pRect.top - dragOffset.y;

        // Optional bounding box
        newX = Math.max(0, Math.min(newX, pRect.width - panelRef.current.offsetWidth));
        newY = Math.max(0, Math.min(newY, pRect.height - panelRef.current.offsetHeight));

        setPos({ x: newX, y: newY });
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);
    };

    // If pos is still 0,0, apply a CSS class for centering, otherwise use absolute top/left
    const style = (pos.x !== 0 || pos.y !== 0)
        ? { left: pos.x, top: pos.y }
        : { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' };

    return (
        <div
            ref={panelRef}
            style={style}
            className="absolute z-20 w-96 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden"
        >
            {/* Header / Drag Handle */}
            <div
                className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700 cursor-move"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <div className="flex items-center gap-2 pointer-events-none">
                    <span className="text-slate-300 font-bold text-sm">Issue {safeIndex + 1} of {allIssues.length}</span>
                </div>
                <div className="flex gap-1">
                    <button onClick={handlePrev} disabled={currentIssueIndex === 0} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                    <button onClick={onAutoCenter} className="p-1 rounded hover:bg-slate-700 transition" title="Focus Camera">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </button>
                    <button onClick={handleNext} disabled={currentIssueIndex === allIssues.length - 1} className="p-1 rounded hover:bg-slate-700 disabled:opacity-30 transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                </div>
            </div>

            {/* Content Body */}
            <div className="p-4">
                {currentItem.type === 'validation' ? (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-red-400 uppercase tracking-widest px-2 py-0.5 bg-red-900/30 rounded border border-red-800/50">Validation Issue</span>
                            <span className="text-slate-400 text-xs">Row {currentItem.data._rowIndex}</span>
                        </div>
                        <p className="text-sm text-slate-200 mb-1">{currentItem.data.type || 'Unknown Component'}</p>
                        <p className="text-xs text-slate-400 p-2 bg-slate-950 rounded border border-slate-800">{currentItem.data.fixingAction}</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest px-2 py-0.5 bg-amber-900/30 rounded border border-amber-800/50">Fix Proposal</span>
                            <span className="text-slate-400 text-xs">Row {currentItem.data.elementA?._rowIndex}</span>
                        </div>
                        <div className="p-2 bg-slate-950 rounded border border-slate-800">
                            <p className="text-sm text-slate-200 font-medium">{currentItem.data.description}</p>

                            {/* Detailed Proposal Info */}
                            {(() => {
                                const prop = currentItem.data;
                                return (
                                    <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-end">
                                        <div>
                                           <div className="text-[10px] text-slate-500">Action: {prop.action}</div>
                                           {prop.dist !== undefined && <div className="text-[10px] text-slate-500">Delta: {prop.dist.toFixed(1)}mm</div>}
                                        </div>
                                        {prop.score !== undefined && (
                                            <div className="flex items-center">
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${prop.score >= 10 ? 'text-green-400 bg-green-900/30 border-green-800' : 'text-orange-400 bg-orange-900/30 border-orange-800'}`}>Score {prop.score}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Actions */}
                            <div className="mt-4 flex gap-2">
                                {currentItem.data._fixApproved === true ? (
                                    <div className="w-full text-center text-green-500 font-bold text-sm py-1 bg-green-900/20 rounded border border-green-800/30">✓ Approved</div>
                                ) : currentItem.data._fixApproved === false ? (
                                    <div className="w-full text-center text-red-500 font-bold text-sm py-1 bg-red-900/20 rounded border border-red-800/30">✗ Rejected</div>
                                ) : (
                                    <>
                                        <button className="flex-1 bg-green-800 hover:bg-green-700 text-white text-sm py-1.5 rounded transition" onClick={(e) => onApprove(e, currentItem.data)}>
                                            ✓ Approve
                                        </button>
                                        <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1.5 rounded transition flex justify-center items-center gap-1" onClick={(e) => onReject(e, currentItem.data)}>
                                            ✗ Reject
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------
// Global Snap Layer
// Provides a unified snapping point for Measure, Break, etc.
// ----------------------------------------------------
const GlobalSnapLayer = () => {
    const canvasMode = useStore(state => state.canvasMode);
    const dataTable = useStore(state => state.dataTable);
    const setCursorSnapPoint = useStore(state => state.setCursorSnapPoint);
    const cursorSnapPoint = useStore(state => state.cursorSnapPoint);

    // Only active during tools that need picking
    const isActive = ['MEASURE', 'BREAK', 'CONNECT', 'STRETCH', 'INSERT_SUPPORT'].includes(canvasMode);

    useEffect(() => {
        if (!isActive) {
            setCursorSnapPoint(null);
        }
    }, [isActive, setCursorSnapPoint]);

    if (!isActive) return null;

    const snapRadius = 50; // mm

    const handlePointerMove = (e) => {
        let nearest = null;
        let minDist = snapRadius;

        // Find closest ep1, ep2, or midpoint
        dataTable.forEach(row => {
            const ptsToTest = [];
            if (row.ep1) ptsToTest.push(new THREE.Vector3(row.ep1.x, row.ep1.y, row.ep1.z));
            if (row.ep2) ptsToTest.push(new THREE.Vector3(row.ep2.x, row.ep2.y, row.ep2.z));
            if (row.ep1 && row.ep2) {
                const mid = new THREE.Vector3(row.ep1.x, row.ep1.y, row.ep1.z)
                    .lerp(new THREE.Vector3(row.ep2.x, row.ep2.y, row.ep2.z), 0.5);
                ptsToTest.push(mid);
            }

            ptsToTest.forEach(pt => {
                const dist = pt.distanceTo(e.point);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = pt;
                }
            });
        });

        if (nearest) {
            // Update state ONLY if point changed to avoid re-renders
            if (!cursorSnapPoint || cursorSnapPoint.distanceTo(nearest) > 0.1) {
                setCursorSnapPoint(nearest);
            }
        } else if (cursorSnapPoint) {
            setCursorSnapPoint(null);
        }
    };

    return (
        <group onPointerMove={handlePointerMove}>
            {/* Click plane for generic move events */}
            <mesh visible={false}>
                <planeGeometry args={[200000, 200000]} />
            </mesh>

            {cursorSnapPoint && (
                <mesh position={cursorSnapPoint} renderOrder={999}>
                    <sphereGeometry args={[15, 16, 16]} />
                    <meshBasicMaterial color="#eab308" transparent opacity={0.8} depthTest={false} />
                </mesh>
            )}
        </group>
    );
};

// ----------------------------------------------------
// Custom Legend Layer
// ----------------------------------------------------
const LegendLayer = () => {
    const colorMode = useStore(state => state.colorMode);
    const dataTable = useStore(state => state.dataTable);
    const appSettings = useStore(state => state.appSettings);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const uniqueValues = useMemo(() => {
        if (colorMode === 'SPOOL' || colorMode === 'TYPE' || !colorMode) return [];
        const vals = new Set();
        dataTable.forEach(r => {
            const val = getColorModeValue(r, colorMode);
            if (val) vals.add(val);
        });
        return Array.from(vals).sort();
    }, [dataTable, colorMode]);

    const uniqueTypes = useMemo(() => {
        if (colorMode !== 'TYPE') return [];
        const vals = new Set();
        dataTable.forEach(r => {
            if (r.type) vals.add(r.type.toUpperCase());
        });
        return Array.from(vals).sort();
    }, [dataTable, colorMode]);

    if (colorMode === 'TYPE') {
        return (
            <div className="flex flex-col gap-1 bg-slate-900/90 p-3 rounded border border-slate-700 backdrop-blur pointer-events-auto shadow-xl shrink-0">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-1 mb-1">
                  <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-red-500 hover:text-red-400 text-xs">
                    {isCollapsed ? '▶' : '▼'}
                  </button>
                  <h4 className="text-xs font-bold text-slate-300">Type Legend</h4>
                </div>
                {!isCollapsed && uniqueTypes.map(val => (
                    <div key={val} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: typeColor(val, appSettings) }}></div>
                        <span className="text-xs text-slate-400">{val}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (colorMode === 'SPOOL') {
        const spools = computeSpools(dataTable);
        const uniqueSpoolIds = Array.from(new Set(Object.values(spools))).sort((a, b) => a - b);

        return (
            <div className="flex flex-col gap-1 bg-slate-900/90 p-3 rounded border border-slate-700 backdrop-blur pointer-events-auto shadow-xl shrink-0 max-h-64 overflow-y-auto">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-1 mb-1">
                  <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-red-500 hover:text-red-400 text-xs">
                    {isCollapsed ? '▶' : '▼'}
                  </button>
                  <h4 className="text-xs font-bold text-slate-300">Spool Legend</h4>
                </div>
                {!isCollapsed && uniqueSpoolIds.map(val => (
                    <div key={val} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: spoolColor(val) }}></div>
                        <span className="text-xs text-slate-400">Spool {val}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (uniqueValues.length === 0) return null;

    return (
        <div className="flex flex-col gap-1 bg-slate-900/90 p-3 rounded border border-slate-700 backdrop-blur pointer-events-auto shadow-xl shrink-0 max-h-64 overflow-y-auto">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-1 mb-1">
              <button onClick={() => setIsCollapsed(!isCollapsed)} className="text-red-500 hover:text-red-400 text-xs">
                {isCollapsed ? '▶' : '▼'}
              </button>
              <h4 className="text-xs font-bold text-slate-300">{colorMode} Legend</h4>
            </div>
            {!isCollapsed && (
              <>
                {uniqueValues.map(val => (
                    <div key={val} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCAColor(val) }}></div>
                        <span className="text-xs text-slate-400">{val}</span>
                    </div>
                ))}
                <div className="flex items-center gap-2 mt-1">
                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                    <span className="text-xs text-slate-500 italic">None / Missing</span>
                </div>
              </>
            )}
        </div>
    );
};

// ----------------------------------------------------
// Marquee Overlay
// ----------------------------------------------------
const MarqueeLayer = () => {
    const canvasMode = useStore(state => state.canvasMode);
    const setCanvasMode = useStore(state => state.setCanvasMode);
    const dataTable = useStore(state => state.dataTable);
    const setMultiSelect = useStore(state => state.setMultiSelect);
    const pushHistory = useStore(state => state.pushHistory);
    const { dispatch } = useAppContext();
    const [startPt, setStartPt] = useState(null);
    const [currPt, setCurrPt] = useState(null);

    const isActive = canvasMode === 'MARQUEE_SELECT' || canvasMode === 'MARQUEE_ZOOM' || canvasMode === 'MARQUEE_DELETE';
    if (!isActive) return null;

    const handlePointerDown = (e) => {
        e.stopPropagation();
        setStartPt(e.point.clone());
        setCurrPt(e.point.clone());
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!startPt) return;
        setCurrPt(e.point.clone());
    };

    const handlePointerUp = (e) => {
        if (!startPt || !currPt) return;
        e.stopPropagation();
        e.target.releasePointerCapture(e.pointerId);

        // Compute Bounding Box
        const minX = Math.min(startPt.x, currPt.x);
        const maxX = Math.max(startPt.x, currPt.x);
        const minY = Math.min(startPt.y, currPt.y) - 5000; // expand Y broadly since dragging in top-down view is usually X/Z
        const maxY = Math.max(startPt.y, currPt.y) + 5000;
        const minZ = Math.min(startPt.z, currPt.z);
        const maxZ = Math.max(startPt.z, currPt.z);
        const box = new THREE.Box3(new THREE.Vector3(minX, minY, minZ), new THREE.Vector3(maxX, maxY, maxZ));

        // Find intersecting elements
        const selected = [];
        dataTable.forEach(el => {
            if (useStore.getState().hiddenElementIds.includes(el._rowIndex)) return;

            let pts = [];
            if (el.ep1) pts.push(new THREE.Vector3(el.ep1.x, el.ep1.y, el.ep1.z));
            if (el.ep2) pts.push(new THREE.Vector3(el.ep2.x, el.ep2.y, el.ep2.z));

            // If dragging Right-to-Left (Crossing):
            // We just need any point inside box (simplification, real crossing tests segment intersection).
            const isCrossing = currPt.x < startPt.x;

            let allInside = pts.length > 0;
            let anyInside = false;

            pts.forEach(pt => {
                const inside = box.containsPoint(pt);
                if (!inside) allInside = false;
                if (inside) anyInside = true;
            });

            if ((isCrossing && anyInside) || (!isCrossing && allInside)) {
                selected.push(el);
            }
        });

        if (canvasMode === 'MARQUEE_SELECT') {
            setMultiSelect(selected.map(e => e._rowIndex));
        } else if (canvasMode === 'MARQUEE_ZOOM' && selected.length > 0) {
            setMultiSelect(selected.map(e => e._rowIndex));
            window.dispatchEvent(new CustomEvent('canvas-auto-center', { detail: { elements: selected } }));
        } else if (canvasMode === 'MARQUEE_DELETE' && selected.length > 0) {
            if (window.confirm(`Delete ${selected.length} elements?`)) {
                pushHistory('Delete Marquee');
                const rowIndices = selected.map(e => e._rowIndex);
                dispatch({ type: 'DELETE_ELEMENTS', payload: { rowIndices } });

                // Update Zustand directly to avoid relying on full table replacement here if we can help it,
                // but Context should sync.
                const updatedTable = useStore.getState().dataTable.filter(r => !rowIndices.includes(r._rowIndex));
                useStore.getState().setDataTable(updatedTable);

                dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Applied/Fix", message: `Deleted ${selected.length} elements via marquee.` } });
            }
        }

        setStartPt(null);
        setCurrPt(null);
        setCanvasMode('VIEW');
    };

    return (
        <group>
            {/*
              Fix WebGL Context Loss:
              Instead of a massive 500,000x500,000 physical mesh plane that can cause extreme
              clipping/precision errors in the depth buffer, we use a global full-screen
              overlay handler that relies on the generic ThreeJS raycaster via pointer events,
              but attached to an invisible, screen-filling background mesh.
              Because we don't strictly need a plane, we can just attach these events
              to a simple infinite bounding volume or rely on `Canvas` global events.
              However, for localized intercept, a small plane scaled up works best if depthTest=false
              and renderOrder is low. Let's use a smaller base size and scale it.
            */}
            <mesh
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, Math.max(startPt?.y || 0, 0) + 1, 0]}
                scale={[2000, 2000, 1]}
                renderOrder={-1}
            >
                <planeGeometry args={[500, 500]} />
                <meshBasicMaterial visible={false} depthTest={false} />
            </mesh>

            {/* Marquee Visuals */}
            {startPt && currPt && (
                <Line
                    points={[
                        new THREE.Vector3(startPt.x, startPt.y, startPt.z),
                        new THREE.Vector3(currPt.x, startPt.y, startPt.z),
                        new THREE.Vector3(currPt.x, startPt.y, currPt.z),
                        new THREE.Vector3(startPt.x, startPt.y, currPt.z),
                        new THREE.Vector3(startPt.x, startPt.y, startPt.z),
                    ]}
                    color={currPt.x < startPt.x ? "#10b981" : "#3b82f6"} // Green for crossing, Blue for window
                    lineWidth={3}
                    depthTest={false}
                />
            )}
        </group>
    );
};

// ----------------------------------------------------
// Measure Tool
// ----------------------------------------------------
const MeasureTool = () => {
    const measurePts = useStore(state => state.measurePts);
    const addMeasurePt = useStore(state => state.addMeasurePt);
    const canvasMode = useStore(state => state.canvasMode);
    const cursorSnapPoint = useStore(state => state.cursorSnapPoint);

    if (canvasMode !== 'MEASURE') return null;

    const handlePointerDown = (e) => {
        // Only run when directly hitting the global plane OR if handled by a specific mesh event handler that explicitly bubbles.
        // Actually, for robust measurement, relying on the global click plane is fine as long as depthWrite=false so it intercepts.
        // But since we want to snap to objects, we'll let `InstancedPipes` handle the click bubbling or use this capture plane.
        e.stopPropagation();
        addMeasurePt(cursorSnapPoint ? cursorSnapPoint.clone() : e.point.clone());
    };

    return (
        <group>
            {/* Provide a large capture plane so clicking "empty" space still registers a point,
                but ensure it renders behind everything else and doesn't write to depth so object clicks can hit first if needed,
                OR we just rely on this intercepting everything and using cursorSnapPoint! */}
            <mesh onPointerDown={handlePointerDown} renderOrder={-1}>
                 <planeGeometry args={[200000, 200000]} />
                 <meshBasicMaterial visible={false} depthWrite={false} transparent opacity={0} />
            </mesh>

            {measurePts.length >= 1 && (
                <mesh position={measurePts[0]}>
                    <sphereGeometry args={[20, 16, 16]} />
                    <meshBasicMaterial color="#eab308" />
                </mesh>
            )}

            {measurePts.length === 2 && (
                <>
                    <mesh position={measurePts[1]}>
                        <sphereGeometry args={[20, 16, 16]} />
                        <meshBasicMaterial color="#eab308" />
                    </mesh>
                    <Line points={[measurePts[0], measurePts[1]]} color="#eab308" lineWidth={3} />

                    {(() => {
                        const mid = measurePts[0].clone().lerp(measurePts[1], 0.5);
                        const dist = measurePts[0].distanceTo(measurePts[1]);

                        // Push text up by half bore based on selected element (approx 50-100 units)
                        const storeData = useStore.getState().parsedData || [];
                        const selectedId = useStore.getState().selectedElementId;
                        const multiIds = useStore.getState().multiSelectedIds || [];
                        const selectedElem = storeData.find(d => d.id === selectedId || multiIds.includes(d.id));
                        const boreOffset = selectedElem && selectedElem.bore ? selectedElem.bore / 2 : 100;
                        mid.y += boreOffset;

                        const dx = Math.abs(measurePts[0].x - measurePts[1].x);
                        const dy = Math.abs(measurePts[0].y - measurePts[1].y);
                        const dz = Math.abs(measurePts[0].z - measurePts[1].z);
                        return (
                            <group position={mid}>
                                <mesh position={[0, 0, 0]}>
                                    <planeGeometry args={[1000, 400]} />
                                    <meshBasicMaterial color="#1e293b" side={THREE.DoubleSide} opacity={0.8} transparent depthTest={false} />
                                </mesh>
                                <Text position={[0, 50, 1]} color="#eab308" fontSize={100} anchorX="center" anchorY="middle" outlineWidth={2} outlineColor="#0f172a" depthTest={false}>
                                    Dist: {dist.toFixed(1)}mm
                                </Text>
                                <Text position={[0, -50, 1]} color="#cbd5e1" fontSize={60} anchorX="center" anchorY="middle" outlineWidth={2} outlineColor="#0f172a" depthTest={false}>
                                    X:{dx.toFixed(1)} Y:{dy.toFixed(1)} Z:{dz.toFixed(1)}
                                </Text>
                            </group>
                        );
                    })()}
                </>
            )}

            {/* Button to clear measure (optional, usually users hit Esc or 'm' again to exit) */}
        </group>
    );
};

// ----------------------------------------------------
// Break Pipe Layer
// ----------------------------------------------------
const BreakPipeLayer = () => {
    const canvasMode = useStore(state => state.canvasMode);
    const dataTable = useStore(state => state.dataTable);
    const { dispatch } = useAppContext();
    const pushHistory = useStore(state => state.pushHistory);
    const cursorSnapPoint = useStore(state => state.cursorSnapPoint);

    const [hoverPos, setHoverPos] = useState(null);

    if (canvasMode !== 'BREAK') return null;

    const handlePointerMove = (e) => {
        // e.object is the instanceMesh, but we need world point
        if (e.point) {
            setHoverPos(e.point);
        }
    };

    const handlePointerOut = () => {
        setHoverPos(null);
    };

    const handlePointerDown = (e, pipeRow) => {
        e.stopPropagation();

        // Ensure it's a pipe
        if (pipeRow) {

            pushHistory('Break Pipe');

            const breakPt = cursorSnapPoint ? cursorSnapPoint.clone() : e.point.clone();
            const breakResults = breakPipeAtPoint(pipeRow, breakPt);

            if (breakResults) {
                const [rowA, rowB] = breakResults;

                // Dispatch to AppContext
                dispatch({
                    type: 'BREAK_PIPE',
                    payload: { rowIndex: pipeRow._rowIndex, rowA, rowB }
                });

                // Mirror to Zustand
                const updatedTable = dataTable.flatMap(r =>
                    r._rowIndex === pipeRow._rowIndex ? [rowA, rowB] : [r]
                ).map((r, i) => ({ ...r, _rowIndex: i + 1 })); // Re-index

                useStore.getState().setDataTable(updatedTable);

                dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Applied/Fix", message: `Row ${pipeRow._rowIndex} broken at (${breakPt.x.toFixed(1)}, ${breakPt.y.toFixed(1)}, ${breakPt.z.toFixed(1)}).` } });

                // One-shot action
                useStore.getState().setCanvasMode('VIEW');
            } else {
                dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Error", message: `Cannot break pipe Row ${pipeRow._rowIndex}. Segment too short.` } });
            }
        }
    };

    return (
        <group>
             {/* Invisible plane/mesh intercepts down events?
                 Actually we attach events to the InstancedPipes via the group if we could,
                 but they are already rendered. We can render a transparent overlay of pipes here.
             */}
             <group onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}>
                {dataTable.filter(r => (r.type||'').toUpperCase() === 'PIPE' && !useStore.getState().hiddenElementIds.includes(r._rowIndex)).map((pipe, i) => {
                    if (!pipe.ep1 || !pipe.ep2) return null;
                    const v1 = new THREE.Vector3(pipe.ep1.x, pipe.ep1.y, pipe.ep1.z);
                    const v2 = new THREE.Vector3(pipe.ep2.x, pipe.ep2.y, pipe.ep2.z);
                    const mid = v1.clone().lerp(v2, 0.5);
                    const dist = v1.distanceTo(v2);
                    if (dist === 0) return null;
                    const dir = v2.clone().sub(v1).normalize();
                    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
                    const r = pipe.bore ? pipe.bore / 2 : 5;
                    return (
                        <mesh key={`bp-${i}`} position={mid} quaternion={quat} onPointerDown={(e) => handlePointerDown(e, pipe)}>
                            <cylinderGeometry args={[r*1.5, r*1.5, dist, 8]} />
                            <meshBasicMaterial color="red" transparent opacity={0} depthWrite={false} />
                        </mesh>
                    );
                })}
             </group>

             {hoverPos && (
                 <mesh position={hoverPos}>
                     <sphereGeometry args={[20, 16, 16]} />
                     <meshBasicMaterial color="#eab308" transparent opacity={0.6} depthTest={false} />
                 </mesh>
             )}
        </group>
    );
};

// ----------------------------------------------------
// Endpoint Snap Layer
// ----------------------------------------------------
const EndpointSnapLayer = () => {
    const canvasMode = useStore(state => state.canvasMode);
    const setCanvasMode = useStore(state => state.setCanvasMode);
    const dataTable = useStore(state => state.dataTable);
    const updateDataTable = useStore(state => state.updateDataTable);
    const pushHistory = useStore(state => state.pushHistory);
    const { dispatch } = useAppContext();

    const [connectDraft, setConnectDraft] = useState(null);
    const [cursorPos, setCursorPos] = useState(new THREE.Vector3());

    // Active in CONNECT or STRETCH mode
    if (canvasMode !== 'CONNECT' && canvasMode !== 'STRETCH') return null;

    const snapRadius = 50; // mm

    const handlePointerMove = (e) => {
        let pt = e.point.clone();

        if (connectDraft && useStore.getState().orthoMode) {
            const rawDelta = pt.clone().sub(connectDraft.fromPosition);
            const absX = Math.abs(rawDelta.x);
            const absY = Math.abs(rawDelta.y);
            const absZ = Math.abs(rawDelta.z);
            if (absX >= absY && absX >= absZ) { rawDelta.y = 0; rawDelta.z = 0; }
            else if (absY >= absX && absY >= absZ) { rawDelta.x = 0; rawDelta.z = 0; }
            else { rawDelta.x = 0; rawDelta.y = 0; }
            pt = connectDraft.fromPosition.clone().add(rawDelta);
        }

        setCursorPos(pt);
        let nearest = null;
        let minDist = snapRadius;

        dataTable.forEach((row) => {
            ['ep1', 'ep2'].forEach(epKey => {
                const ep = row[epKey];
                if (ep) {
                    const pt = new THREE.Vector3(parseFloat(ep.x), parseFloat(ep.y), parseFloat(ep.z));
                    const d = pt.distanceTo(e.point);
                    if (d < minDist) {
                        minDist = d;
                        nearest = { row, epKey, position: pt };
                    }
                }
            });
        });

        // We already use useStore(cursorSnapPoint) globally but here we need
        // to manage click/drag specifically for stretching endpoints.
        // We'll rely on the global snap point for visuals, but we handle the dragging here.
    };

    const handlePointerDown = (e) => {
        // We handle logic in PointerUp for click-to-connect now
    };

    const handlePointerUp = (e) => {
        e.stopPropagation();

        let nearest = null;
        let minDist = snapRadius;

        dataTable.forEach((row) => {
            ['ep1', 'ep2'].forEach(epKey => {
                const ep = row[epKey];
                if (ep) {
                    const pt = new THREE.Vector3(parseFloat(ep.x), parseFloat(ep.y), parseFloat(ep.z));
                    const d = pt.distanceTo(e.point);
                    if (d < minDist) {
                        minDist = d;
                        nearest = { rowIndex: row._rowIndex, epKey, position: pt };
                    }
                }
            });
        });

        // If we don't have a draft yet, set the draft (First Click)
        if (!connectDraft) {
            if (nearest) {
                setConnectDraft({ fromRowIndex: nearest.rowIndex, fromEP: nearest.epKey, fromPosition: nearest.position });
            }
            return;
        }

        // Second click: If dropped on another valid snap point
        if (nearest && (nearest.rowIndex !== connectDraft.fromRowIndex || nearest.epKey !== connectDraft.fromEP)) {
            pushHistory(canvasMode === 'STRETCH' ? 'Stretch Pipe' : 'Snap Connect');

            const sourceRow = dataTable.find(r => r._rowIndex === connectDraft.fromRowIndex);
            if (sourceRow) {
                const targetPos = nearest.position;
                const sourcePos = connectDraft.fromPosition;

                const updatedTable = [...dataTable];
                const sourceIdxInArray = updatedTable.findIndex(r => r._rowIndex === connectDraft.fromRowIndex);

                if (canvasMode === 'STRETCH') {
                    // STRETCH MODE: Update the endpoint of the existing pipe
                    if (sourceIdxInArray !== -1) {
                        const updatedRow = { ...updatedTable[sourceIdxInArray] };
                        updatedRow[connectDraft.fromEP] = { x: targetPos.x, y: targetPos.y, z: targetPos.z };
                        updatedTable[sourceIdxInArray] = updatedRow;

                        dispatch({
                            type: 'APPLY_GAP_FIX',
                            payload: { updatedTable }
                        });
                        useStore.getState().setDataTable(updatedTable);
                        dispatch({
                            type: 'ADD_LOG',
                            payload: { type: 'Applied/Fix', stage: 'STRETCH_TOOL', message: `Stretched Row ${sourceRow._rowIndex} to Row ${nearest.rowIndex}.` }
                        });
                    }
                } else {
                    // CONNECT MODE: Synthesize new bridge pipe instead of stretching
                    const newBridgePipe = {
                        type: 'PIPE',
                        ep1: { x: sourcePos.x, y: sourcePos.y, z: sourcePos.z },
                        ep2: { x: targetPos.x, y: targetPos.y, z: targetPos.z },
                        bore: sourceRow.bore || 100,
                        pipelineRef: `${sourceRow.pipelineRef || 'UNKNOWN'}_bridge`,
                        skey: 'PIPE',
                        ca1: sourceRow.ca1 || sourceRow.CA1 || '',
                        ca2: sourceRow.ca2 || sourceRow.CA2 || '',
                        ca3: sourceRow.ca3 || sourceRow.CA3 || '',
                        ca4: sourceRow.ca4 || sourceRow.CA4 || '',
                        ca5: sourceRow.ca5 || sourceRow.CA5 || '',
                        ca6: sourceRow.ca6 || sourceRow.CA6 || '',
                        ca7: sourceRow.ca7 || sourceRow.CA7 || '',
                        ca8: sourceRow.ca8 || sourceRow.CA8 || '',
                        ca9: sourceRow.ca9 || sourceRow.CA9 || '',
                        ca10: sourceRow.ca10 || sourceRow.CA10 || '',
                        tag: `${sourceRow.pipelineRef || 'UNKNOWN'}_3DTopoBridge`
                    };

                    // Find the highest existing _rowIndex to ensure uniqueness without corrupting others
                    const maxRowIndex = Math.max(...updatedTable.map(r => r._rowIndex || 0));
                    newBridgePipe._rowIndex = maxRowIndex + 1;

                    // Splice the new bridge pipe into the table, inserted between the source and target rows.
                    // Insert after source row (or append if not found)
                    if (sourceIdxInArray !== -1) {
                       updatedTable.splice(sourceIdxInArray + 1, 0, newBridgePipe);
                    } else {
                       updatedTable.push(newBridgePipe);
                    }

                    // Dispatch APPLY_GAP_FIX which replaces the full table in AppContext
                    dispatch({
                        type: 'APPLY_GAP_FIX',
                        payload: { updatedTable }
                    });

                    // Mirror to Zustand store
                    useStore.getState().setDataTable(updatedTable);

                    dispatch({
                        type: 'ADD_LOG',
                        payload: { type: 'Applied/Fix', stage: 'CONNECT_TOOL', message: `Bridged Row ${sourceRow._rowIndex} and Row ${nearest.rowIndex} with a new PIPE.` }
                    });
                }
            }
        }

        setConnectDraft(null);
        setCanvasMode('VIEW');
    };

    return (
        <group>
            {/* Transparent capture plane for CONNECT or STRETCH mode */}
            <mesh
                scale={100000}
                rotation={[-Math.PI / 2, 0, 0]}
                onPointerMove={handlePointerMove}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                renderOrder={-1}
            >
                <planeGeometry />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Draw snap targets on every EP */}
            {dataTable.map(row => {
                const pts = [];
                if (row.ep1) pts.push(new THREE.Vector3(parseFloat(row.ep1.x), parseFloat(row.ep1.y), parseFloat(row.ep1.z)));
                if (row.ep2) pts.push(new THREE.Vector3(parseFloat(row.ep2.x), parseFloat(row.ep2.y), parseFloat(row.ep2.z)));
                return pts.map((pt, i) => (
                    <mesh key={`snap-${row._rowIndex}-${i}`} position={pt} renderOrder={999}>
                        <sphereGeometry args={[20, 16, 16]} />
                        <meshBasicMaterial color="#eab308" transparent opacity={0.5} depthTest={false} />
                    </mesh>
                ));
            })}

            {/* Draw active connection preview line */}
            {connectDraft && (() => {
                const start = connectDraft.fromPosition;
                const end = cursorPos;
                const vec = new THREE.Vector3().subVectors(end, start);
                const len = vec.length();
                if (len < 0.1) return null; // Avoid rendering 0-length cylinders
                const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
                const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vec.clone().normalize());
                const color = canvasMode === 'STRETCH' ? '#10b981' : '#f59e0b'; // Emerald for stretch, Amber for connect

                return (
                    <mesh position={mid} quaternion={q} renderOrder={998}>
                        <cylinderGeometry args={[15, 15, len, 8]} />
                        <meshStandardMaterial color={color} transparent opacity={0.6} depthTest={false} />
                    </mesh>
                );
            })()}
        </group>
    );
};

// ----------------------------------------------------
// Gap Radar Layer
// ----------------------------------------------------
const GapRadarLayer = () => {
    const showGapRadar = useStore(state => state.showGapRadar);
    const dataTable = useStore(state => state.dataTable);

    // For pulsing animation
    const materialRef = useRef();
    const sphereRef = useRef();

    useFrame(({ clock }) => {
        if (showGapRadar) {
            const time = clock.getElapsedTime();
            const scale = 1 + Math.sin(time * 3) * 0.2; // pulse between 0.8 and 1.2
            const opacity = 0.6 + Math.sin(time * 3) * 0.3; // pulse between 0.3 and 0.9

            // Only update if materials/meshes exist. Since we might have multiple gaps,
            // we animate a global material or just rely on CSS-like scale?
            // Actually, we can just apply it to a shared value or let useFrame map over refs.
            // A simpler way: we'll animate a shared scale/opacity uniform/property on the group level
            // but for simplicity, let's just create a pulsing component for each gap.
        }
    });

    const gaps = useMemo(() => {
        if (!showGapRadar || dataTable.length === 0) return [];
        const found = [];
        const topologyRows = dataTable.filter(r => (r.type || '').toUpperCase() !== 'SUPPORT' && (r.ep1 || r.ep2));

        for (let i = 0; i < topologyRows.length - 1; i++) {
            const elA = topologyRows[i];
            const elB = topologyRows[i + 1];
            if (elA.ep2 && elB.ep1) {
                const ptA = new THREE.Vector3(elA.ep2.x, elA.ep2.y, elA.ep2.z);
                const ptB = new THREE.Vector3(elB.ep1.x, elB.ep1.y, elB.ep1.z);
                const dist = ptA.distanceTo(ptB);
                if (dist > 0 && dist <= 25.0) {
                    found.push({ ptA, ptB, dist, mid: ptA.clone().lerp(ptB, 0.5) });
                }
            }
        }
        return found;
    }, [showGapRadar, dataTable]);

    if (!showGapRadar || gaps.length === 0) return null;

    return (
        <group>
            {gaps.map((gap, i) => {
                const color = gap.dist <= 6.0 ? '#f97316' : '#ef4444'; // Orange for fixable, Red for insert pipe
                return (
                    <PulsingGap key={`gap-${i}`} gap={gap} color={color} />
                );
            })}
        </group>
    );
};

const PulsingGap = ({ gap, color }) => {
    const meshRefA = useRef();
    const matRefA = useRef();
    const meshRefB = useRef();
    const matRefB = useRef();

    useFrame(({ clock }) => {
        if (!meshRefA.current || !matRefA.current || !meshRefB.current || !matRefB.current) return;
        const time = clock.getElapsedTime();
        const s = 1 + Math.sin(time * 5) * 0.35; // Pulse scale
        meshRefA.current.scale.set(s, s, s);
        meshRefB.current.scale.set(s, s, s);
        const opacity = 0.5 + Math.abs(Math.sin(time * 5)) * 0.4;
        matRefA.current.opacity = opacity;
        matRefB.current.opacity = opacity;
    });

    return (
        <group>
            {/* Glow effect */}
            <Line points={[gap.ptA, gap.ptB]} color={color} lineWidth={12} transparent opacity={0.3} depthTest={false} />
            {/* Core line */}
            <Line points={[gap.ptA, gap.ptB]} color={color} lineWidth={4} dashed dashSize={5} gapSize={2} depthTest={false} />

            {/* Pulsing Spheres at endpoints for visibility */}
            <mesh position={gap.ptA} ref={meshRefA}>
                <sphereGeometry args={[20, 16, 16]} />
                <meshBasicMaterial ref={matRefA} color={color} transparent opacity={0.7} depthTest={false} />
            </mesh>
            <mesh position={gap.ptB} ref={meshRefB}>
                <sphereGeometry args={[20, 16, 16]} />
                <meshBasicMaterial ref={matRefB} color={color} transparent opacity={0.7} depthTest={false} />
            </mesh>

            {/* Billboard text */}
            <Text position={[gap.mid.x, gap.mid.y + 15, gap.mid.z]} color={color} fontSize={20} fontWeight="bold" anchorX="center" outlineWidth={2} outlineColor="#000" depthTest={false}>
                ⚠ {gap.dist.toFixed(1)}mm Gap
            </Text>
        </group>
    );
};

// ----------------------------------------------------
// EP Labels
// ----------------------------------------------------
const EPLabelsLayer = () => {
    const showRowLabels = useStore(state => state.showRowLabels);
    const showRefLabels = useStore(state => state.showRefLabels);
    const dataTable = useStore(state => state.dataTable);
    const { dispatch } = useAppContext();

    useEffect(() => {
        if ((showRowLabels || showRefLabels) && dataTable.length > 500) {
            dispatch({ type: "ADD_LOG", payload: { stage: "UI", type: "Warning", message: "Labels disabled: >500 elements causes performance issues." } });
            if (showRowLabels) useStore.getState().setShowRowLabels(false);
            if (showRefLabels) useStore.getState().setShowRefLabels(false);
        }
    }, [showRowLabels, showRefLabels, dataTable.length, dispatch]);

    if ((!showRowLabels && !showRefLabels) || dataTable.length > 500) return null;

    return (
        <group>
            {dataTable.map((el, i) => {
                if (!el.ep1 && !el.ep2) return null;
                const pt = el.ep1 || el.ep2;
                return (
                    <React.Fragment key={`eplabels-${i}`}>
                        {showRowLabels && (
                            <Text position={[pt.x, pt.y + 30, pt.z]} color="#eab308" fontSize={50} outlineWidth={2} outlineColor="#0f172a">
                                R{el._rowIndex}
                            </Text>
                        )}
                        {showRefLabels && el.pipelineRef && (
                            <Text position={[pt.x, pt.y + 80, pt.z]} color="#38bdf8" fontSize={50} outlineWidth={2} outlineColor="#0f172a">
                                {el.pipelineRef}
                            </Text>
                        )}
                    </React.Fragment>
                );
            })}
        </group>
    );
};

// ----------------------------------------------------
// Insert Support Layer
// ----------------------------------------------------
const InsertSupportLayer = () => {
    const canvasMode = useStore(state => state.canvasMode);
    const dataTable = useStore(state => state.dataTable);
    const { dispatch } = useAppContext();
    const pushHistory = useStore(state => state.pushHistory);
    const cursorSnapPoint = useStore(state => state.cursorSnapPoint);

    const [hoverPos, setHoverPos] = useState(null);

    if (canvasMode !== 'INSERT_SUPPORT') return null;

    const handlePointerMove = (e) => {
        if (e.point) setHoverPos(e.point);
    };

    const handlePointerOut = () => {
        setHoverPos(null);
    };

    const handlePointerDown = (e, pipeRow) => {
        e.stopPropagation();

        if (pipeRow) {

            pushHistory('Insert Support');

            const insertPt = cursorSnapPoint ? cursorSnapPoint.clone() : e.point.clone();
            const supportRow = insertSupportAtPipe(pipeRow, insertPt);

            if (supportRow) {
                // Determine new index and update
                const newRowIndex = Math.max(...dataTable.map(r => r._rowIndex || 0)) + 1;
                supportRow._rowIndex = newRowIndex;

                dispatch({
                    type: 'INSERT_SUPPORT',
                    payload: { afterRowIndex: pipeRow._rowIndex, supportRow }
                });

                // Add right after the pipe
                const idx = dataTable.findIndex(r => r._rowIndex === pipeRow._rowIndex);
                const updatedTable = [...dataTable];
                updatedTable.splice(idx + 1, 0, supportRow);
                const reindexedTable = updatedTable.map((r, i) => ({ ...r, _rowIndex: i + 1 }));

                useStore.getState().setDataTable(reindexedTable);

                dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Applied/Fix", message: `Inserted Support at Row ${supportRow._rowIndex}.` } });

                // Keep mode active to insert more, or return to VIEW?
                // The requirements say one-shot for break, let's keep it for insert or make it one-shot.
                // Assuming continuous insertion is helpful.
            }
        }
    };

    return (
        <group>
             <group onPointerMove={handlePointerMove} onPointerOut={handlePointerOut}>
                {dataTable.filter(r => (r.type||'').toUpperCase() === 'PIPE').map((pipe, i) => {
                    if (!pipe.ep1 || !pipe.ep2) return null;
                    const v1 = new THREE.Vector3(pipe.ep1.x, pipe.ep1.y, pipe.ep1.z);
                    const v2 = new THREE.Vector3(pipe.ep2.x, pipe.ep2.y, pipe.ep2.z);
                    const mid = v1.clone().lerp(v2, 0.5);
                    const dist = v1.distanceTo(v2);
                    if (dist === 0) return null;
                    const dir = v2.clone().sub(v1).normalize();
                    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0), dir);
                    const r = pipe.bore ? pipe.bore / 2 : 5;
                    return (
                        <mesh key={`is-${i}`} position={mid} quaternion={quat} onPointerDown={(e) => handlePointerDown(e, pipe)}>
                            <cylinderGeometry args={[r*2, r*2, dist, 8]} />
                            <meshBasicMaterial color="green" transparent opacity={0} depthWrite={false} />
                        </mesh>
                    );
                })}
             </group>

             {hoverPos && (
                 <mesh position={hoverPos}>
                     <sphereGeometry args={[20, 16, 16]} />
                     <meshBasicMaterial color="#eab308" transparent opacity={0.6} depthTest={false} />
                 </mesh>
             )}
        </group>
    );
};

// ----------------------------------------------------
// Context Menu
// ----------------------------------------------------
const ContextMenu = () => {
    const contextMenu = useStore(state => state.contextMenu);
    const closeContextMenu = useStore(state => state.closeContextMenu);
    const setSelected = useStore(state => state.setSelected);
    const hideSelected = useStore(state => state.hideSelected);
    const isolateSelected = useStore(state => state.isolateSelected);
    const setMultiSelect = useStore(state => state.setMultiSelect);
    const { dispatch } = useAppContext();

    useEffect(() => {
        const handleClickOutside = () => {
            if (contextMenu) closeContextMenu();
        };
        window.addEventListener('click', handleClickOutside);
        return () => window.removeEventListener('click', handleClickOutside);
    }, [contextMenu, closeContextMenu]);

    if (!contextMenu) return null;

    const handleAction = (action) => {
        // Ensure the clicked element is selected for these actions
        setSelected(contextMenu.rowIndex);
        setMultiSelect([contextMenu.rowIndex]);

        if (action === 'HIDE') {
            hideSelected();
        } else if (action === 'ISOLATE') {
            isolateSelected();
        } else if (action === 'DELETE') {
            dispatch({ type: 'DELETE_ELEMENTS', payload: { rowIndices: [contextMenu.rowIndex] } });
        }
        closeContextMenu();
    };

    return (
        <div
            className="absolute z-[100] bg-slate-900 border border-slate-700 shadow-xl rounded py-1 w-40"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div className="px-3 py-1 text-xs font-bold text-slate-500 border-b border-slate-800 mb-1">Row {contextMenu.rowIndex}</div>
            <button onClick={() => handleAction('ISOLATE')} className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Isolate</button>
            <button onClick={() => handleAction('HIDE')} className="w-full text-left px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Hide</button>
            <button onClick={() => handleAction('DELETE')} className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors mt-1 border-t border-slate-800">Delete</button>
        </div>
    );
};

// ----------------------------------------------------
// Hover Tooltip
// ----------------------------------------------------
const HoverTooltip = () => {
    const hoveredElementId = useStore(state => state.hoveredElementId);
    const dataTable = useStore(state => state.dataTable);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const timerRef = useRef(null);

    // Global listener for pointer move to track cursor
    useEffect(() => {
        const handleMouseMove = (e) => {
            setTooltipPos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    if (!hoveredElementId) return null;

    const el = dataTable.find(r => r._rowIndex === hoveredElementId);
    if (!el) return null;

    let len = 0;
    if (el.ep1 && el.ep2) {
        len = Math.sqrt(Math.pow(el.ep1.x - el.ep2.x, 2) + Math.pow(el.ep1.y - el.ep2.y, 2) + Math.pow(el.ep1.z - el.ep2.z, 2));
    }

    return (
        <div
            className="fixed z-50 pointer-events-none bg-slate-900/90 border border-slate-700 shadow-xl rounded p-2 text-xs"
            style={{ left: tooltipPos.x + 15, top: tooltipPos.y + 15 }}
        >
            <div className="flex items-center gap-2 mb-1">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase" style={{ backgroundColor: typeColor(el.type), color: 'white' }}>{el.type}</span>
                <span className="text-slate-300 font-bold">Row {el._rowIndex}</span>
            </div>
            <div className="text-slate-400 grid grid-cols-2 gap-x-3 gap-y-1">
                <span>Bore:</span><span className="text-slate-200">{el.bore}</span>
                <span>Len:</span><span className="text-slate-200">{len.toFixed(1)}mm</span>
                {el.ep1 && <><span>EP1 X:</span><span className="text-slate-200">{el.ep1.x.toFixed(1)}</span></>}
                {el.ep1 && <><span>EP1 Y:</span><span className="text-slate-200">{el.ep1.y.toFixed(1)}</span></>}
                {el.ep1 && <><span>EP1 Z:</span><span className="text-slate-200">{el.ep1.z.toFixed(1)}</span></>}
            </div>
        </div>
    );
};


// Main Tab Component
// ----------------------------------------------------

const ControlsAutoCenter = ({ externalRef }) => {
    const controlsRef = useRef();
    const getPipes = useStore(state => state.getPipes);
    const [targetPos, setTargetPos] = useState(null);
    const [camPos, setCamPos] = useState(null);
    const isAnimating = useRef(false);

    // Smooth camera interpolation
    useFrame((state, delta) => {
        if (!controlsRef.current || !isAnimating.current || !targetPos || !camPos) return;

        // Lerp OrbitControls target
        controlsRef.current.target.lerp(targetPos, 5 * delta);
        // Lerp Camera position
        state.camera.position.lerp(camPos, 5 * delta);

        // Stop animating when close
        if (controlsRef.current.target.distanceTo(targetPos) < 1 && state.camera.position.distanceTo(camPos) < 1) {
            isAnimating.current = false;
        }

        controlsRef.current.update();
    });

    // Add custom event listener for auto-center
    useEffect(() => {
        const handleFocus = (e) => {
            if (!controlsRef.current) return;
            const { x, y, z, dist } = e.detail;
            const tPos = new THREE.Vector3(x, y, z);
            // Move camera closer to object based on its length/dist
            // Make sure the zoom distance isn't excessively far or close
            const zoomDist = Math.max(dist * 1.5, 300);

            // Current camera direction to object
            const dir = new THREE.Vector3().subVectors(controlsRef.current.object.position, tPos).normalize();
            if (dir.lengthSq() < 0.1) dir.set(1, 1, 1).normalize(); // Default offset if dead center

            const cPos = new THREE.Vector3().copy(tPos).addScaledVector(dir, zoomDist);

            setTargetPos(tPos);
            setCamPos(cPos);
            isAnimating.current = true;
        };

        const handleCenter = (e) => {
            const pipes = getPipes();
            const immutables = useStore.getState().getImmutables();
            const allEls = [...pipes, ...immutables].filter(el => (el.type || '').toUpperCase() !== 'SUPPORT');

            if (allEls.length === 0 || !controlsRef.current) return;

            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

            // Optional explicit list of elements to frame
            const elsToFrame = e?.detail?.elements || allEls;

            elsToFrame.forEach(p => {
                if (p.ep1) {
                    minX = Math.min(minX, p.ep1.x); minY = Math.min(minY, p.ep1.y); minZ = Math.min(minZ, p.ep1.z);
                    maxX = Math.max(maxX, p.ep1.x); maxY = Math.max(maxY, p.ep1.y); maxZ = Math.max(maxZ, p.ep1.z);
                }
                if (p.ep2) {
                    minX = Math.min(minX, p.ep2.x); minY = Math.min(minY, p.ep2.y); minZ = Math.min(minZ, p.ep2.z);
                    maxX = Math.max(maxX, p.ep2.x); maxY = Math.max(maxY, p.ep2.y); maxZ = Math.max(maxZ, p.ep2.z);
                }
            });

            if (minX !== Infinity) {
                const centerX = (minX + maxX) / 2;
                const centerY = (minY + maxY) / 2;
                const centerZ = (minZ + maxZ) / 2;

                const tPos = new THREE.Vector3(centerX, centerY, centerZ);
                const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
                const cPos = new THREE.Vector3(centerX + maxDim, centerY + maxDim, centerZ + maxDim);

                setTargetPos(tPos);
                setCamPos(cPos);
                isAnimating.current = true;
            }
        };

        const handleSetView = (e) => {
            if (!controlsRef.current) return;
            const viewType = e.detail.viewType;

            if (viewType === 'HOME' || viewType === 'FIT') {
                handleCenter(e);
                return;
            }

            const tPos = controlsRef.current.target.clone();
            const currentDist = controlsRef.current.target.distanceTo(controlsRef.current.object.position);
            const dist = Math.max(currentDist, 1000);

            let cPos = new THREE.Vector3();

            switch(viewType) {
                case 'TOP':
                    cPos.set(tPos.x, tPos.y + dist, tPos.z);
                    break;
                case 'FRONT':
                    cPos.set(tPos.x, tPos.y, tPos.z + dist);
                    break;
                case 'RIGHT':
                    cPos.set(tPos.x + dist, tPos.y, tPos.z);
                    break;
                case 'ISO':
                    cPos.set(tPos.x + dist, tPos.y + dist, tPos.z + dist);
                    break;
                default:
                    return;
            }

            setTargetPos(tPos);
            setCamPos(cPos);
            isAnimating.current = true;
        };


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

        window.addEventListener('canvas-auto-center', handleCenter);
        window.addEventListener('canvas-focus-point', handleFocus);
        window.addEventListener('canvas-set-view', handleSetView);
        window.addEventListener('canvas-reset-view', handleCenter);
        return () => {

            window.removeEventListener('canvas-save-camera', handleSaveCamera);
            window.removeEventListener('canvas-load-camera', handleLoadCamera);

            window.removeEventListener('canvas-auto-center', handleCenter);
            window.removeEventListener('canvas-focus-point', handleFocus);
            window.removeEventListener('canvas-set-view', handleSetView);
            window.removeEventListener('canvas-reset-view', handleCenter);
        };
    }, [getPipes]);

    // Session Camera Persistence
    useEffect(() => {
        if (!controlsRef.current) return;

        try {
            const saved = sessionStorage.getItem('pcf-canvas-session');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.camPos) controlsRef.current.object.position.copy(data.camPos);
                if (data.camTarget) controlsRef.current.target.copy(data.camTarget);
                controlsRef.current.update();

                if (data.showRowLabels !== undefined) useStore.getState().setShowRowLabels(data.showRowLabels);
                if (data.showRefLabels !== undefined) useStore.getState().setShowRefLabels(data.showRefLabels);
                if (data.showGapRadar !== undefined) useStore.getState().setShowGapRadar(data.showGapRadar);
            }
        } catch (e) {
            console.error("Failed to restore camera session", e);
        }

        return () => {
            if (controlsRef.current) {
                const data = {
                    camPos: controlsRef.current.object.position,
                    camTarget: controlsRef.current.target,
                    showRowLabels: useStore.getState().showRowLabels,
                    showRefLabels: useStore.getState().showRefLabels,
                    showGapRadar: useStore.getState().showGapRadar
                };
                sessionStorage.setItem('pcf-canvas-session', JSON.stringify(data));
            }
        };
    }, []);

    const canvasMode = useStore(state => state.canvasMode);
    const interactionMode = useStore(state => state.interactionMode);
    const appSettings = useStore(state => state.appSettings);
    // Allow panning/zooming during CONNECT, STRETCH, MEASURE, BREAK now that they are click-based.
    const controlsEnabled = !['MARQUEE_SELECT', 'MARQUEE_ZOOM', 'MARQUEE_DELETE'].includes(canvasMode);

    const handlePointerDown = (e) => {
        if (appSettings.centerOrbitOnSelect && e.point && controlsRef.current) {
            controlsRef.current.target.copy(e.point);
        }
    };

    // Attach listener to window so we can grab raycast points globally from canvas
    useEffect(() => {
        const handler = (e) => {
             // In R3F, click events natively return the intersected point.
             // To globally center orbit on ANY click on the 3D scene, we could use the mesh onClick events.
             // We will implement this centrally via the 'canvas-focus-point' custom event or natively in mesh pointer down.
        };
    }, []);

    const mouseButtons = {
        LEFT: interactionMode === 'PAN' ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: interactionMode === 'PAN' ? THREE.MOUSE.ROTATE : THREE.MOUSE.PAN
    };

    return <OrbitControls
                ref={(c) => { controlsRef.current = c; if (externalRef) externalRef.current = c; }}
                enabled={controlsEnabled}
                makeDefault
                enableDamping
                dampingFactor={0.1}
                mouseButtons={mouseButtons}
            />;
};


export function CanvasTab() {
  const { state: appState, dispatch } = useAppContext();
  const orthoMode = useStore(state => state.orthoMode);


  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const proposals = useStore(state => state.proposals);
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const dragOrbitRef = useRef(null); // shared ref for orbit controls disable during drag

  // Store Connections
  const canvasMode = useStore(state => state.canvasMode);
  const setCanvasMode = useStore(state => state.setCanvasMode);
  const showGapRadar = useStore(state => state.showGapRadar);
  const setShowGapRadar = useStore(state => state.setShowGapRadar);
  const showRowLabels = useStore(state => state.showRowLabels);
  const setShowRowLabels = useStore(state => state.setShowRowLabels);
  const showRefLabels = useStore(state => state.showRefLabels);
  const setShowRefLabels = useStore(state => state.setShowRefLabels);
  const colorMode = useStore(state => state.colorMode);
  const setColorMode = useStore(state => state.setColorMode);
  const dragAxisLock = useStore(state => state.dragAxisLock);
  const setDragAxisLock = useStore(state => state.setDragAxisLock);
  const undo = useStore(state => state.undo);
  const clippingPlaneEnabled = useStore(state => state.clippingPlaneEnabled);
  const showSettings = useStore(state => state.showSettings);
  const setShowSettings = useStore(state => state.setShowSettings);
  const appSettings = useStore(state => state.appSettings);
  const setClippingPlaneEnabled = useStore(state => state.setClippingPlaneEnabled);
  const clearMultiSelect = useStore(state => state.clearMultiSelect);
  const multiSelectedIds = useStore(state => state.multiSelectedIds);
  const deleteElements = useStore(state => state.deleteElements);
  const dataTable = useStore(state => state.dataTable);
  const pushHistory = useStore(state => state.pushHistory);

  const [toolbarPos, setToolbarPos] = useState({ x: 16, y: 16 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleToolbarPointerDown = (e) => {
    setIsDraggingToolbar(true);
    setDragOffset({
        x: e.clientX - toolbarPos.x,
        y: e.clientY - toolbarPos.y
    });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleToolbarPointerMove = (e) => {
    if (!isDraggingToolbar) return;
    setToolbarPos({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
    });
  };

  const handleToolbarPointerUp = (e) => {
    setIsDraggingToolbar(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const snapResolution = appState.config?.smartFixer?.gridSnapResolution ?? 100;

  // Hover tracking for tooltips
  const setHovered = useStore(state => state.setHovered);
  const hoverTimer = useRef(null);

  const handlePointerEnterMesh = useCallback((rowIndex) => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => setHovered(rowIndex), 150);
  }, [setHovered]);

  const handlePointerLeaveMesh = useCallback(() => {
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      setHovered(null);
  }, [setHovered]);

  // Global Key Handler
  useEffect(() => {
      const handleKeyDown = (e) => {
          // Ignore if typing in an input
          if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;

          switch (e.key.toLowerCase()) {
              case 'escape':
                  setCanvasMode('VIEW');
                  clearMultiSelect();
                  useStore.getState().setSelected(null);
                  break;
              case 'c': setCanvasMode(canvasMode === 'CONNECT' ? 'VIEW' : 'CONNECT'); break;
              case 't': setCanvasMode(canvasMode === 'STRETCH' ? 'VIEW' : 'STRETCH'); break;
              case 'b': setCanvasMode(canvasMode === 'BREAK' ? 'VIEW' : 'BREAK'); break;
              case 'm': setCanvasMode(canvasMode === 'MEASURE' ? 'VIEW' : 'MEASURE'); break;
              case 'i': setCanvasMode(canvasMode === 'INSERT_SUPPORT' ? 'VIEW' : 'INSERT_SUPPORT'); break;
              case 'x': setDragAxisLock('X'); break;
              case 'y': setDragAxisLock('Y'); break;
              case 'z': setDragAxisLock('Z'); break;
              case 'o': useStore.getState().toggleOrthoMode(); break;
              case 'f':
                  if (useStore.getState().selectedElementId) {
                      const el = dataTable.find(r => r._rowIndex === useStore.getState().selectedElementId);
                      if (el && el.ep1) {
                          window.dispatchEvent(new CustomEvent('canvas-focus-point', { detail: { x: el.ep1.x, y: el.ep1.y, z: el.ep1.z, dist: 2000 } }));
                      }
                  }
                  break;
              case 'delete':
              case 'backspace':
                  if (multiSelectedIds.length > 0) {
                      if (window.confirm(`Delete ${multiSelectedIds.length} elements?`)) {
                          pushHistory('Delete Keyboard');
                          dispatch({ type: 'DELETE_ELEMENTS', payload: { rowIndices: multiSelectedIds } });
                          deleteElements(multiSelectedIds);
                          dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Applied/Fix", message: `Deleted ${multiSelectedIds.length} elements via keyboard.` } });
                      }
                  } else if (useStore.getState().selectedElementId) {
                      const selId = useStore.getState().selectedElementId;
                      if (window.confirm(`Delete Row ${selId}?`)) {
                          pushHistory('Delete Keyboard');
                          dispatch({ type: 'DELETE_ELEMENTS', payload: { rowIndices: [selId] } });
                          deleteElements([selId]);
                          useStore.getState().setSelected(null);
                          dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Applied/Fix", message: `Deleted Row ${selId} via keyboard.` } });
                      }
                  }
                  break;
              case 'h':
                  if (e.shiftKey) {
                      useStore.getState().hideSelected();
                  } else if (e.altKey) {
                      useStore.getState().unhideAll();
                  } else {
                      useStore.getState().isolateSelected();
                  }
                  break;
              case 'u':
                  useStore.getState().unhideAll();
                  break;
              default:
                  // Ctrl+Z
                  if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      undo();
                  }
                  break;
          }
      };

      const handleKeyUp = (e) => {
          if (['x', 'y', 'z'].includes(e.key.toLowerCase())) {
              setDragAxisLock(null);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);

      const handleZustandUndo = () => {
          // Sync Zustand's newly restored state back to AppContext
          const restoredTable = useStore.getState().dataTable;
          dispatch({ type: "APPLY_GAP_FIX", payload: { updatedTable: restoredTable } });
          dispatch({ type: "ADD_LOG", payload: { stage: "INTERACTIVE", type: "Info", message: "Undo completed." } });
      };

      window.addEventListener('zustand-undo', handleZustandUndo);

      return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          window.removeEventListener('zustand-undo', handleZustandUndo);
      };
  }, [canvasMode, setCanvasMode, clearMultiSelect, setDragAxisLock, undo, multiSelectedIds, dispatch, pushHistory, deleteElements, dataTable]);


  const handleDragCommit = useCallback((rowIndex, coords) => {
    // Filter out null coord fields
    const cleanCoords = Object.fromEntries(
      Object.entries(coords).filter(([, v]) => v !== null)
    );
    dispatch({ type: "UPDATE_STAGE2_ROW_COORDS", payload: { rowIndex, coords: cleanCoords } });
    // Mirror to Zustand so 3D view updates immediately
    const updated = useStore.getState().dataTable.map(r =>
      r._rowIndex === rowIndex ? { ...r, ...cleanCoords } : r
    );
    useStore.getState().setDataTable(updated);
    dispatch({ type: "ADD_LOG", payload: { stage: "DRAG_EDIT", type: "Info", message: `Drag-edited row ${rowIndex} (snap=${snapResolution}mm).` } });
  }, [dispatch, snapResolution]);

  const validationIssues = (appState.stage2Data || []).filter(r =>
      typeof r.fixingAction === 'string' && (r.fixingAction.includes('ERROR') || r.fixingAction.includes('WARNING'))
  );

  const handleAutoCenter = () => {
      window.dispatchEvent(new CustomEvent('canvas-auto-center'));
  };

  const handleApprove = (e, prop) => {
      e.stopPropagation();

      const updatedTable = [...appState.stage2Data];
      const row = updatedTable.find(r => r._rowIndex === prop.elementA._rowIndex);
      if (row) {
          row._fixApproved = true;
          dispatch({ type: "SET_STAGE_2_DATA", payload: updatedTable });
          dispatch({ type: "ADD_LOG", payload: { stage: "FIXING", type: "Info", message: "Approved fix proposal for row " + row._rowIndex }});
          useStore.getState().setProposalStatus(row._rowIndex, true);
      }
  };

  const handleReject = (e, prop) => {
      e.stopPropagation();

      const updatedTable = [...appState.stage2Data];
      const row = updatedTable.find(r => r._rowIndex === prop.elementA._rowIndex);
      if (row) {
          row._fixApproved = false;
          dispatch({ type: "SET_STAGE_2_DATA", payload: updatedTable });
          dispatch({ type: "ADD_LOG", payload: { stage: "FIXING", type: "Info", message: "Rejected fix proposal for row " + row._rowIndex }});
          useStore.getState().setProposalStatus(row._rowIndex, false);
      }
  };

  const triggerZoomToCurrent = () => {
      // Logic is handled in the effect inside SingleIssuePanel,
      // but we can force re-trigger by re-setting index or just letting the user click the button.
      // Easiest is to dispatch a dummy event that the effect listens to, or just update state.
      // A trick: set index to itself. React might not re-render, so we can dispatch the event directly here if needed,
      // but SingleIssuePanel already handles auto-center via the onAutoCenter prop. Wait, SingleIssuePanel doesn't have the logic inside onAutoCenter.
      // Let's pass a function that gets the current item and triggers the focus event.

      const allIssues = [
          ...validationIssues.map(i => ({ type: 'validation', data: i })),
          ...proposals.map(p => ({ type: 'proposal', data: p }))
      ];
      if (allIssues.length === 0) return;
      const safeIndex = Math.max(0, Math.min(currentIssueIndex, allIssues.length - 1));
      const currentItem = allIssues[safeIndex];

      let focusPt = null;
      let focusDist = 2000;
      if (currentItem.type === 'validation' && currentItem.data.ep1) {
          focusPt = currentItem.data.ep1;
      } else if (currentItem.type === 'proposal') {
          const prop = currentItem.data;
          if (prop.ptA && prop.ptB) {
               focusPt = { x: (prop.ptA.x + prop.ptB.x)/2, y: (prop.ptA.y + prop.ptB.y)/2, z: (prop.ptA.z + prop.ptB.z)/2 };
               focusDist = Math.max(prop.dist * 3, 2000);
          } else if (prop.elementA && prop.elementA.ep1) {
               focusPt = prop.elementA.ep1;
          }
      }
      if (focusPt) {
          window.dispatchEvent(new CustomEvent('canvas-focus-point', { detail: { ...focusPt, dist: focusDist } }));
      }
  };

  const executeFix6mm = () => {
      pushHistory('Fix 6mm Gaps');
      const { updatedTable, fixLog } = fix6mmGaps(dataTable);
      useStore.getState().setDataTable(updatedTable);
      dispatch({ type: 'APPLY_GAP_FIX', payload: { updatedTable } });
      fixLog.forEach(log => dispatch({ type: "ADD_LOG", payload: log }));
  };

  const executeAutoPipelineRef = () => {
      pushHistory('Auto Pipeline Ref');
      const { updatedTable, fixLog } = autoAssignPipelineRefs(dataTable);
      useStore.getState().setDataTable(updatedTable);
      dispatch({ type: 'APPLY_GAP_FIX', payload: { updatedTable } }); // Reuses table replace action
      fixLog.forEach(log => dispatch({ type: "ADD_LOG", payload: log }));
  };

  const executeFix25mm = () => {
      pushHistory('Fix 25mm Gaps');
      const { updatedTable, fixLog } = fix25mmGapsWithPipe(dataTable);
      useStore.getState().setDataTable(updatedTable);
      dispatch({ type: 'APPLY_GAP_FIX', payload: { updatedTable } });
      fixLog.forEach(log => dispatch({ type: "ADD_LOG", payload: log }));
  };


  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-950 rounded-lg border border-slate-800 shadow-inner relative mt-[-2rem]">

      {/* New UI Overlays */}
      <SceneHealthHUD />

      {/* Left Sidebar Stack */}
      <div className="absolute top-24 left-4 z-20 flex flex-col gap-4 items-start pointer-events-none h-[calc(100vh-10rem)] overflow-y-auto w-80 pr-2">
          <div className="pointer-events-auto flex flex-col gap-4 w-full">
              <LegendLayer />
              <SideInspector />
              <SupportPropertyPanel />
          </div>
      </div>

      {/* Right Sidebar Stack */}
      <div className="absolute top-24 right-4 z-20 flex flex-col gap-4 items-end pointer-events-none h-[calc(100vh-10rem)] overflow-y-auto w-80 pl-2">
          <div className="pointer-events-auto flex flex-col gap-4 w-full items-end">
              <GapSidebar />
              <ClippingPanelUI />
          </div>
      </div>

      <PipelinePropertyPanel />
      <LogDrawer />
      <HoverTooltip />
      <SettingsModal />
      <ContextMenu />
      <NavigationPanel />

      <div
        className="absolute z-40 pointer-events-auto shadow-lg"
        style={{ left: toolbarPos.x, top: toolbarPos.y }}
        onPointerMove={handleToolbarPointerMove}
        onPointerUp={handleToolbarPointerUp}
      >
        <ToolbarRibbon
            onFix6mm={executeFix6mm}
            onFix25mm={executeFix25mm}
            onAutoRef={executeAutoPipelineRef}
            onAutoCenter={handleAutoCenter}
            onToggleSideInspector={() => setRightPanelOpen(!rightPanelOpen)}
            showSideInspector={rightPanelOpen}
            onPointerDown={handleToolbarPointerDown}
        />
      </div>

      {/* Mode Overlay */}
      <div
        className="absolute z-50 flex flex-col gap-2 items-center pointer-events-none bottom-8 left-1/2 -translate-x-1/2"
      >
        {canvasMode !== 'VIEW' && (
            <div className="flex flex-col gap-1 items-center pointer-events-auto">
                <div className="bg-slate-800/90 text-slate-200 text-xs px-3 py-1.5 rounded border border-slate-600 shadow-md flex items-center justify-center">
                    <span>MODE: <strong>{canvasMode.replace('_', ' ')}</strong></span>
                    <span className="ml-2 text-slate-400">Esc to cancel</span>
                </div>
                {(canvasMode === 'CONNECT' || canvasMode === 'STRETCH') && (
                    <div className="bg-slate-800/90 text-amber-400 text-[10px] px-3 py-1.5 rounded border border-amber-900/50 shadow-md max-w-md text-center">
                        <strong>Tip:</strong> Click first endpoint, then click second endpoint. Panning is allowed.
                    </div>
                )}
            </div>
        )}
      </div>


      <SingleIssuePanel
          proposals={proposals}
          validationIssues={validationIssues}
          currentIssueIndex={currentIssueIndex}
          setCurrentIssueIndex={setCurrentIssueIndex}
          onAutoCenter={triggerZoomToCurrent}
          onApprove={handleApprove}
          onReject={handleReject}
      />


      <Canvas>
        {orthoMode ? (
            <OrthographicCamera makeDefault position={[5000, 5000, 5000]} zoom={0.2} near={0.1} far={500000} />
        ) : (
            <PerspectiveCamera makeDefault position={[5000, 5000, 5000]} fov={appSettings.cameraFov} near={appSettings.cameraNear || 1} far={appSettings.cameraFar || 500000} />
        )}
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[1000, 1000, 500]} intensity={1.5} />
        <directionalLight position={[-1000, -1000, -500]} intensity={0.5} />
        {appSettings.showGrid && <gridHelper args={[10000, 100]} position={[0, 0, 0]} />}
        {appSettings.showAxes && <axesHelper args={[2000]} />}

        <InstancedPipes />
        <ImmutableComponents />

        <EndpointSnapLayer />
        <GapRadarLayer />
        <GlobalSnapLayer />
        <MeasureTool />
        <BreakPipeLayer />
        <InsertSupportLayer />
        <EPLabelsLayer />
        <MarqueeLayer />
        <ClippingPlanesLayer />

        {(() => {
            const allIssues = [
                ...validationIssues.map(i => ({ type: 'validation', data: i })),
                ...proposals.map(p => ({ type: 'proposal', data: p }))
            ];
            const safeIndex = Math.max(0, Math.min(currentIssueIndex, allIssues.length - 1));
            const activeItem = allIssues[safeIndex];
            const activeProposal = activeItem?.type === 'proposal' ? activeItem.data : null;
            return <GhostOverlay activeProposal={activeProposal} />;
        })()}

        {proposals.map((prop, idx) => {
            // Calculate global index to check if active
            const allIssues = [
                ...validationIssues.map(i => ({ type: 'validation', data: i })),
                ...proposals.map(p => ({ type: 'proposal', data: p }))
            ];
            const safeIndex = Math.max(0, Math.min(currentIssueIndex, allIssues.length - 1));
            const isActive = allIssues[safeIndex]?.type === 'proposal' && allIssues[safeIndex]?.data === prop;

            return isActive ? <ProposalOverlay key={`prop-${idx}`} proposal={prop} /> : null;
        })}

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ef4444', '#10b981', '#3b82f6']} labelColor="white" />
        </GizmoHelper>



        {(() => {
            const allIssues = [
                ...validationIssues.map(i => ({ type: 'validation', data: i })),
                ...proposals.map(p => ({ type: 'proposal', data: p }))
            ];
            const safeIndex = Math.max(0, Math.min(currentIssueIndex, allIssues.length - 1));
            return <IssueMapPin activeIssue={allIssues[safeIndex]} />;
        })()}


        <ControlsAutoCenter externalRef={dragOrbitRef} />

        {/* World Reference */}
        <gridHelper args={[20000, 20, '#1e293b', '#0f172a']} position={[0, -1000, 0]} />
      </Canvas>

    </div>
  );
}