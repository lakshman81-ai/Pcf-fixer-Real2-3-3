import re

with open('src/ui/tabs/ConfigTab.jsx', 'r') as f:
    content = f.read()

presets_ui = """
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                Tolerance Presets
              </h3>
              <p className="text-xs text-slate-500 mt-1">Apply pre-configured tolerance profiles for topology generation.</p>
            </div>
          </div>
          <div className="flex gap-2">
              <button
                  onClick={() => {
                      updateSmartFixer('connectionTolerance', 3);
                      updateSmartFixer('maxOverlap', 3);
                      updateSmartFixer('gapThreshold', 3);
                      updateSmartFixer('rayShooter', { ...localConfig.smartFixer.rayShooter, tubeTolerance: 10 });
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 rounded shadow-sm text-xs font-semibold text-slate-700 transition"
              >Tight (3mm)</button>
              <button
                  onClick={() => {
                      updateSmartFixer('connectionTolerance', 6);
                      updateSmartFixer('maxOverlap', 6);
                      updateSmartFixer('gapThreshold', 6);
                      updateSmartFixer('rayShooter', { ...localConfig.smartFixer.rayShooter, tubeTolerance: 25 });
                  }}
                  className="px-3 py-1.5 bg-blue-50 border border-blue-300 hover:border-blue-500 rounded shadow-sm text-xs font-semibold text-blue-800 transition"
              >Standard (6mm)</button>
              <button
                  onClick={() => {
                      updateSmartFixer('connectionTolerance', 25);
                      updateSmartFixer('maxOverlap', 25);
                      updateSmartFixer('gapThreshold', 25);
                      updateSmartFixer('rayShooter', { ...localConfig.smartFixer.rayShooter, tubeTolerance: 50 });
                  }}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 rounded shadow-sm text-xs font-semibold text-slate-700 transition"
              >Loose (25mm)</button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">
"""

content = content.replace('<div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-4 shadow-sm">', presets_ui, 1)

with open('src/ui/tabs/ConfigTab.jsx', 'w') as f:
    f.write(content)

print("Presets added to ConfigTab.")
