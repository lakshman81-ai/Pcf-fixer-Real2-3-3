import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ClippingPlanesLayer = () => {
    const { gl, scene } = useThree();
    const meshRef = useRef();
    const edgesRef = useRef();
    const clippingPlaneEnabled = useStore(state => state.clippingPlaneEnabled);

    // Six clipping planes for a true section box (Max and Min for X, Y, Z)
    const [planes] = useState(() => [
        new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10000),   // Max X
        new THREE.Plane(new THREE.Vector3(1, 0, 0), 10000),    // Min X
        new THREE.Plane(new THREE.Vector3(0, -1, 0), 10000),   // Max Y
        new THREE.Plane(new THREE.Vector3(0, 1, 0), 10000),    // Min Y
        new THREE.Plane(new THREE.Vector3(0, 0, -1), 10000),   // Max Z
        new THREE.Plane(new THREE.Vector3(0, 0, 1), 10000)     // Min Z
    ]);

    useEffect(() => {
        // Safe access for WebGLRenderer state changes
        try {
            if (gl && 'localClippingEnabled' in gl) {
                gl.localClippingEnabled = clippingPlaneEnabled;
            }
        } catch (e) {
            // Ignore strict mode mutability errors if wrapped in a hook system
        }

        const applyPlanes = () => {
            scene.traverse((child) => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => {
                        // Skip text/UI layers that don't need clipping
                        if (mat.type !== 'MeshBasicMaterial' || !mat.transparent) {
                            mat.clippingPlanes = clippingPlaneEnabled ? planes : [];
                            mat.clipIntersection = false;
                            mat.needsUpdate = true;
                        }
                    });
                }
            });
        };

        applyPlanes();
    }, [clippingPlaneEnabled, gl, scene, planes]);

    // Expose plane update functions to global window for external UI slider component
    useEffect(() => {
        window.updateClippingPlanes = (axis, type, value) => {
            if (axis === 'x' && type === 'max') planes[0].constant = value;
            if (axis === 'x' && type === 'min') planes[1].constant = -value;
            if (axis === 'y' && type === 'max') planes[2].constant = value;
            if (axis === 'y' && type === 'min') planes[3].constant = -value;
            if (axis === 'z' && type === 'max') planes[4].constant = value;
            if (axis === 'z' && type === 'min') planes[5].constant = -value;
        };
        return () => { delete window.updateClippingPlanes; };
    }, [planes]);

    useFrame(() => {
        if (clippingPlaneEnabled && meshRef.current && edgesRef.current) {
            const maxX = planes[0].constant;
            const minX = -planes[1].constant;
            const maxY = planes[2].constant;
            const minY = -planes[3].constant;
            const maxZ = planes[4].constant;
            const minZ = -planes[5].constant;

            const width = maxX - minX;
            const height = maxY - minY;
            const depth = maxZ - minZ;

            const centerX = (maxX + minX) / 2;
            const centerY = (maxY + minY) / 2;
            const centerZ = (maxZ + minZ) / 2;

            meshRef.current.position.set(centerX, centerY, centerZ);
            meshRef.current.scale.set(Math.max(width, 0.1), Math.max(height, 0.1), Math.max(depth, 0.1));

            edgesRef.current.position.copy(meshRef.current.position);
            edgesRef.current.scale.copy(meshRef.current.scale);
        }
    });

    return (
        <group>
            {clippingPlaneEnabled && (
                <>
                    <mesh ref={meshRef} renderOrder={999}>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshBasicMaterial
                            color="#3b82f6"
                            transparent
                            opacity={0.1}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                    <lineSegments ref={edgesRef} renderOrder={999}>
                        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1, 1, 1)]} />
                        <lineBasicMaterial attach="material" color="#3b82f6" transparent opacity={0.5} />
                    </lineSegments>
                </>
            )}
        </group>
    );
};

export const ClippingPanelUI = () => {
    const clippingPlaneEnabled = useStore(state => state.clippingPlaneEnabled);
    const setClippingPlaneEnabled = useStore(state => state.setClippingPlaneEnabled);

    const [ranges, setRanges] = useState({
        x: { min: -10000, max: 10000 },
        y: { min: -10000, max: 10000 },
        z: { min: -10000, max: 10000 }
    });

    const handleSlider = (axis, type, value) => {
        setRanges(prev => ({
            ...prev,
            [axis]: { ...prev[axis], [type]: value }
        }));
        if (window.updateClippingPlanes) {
            window.updateClippingPlanes(axis, type, value);
        }
    };

    if (!clippingPlaneEnabled) return null;

    return (
        <div className="w-72 bg-slate-900/90 backdrop-blur border border-slate-700 shadow-2xl rounded-lg p-4 shrink-0">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-3">
                <span className="text-slate-200 font-bold text-sm">Section Box</span>
                <button onClick={() => setClippingPlaneEnabled(false)} className="text-slate-400 hover:text-white" title="Close">✕</button>
            </div>

            {['x', 'y', 'z'].map(axis => (
                <div key={axis} className="mb-4">
                    <div className="flex justify-between text-xs text-slate-400 mb-1 font-bold uppercase">
                        <span>{axis}-Axis</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-slate-500 w-6">Min</span>
                        <input
                            type="range"
                            min="-20000"
                            max="20000"
                            value={ranges[axis].min}
                            onChange={(e) => handleSlider(axis, 'min', parseInt(e.target.value))}
                            className="flex-1 accent-blue-500"
                        />
                        <span className="text-[10px] text-slate-400 w-10 text-right">{ranges[axis].min}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 w-6">Max</span>
                        <input
                            type="range"
                            min="-20000"
                            max="20000"
                            value={ranges[axis].max}
                            onChange={(e) => handleSlider(axis, 'max', parseInt(e.target.value))}
                            className="flex-1 accent-blue-500"
                        />
                        <span className="text-[10px] text-slate-400 w-10 text-right">{ranges[axis].max}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};
