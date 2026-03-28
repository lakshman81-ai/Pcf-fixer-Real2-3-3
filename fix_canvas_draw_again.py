import re

with open("src/ui/tabs/CanvasTab.jsx", "r") as f:
    content = f.read()

pattern = re.compile(r'return \(\s*<div className="relative w-full h-full bg-slate-900 flex flex-col" style={{ userSelect: \'none\' }}>', re.MULTILINE)

render_logic = """
  if (canvasMode === 'DRAW_CANVAS') {
      return (
          <div className="absolute inset-0 z-50 bg-slate-900">
              <DrawCanvas onClose={() => setCanvasMode('VIEW')} />
          </div>
      );
  }

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col" style={{ userSelect: 'none' }}>
"""

if "DRAW_CANVAS" not in content.split("export function CanvasTab")[1]:
    new_content = pattern.sub(render_logic, content)
    with open("src/ui/tabs/CanvasTab.jsx", "w") as f:
        f.write(new_content)
    print("Fixed Draw Canvas returning logic")
else:
    print("Already fixed")
