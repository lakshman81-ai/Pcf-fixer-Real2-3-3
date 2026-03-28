import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useDrawStore } from './store';
import { useStore } from '../../store/useStore';
import { Pointer, Minus, CornerDownRight, SplitSquareHorizontal, Target, CircleDot, Square, Move, Maximize2, RotateCw, Scissors, Link, Trash2, Maximize, Ruler, List, Check, GripHorizontal } from 'lucide-react';

const GridFloor = () => {
    return (
        <group>
            {/* Major grid */}
            <gridHelper args={[100000, 100, '#3a4255', '#252a3a']} position={[0, -0.1, 0]} />
            {/* Axes */}
            <axesHelper args={[2000]} position={[0, 0, 0]} />
        </group>
    );
};

const DrawnGeometry = () => {
    const elements = useDrawStore(state => state.drawnElements);

    return (
        <group>
            {elements.map((el, idx) => {
                if (el.type === 'PIPE' && el.ep1 && el.ep2) {
                    const vecA = new THREE.Vector3(el.ep1.x, el.ep1.y, el.ep1.z);
                    const vecB = new THREE.Vector3(el.ep2.x, el.ep2.y, el.ep2.z);
                    const dist = vecA.distanceTo(vecB);
                    if (dist < 0.1) return null;

                    const mid = vecA.clone().lerp(vecB, 0.5);
                    const dir = vecB.clone().sub(vecA).normalize();
                    const up = new THREE.Vector3(0, 1, 0);
                    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
                    const r = el.bore ? el.bore / 2 : 50;

                    return (
                        <mesh key={el._id || idx} position={mid} quaternion={quat}>
                            <cylinderGeometry args={[r, r, dist, 16]} />
                            <meshStandardMaterial color="#cbd5e1" />
                        </mesh>
                    );
                }
                return null;
            })}
        </group>
    );
};

const DrawToolLayer = () => {
    const activeTool = useDrawStore(state => state.activeTool);
    const addDrawnElement = useDrawStore(state => state.addDrawnElement);
    const gridSnap = useDrawStore(state => state.gridSnap);
    const res = useDrawStore(state => state.snapResolution);

    const [startPt, setStartPt] = useState(null);
    const [cursorPt, setCursorPt] = useState(new THREE.Vector3());

    const [showInput, setShowInput] = useState(false);
    const [inputPos, setInputPos] = useState({ x: 0, y: 0 });
    const [inputValue, setInputValue] = useState('');

    if (activeTool !== 'DRAW_PIPE') return null;

    const getSnappedPt = (pt) => {
        const p = pt.clone();
        if (gridSnap) {
            p.x = Math.round(p.x / res) * res;
            p.y = Math.round(p.y / res) * res;
            p.z = Math.round(p.z / res) * res;
        }
        return p;
    };

    const handlePointerMove = (e) => {
        e.stopPropagation();
        const pt = getSnappedPt(e.point);
        setCursorPt(pt);

        if (startPt) {
            setShowInput(true);
            const dist = startPt.distanceTo(pt);
            if (document.activeElement?.id !== 'draw-length-input') {
                setInputValue(dist.toFixed(1));
            }
        }
    };

    const handlePointerDown = (e) => {
        e.stopPropagation();
        const pt = getSnappedPt(e.point);

        if (!startPt) {
            setStartPt(pt);
        } else {
            addDrawnElement({
                type: 'PIPE',
                ep1: { x: startPt.x, y: startPt.y, z: startPt.z },
                ep2: { x: pt.x, y: pt.y, z: pt.z },
                bore: 100
            });
            setStartPt(pt.clone());
            setShowInput(false);
        }
    };

    const handlePointerUp = (e) => {
        e.stopPropagation();
    }

    return (
        <group>
            <mesh
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                scale={[200000, 200000, 1]}
                renderOrder={-1}
            >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial visible={false} depthTest={false} depthWrite={false} />
            </mesh>

            {startPt && (
                <line>
                    <bufferGeometry>
                        <float32BufferAttribute attach="attributes-position" count={2} array={new Float32Array([
                            startPt.x, startPt.y, startPt.z,
                            cursorPt.x, cursorPt.y, cursorPt.z
                        ])} />
                    </bufferGeometry>
                    <lineBasicMaterial color="#3b82f6" linewidth={3} />
                </line>
            )}

            <mesh position={cursorPt}>
                <sphereGeometry args={[20, 16, 16]} />
                <meshBasicMaterial color="#eab308" transparent opacity={0.6} depthTest={false} />
            </mesh>

            {showInput && (
                <Html position={cursorPt} zIndexRange={[100, 0]}>
                    <div className="bg-slate-900 border border-slate-700 shadow p-1 rounded flex items-center gap-2 pointer-events-auto -mt-10 ml-5">
                        <span className="text-xs text-slate-400">Len:</span>
                        <input
                            id="draw-length-input"
                            type="number"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    const dir = cursorPt.clone().sub(startPt).normalize();
                                    const dist = parseFloat(inputValue);
                                    if (dist > 0 && dir.length() > 0.1) {
                                        const finalPt = startPt.clone().add(dir.multiplyScalar(dist));
                                        addDrawnElement({
                                            type: 'PIPE',
                                            ep1: { x: startPt.x, y: startPt.y, z: startPt.z },
                                            ep2: { x: finalPt.x, y: finalPt.y, z: finalPt.z },
                                            bore: 100
                                        });
                                        setStartPt(finalPt);
                                        setInputValue('');
                                    }
                                } else if (e.key === 'Escape') {
                                    setStartPt(null);
                                    setShowInput(false);
                                }
                            }}
                            className="bg-slate-800 text-slate-200 text-xs w-20 px-1 border border-slate-600 rounded outline-none focus:border-blue-500 pointer-events-auto"
                            autoFocus
                        />
                        <span className="text-xs text-slate-400">mm</span>
                    </div>
                </Html>
            )}
        </group>
    );
};

const LeftToolbar = () => {
    const activeTool = useDrawStore(state => state.activeTool);
    const setActiveTool = useDrawStore(state => state.setActiveTool);

    const ToolBtn = ({ tool, icon: Icon, title }) => (
        <button
            onClick={() => setActiveTool(tool)}
            className={`w-10 h-10 flex items-center justify-center rounded transition-colors mb-1 ${activeTool === tool ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}
            title={title}
        >
            <Icon className="w-5 h-5" />
        </button>
    );

    return (
        <div className="absolute left-4 top-24 bottom-24 w-12 bg-slate-900/90 border border-slate-700 rounded shadow-xl z-20 flex flex-col items-center py-2 pointer-events-auto backdrop-blur">
            <ToolBtn tool="SELECT" icon={Pointer} title="Select" />
            <ToolBtn tool="MARQUEE" icon={Square} title="Box Select" />
            <div className="w-8 h-px bg-slate-700 my-2"></div>
            <ToolBtn tool="DRAW_PIPE" icon={Minus} title="Draw Pipe" />
            <ToolBtn tool="DRAW_BEND" icon={CornerDownRight} title="Draw Bend" />
            <ToolBtn tool="DRAW_TEE" icon={SplitSquareHorizontal} title="Draw Tee" />
            <div className="w-8 h-px bg-slate-700 my-2"></div>
            <ToolBtn tool="INSERT_FLANGE" icon={CircleDot} title="Insert Flange" />
            <ToolBtn tool="INSERT_VALVE" icon={Target} title="Insert Valve" />
            <ToolBtn tool="INSERT_SUPPORT" icon={Square} title="Insert Support" />
            <div className="w-8 h-px bg-slate-700 my-2"></div>
            <ToolBtn tool="MOVE" icon={Move} title="Move" />
            <ToolBtn tool="STRETCH" icon={Maximize2} title="Stretch" />
            <ToolBtn tool="ROTATE" icon={RotateCw} title="Rotate" />
            <ToolBtn tool="SPLIT" icon={Scissors} title="Split" />
            <ToolBtn tool="JOIN" icon={Link} title="Join" />
            <ToolBtn tool="DELETE" icon={Trash2} title="Delete" />
        </div>
    );
};

const PropertiesPanel = () => {
    const selectedIds = useDrawStore(state => state.selectedIds);
    const drawnElements = useDrawStore(state => state.drawnElements);
    const updateDrawnElement = useDrawStore(state => state.updateDrawnElement);

    if (selectedIds.length === 0) return null;

    const selectedEl = drawnElements.find(el => el._id === selectedIds[0]);
    if (!selectedEl) return null;

    const handleChange = (field, val) => {
        updateDrawnElement(selectedEl._id, { [field]: val });
    };

    return (
        <div className="absolute right-4 top-24 w-72 bg-slate-900/95 border border-slate-700 rounded shadow-xl z-20 flex flex-col pointer-events-auto backdrop-blur">
            <div className="bg-slate-800 border-b border-slate-700 px-3 py-2 flex items-center justify-between rounded-t">
                <span className="text-xs font-bold text-slate-300">Properties</span>
                <span className="text-[10px] bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded uppercase font-bold">{selectedEl.type}</span>
            </div>
            <div className="p-3 flex flex-col gap-2 overflow-y-auto max-h-[60vh] custom-scrollbar">

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Bore (mm)</label>
                    <input
                        type="number"
                        value={selectedEl.bore || ''}
                        onChange={(e) => handleChange('bore', parseFloat(e.target.value))}
                        className="bg-slate-800 border border-slate-600 text-slate-200 text-xs p-1.5 rounded outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Length (mm)</label>
                    <input
                        type="number"
                        value={selectedEl.length || ''}
                        onChange={(e) => handleChange('length', parseFloat(e.target.value))}
                        className="bg-slate-800 border border-slate-600 text-slate-200 text-xs p-1.5 rounded outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Schedule</label>
                    <input
                        type="text"
                        value={selectedEl.schedule || ''}
                        onChange={(e) => handleChange('schedule', e.target.value)}
                        className="bg-slate-800 border border-slate-600 text-slate-200 text-xs p-1.5 rounded outline-none focus:border-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Spec</label>
                    <input
                        type="text"
                        value={selectedEl.spec || ''}
                        onChange={(e) => handleChange('spec', e.target.value)}
                        className="bg-slate-800 border border-slate-600 text-slate-200 text-xs p-1.5 rounded outline-none focus:border-blue-500"
                    />
                </div>

                <div className="w-full h-px bg-slate-700 my-1"></div>
                <span className="text-[10px] font-bold text-slate-400">Custom Attributes</span>

                {['CA1', 'CA2', 'CA3'].map(ca => (
                    <div className="flex flex-col gap-1" key={ca}>
                        <label className="text-[10px] text-slate-500 font-bold uppercase">{ca}</label>
                        <input
                            type="text"
                            value={selectedEl[ca] || ''}
                            onChange={(e) => handleChange(ca, e.target.value)}
                            className="bg-slate-800 border border-slate-600 text-slate-200 text-xs p-1.5 rounded outline-none focus:border-blue-500"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const ComponentListPanel = () => {
    const drawnElements = useDrawStore(state => state.drawnElements);
    const selectedIds = useDrawStore(state => state.selectedIds);
    const setSelectedIds = useDrawStore(state => state.setSelectedIds);
    const [collapsed, setCollapsed] = useState(false);

    if (collapsed) {
        return (
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 bg-slate-900 border-t border-l border-r border-slate-700 rounded-t-lg shadow-xl z-20 pointer-events-auto">
                <button onClick={() => setCollapsed(false)} className="w-full py-1 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-2">
                    <List className="w-3 h-3" /> Show Component List ({drawnElements.length})
                </button>
            </div>
        );
    }

    return (
        <div className="absolute bottom-0 left-4 right-4 h-48 bg-slate-900/95 border-t border-l border-r border-slate-700 rounded-t-xl shadow-2xl z-20 flex flex-col pointer-events-auto backdrop-blur">
            <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between rounded-t-xl">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2"><List className="w-4 h-4 text-blue-500" /> Drawn Components</span>
                <button onClick={() => setCollapsed(true)} className="text-slate-400 hover:text-white"><Minus className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                    <thead className="bg-slate-800/50 text-slate-400 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 font-medium">#</th>
                            <th className="px-4 py-2 font-medium">Type</th>
                            <th className="px-4 py-2 font-medium">Bore</th>
                            <th className="px-4 py-2 font-medium">Length</th>
                            <th className="px-4 py-2 font-medium">EP1</th>
                            <th className="px-4 py-2 font-medium">EP2</th>
                            <th className="px-4 py-2 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {drawnElements.map((el, i) => {
                            const isSelected = selectedIds.includes(el._id);

                            let len = el.length || 0;
                            if (!len && el.ep1 && el.ep2) {
                                len = new THREE.Vector3(el.ep1.x, el.ep1.y, el.ep1.z).distanceTo(new THREE.Vector3(el.ep2.x, el.ep2.y, el.ep2.z));
                            }

                            return (
                                <tr
                                    key={el._id}
                                    onClick={() => setSelectedIds([el._id])}
                                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-900/30' : 'hover:bg-slate-800/50 text-slate-300'}`}
                                >
                                    <td className="px-4 py-1.5 border-l-2 border-transparent" style={{ borderLeftColor: isSelected ? '#3b82f6' : 'transparent' }}>{i + 1}</td>
                                    <td className="px-4 py-1.5 font-bold" style={{ color: el.type === 'PIPE' ? '#cbd5e1' : '#60a5fa' }}>{el.type}</td>
                                    <td className="px-4 py-1.5">{el.bore || '-'}</td>
                                    <td className="px-4 py-1.5">{len.toFixed(1)}</td>
                                    <td className="px-4 py-1.5 font-mono text-[10px] text-slate-500">{el.ep1 ? `[${el.ep1.x.toFixed(0)}, ${el.ep1.y.toFixed(0)}, ${el.ep1.z.toFixed(0)}]` : '-'}</td>
                                    <td className="px-4 py-1.5 font-mono text-[10px] text-slate-500">{el.ep2 ? `[${el.ep2.x.toFixed(0)}, ${el.ep2.y.toFixed(0)}, ${el.ep2.z.toFixed(0)}]` : '-'}</td>
                                    <td className="px-4 py-1.5"><span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> OK</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {drawnElements.length === 0 && (
                    <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                        No components drawn yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export function DrawCanvas() {
    const activeTool = useDrawStore(state => state.activeTool);
    const orthoMode = useDrawStore(state => state.orthoMode);

    // Disable OrbitControls by default in Draw Canvas unless the active tool is ORBIT.
    const orbitEnabled = activeTool === 'ORBIT';

    return (
        <div className="absolute inset-0 bg-slate-950 z-50 flex flex-col pointer-events-auto">
            <div className="flex items-center gap-2 p-2 bg-slate-900 border-b border-slate-700 shadow z-10 pointer-events-auto">
                <span className="text-white font-bold ml-2">Draw Canvas</span>
                <div className="w-px h-6 bg-slate-700 mx-2"></div>
                <button
                    onClick={() => useDrawStore.getState().setActiveTool('ORBIT')}
                    className={`px-3 py-1 rounded text-sm ${activeTool === 'ORBIT' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >Orbit Camera</button>
                <div className="w-px h-6 bg-slate-700 mx-2"></div>
                <button
                    onClick={() => useStore.getState().setCanvasMode('VIEW')}
                    className="ml-auto px-4 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition"
                >Close Draw Canvas</button>
            </div>

            <div className="flex-1 relative pointer-events-auto">
                <LeftToolbar />
                <PropertiesPanel />
                <ComponentListPanel />

                <Canvas>
                    {orthoMode ? (
                        <OrthographicCamera makeDefault position={[5000, 5000, 5000]} zoom={0.2} near={0.1} far={500000} />
                    ) : (
                        <PerspectiveCamera makeDefault position={[5000, 5000, 5000]} fov={50} near={1} far={500000} />
                    )}

                    <ambientLight intensity={0.6} />
                    <directionalLight position={[1000, 1000, 500]} intensity={1.5} />

                    <GridFloor />
                    <DrawnGeometry />
                    <DrawToolLayer />

                    <OrbitControls
                        enabled={orbitEnabled}
                        makeDefault
                        mouseButtons={{
                            LEFT: THREE.MOUSE.ROTATE,
                            MIDDLE: THREE.MOUSE.DOLLY,
                            RIGHT: THREE.MOUSE.PAN
                        }}
                    />
                </Canvas>
            </div>
        </div>
    );
}
