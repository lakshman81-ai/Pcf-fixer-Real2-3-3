import React from 'react';
import { useStore } from '../../store/useStore';

export const SettingsModal = () => {
  const showSettings = useStore(state => state.showSettings);
  const setShowSettings = useStore(state => state.setShowSettings);
  const appSettings = useStore(state => state.appSettings);
  const updateAppSettings = useStore(state => state.updateAppSettings);

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-lg w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-800 p-4 border-b border-slate-700">
          <h2 className="text-slate-100 font-bold text-lg flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Preferences & Settings
          </h2>
          <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white transition-colors" title="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Interaction Settings */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Interaction & View</h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm font-medium text-slate-200">Grid Snap Resolution</div>
                            <div className="text-xs text-slate-400">Tolerance for snapping tools (mm)</div>
                        </div>
                        <input
                            type="number"
                            min="1"
                            value={appSettings.gridSnapResolution}
                            onChange={(e) => updateAppSettings({ gridSnapResolution: parseInt(e.target.value) || 100 })}
                            className="bg-slate-950 text-slate-200 text-sm p-2 w-24 rounded border border-slate-700 text-right focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm font-medium text-slate-200">Perspective FOV</div>
                            <div className="text-xs text-slate-400">Camera field of view angle</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min="20"
                                max="90"
                                value={appSettings.cameraFov}
                                onChange={(e) => updateAppSettings({ cameraFov: parseInt(e.target.value) || 45 })}
                                className="accent-blue-500 w-24"
                            />
                            <span className="text-xs font-mono text-slate-400 w-6">{appSettings.cameraFov}°</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm font-medium text-slate-200">Camera Near Plane</div>
                        </div>
                        <input
                            type="number"
                            min="0.1"
                            value={appSettings.cameraNear}
                            onChange={(e) => updateAppSettings({ cameraNear: parseFloat(e.target.value) || 1 })}
                            className="bg-slate-950 text-slate-200 text-sm p-2 w-24 rounded border border-slate-700 text-right focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-sm font-medium text-slate-200">Camera Far Plane</div>
                        </div>
                        <input
                            type="number"
                            min="1000"
                            value={appSettings.cameraFar}
                            onChange={(e) => updateAppSettings({ cameraFar: parseInt(e.target.value) || 500000 })}
                            className="bg-slate-950 text-slate-200 text-sm p-2 w-24 rounded border border-slate-700 text-right focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                </div>
            </div>

            {/* Component Colors */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Component Colors</h3>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(appSettings.componentColors).map(([type, color]) => (
                        <div key={type} className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-200">{type}</span>
                            <div className="relative w-8 h-8 rounded overflow-hidden border border-slate-600">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => updateAppSettings({
                                        componentColors: { ...appSettings.componentColors, [type]: e.target.value }
                                    })}
                                    className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Visualization Settings */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2">Visualization</h3>

                <div className="space-y-3">
                    <label className="flex justify-between items-center cursor-pointer group">
                        <div>
                            <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Center Orbit on Select</div>
                            <div className="text-xs text-slate-400">Orbit camera around clicked point</div>
                        </div>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={appSettings.centerOrbitOnSelect} onChange={(e) => updateAppSettings({ centerOrbitOnSelect: e.target.checked })} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${appSettings.centerOrbitOnSelect ? 'bg-blue-600' : 'bg-slate-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${appSettings.centerOrbitOnSelect ? 'translate-x-4' : ''}`}></div>
                        </div>
                    </label>

                    <label className="flex justify-between items-center cursor-pointer group">
                        <div>
                            <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Show Ground Grid</div>
                            <div className="text-xs text-slate-400">Display reference grid plane at Y=0</div>
                        </div>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={appSettings.showGrid} onChange={(e) => updateAppSettings({ showGrid: e.target.checked })} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${appSettings.showGrid ? 'bg-blue-600' : 'bg-slate-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${appSettings.showGrid ? 'translate-x-4' : ''}`}></div>
                        </div>
                    </label>

                    <label className="flex justify-between items-center cursor-pointer group">
                        <div>
                            <div className="text-sm font-medium text-slate-200 group-hover:text-blue-400 transition-colors">Show Axis Helper</div>
                            <div className="text-xs text-slate-400">Display global RGB coordinate axes</div>
                        </div>
                        <div className="relative">
                            <input type="checkbox" className="sr-only" checked={appSettings.showAxes} onChange={(e) => updateAppSettings({ showAxes: e.target.checked })} />
                            <div className={`block w-10 h-6 rounded-full transition-colors ${appSettings.showAxes ? 'bg-blue-600' : 'bg-slate-700'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${appSettings.showAxes ? 'translate-x-4' : ''}`}></div>
                        </div>
                    </label>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-800 p-4 border-t border-slate-700 flex justify-end">
            <button
                onClick={() => setShowSettings(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded text-sm transition-colors shadow-lg"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};
