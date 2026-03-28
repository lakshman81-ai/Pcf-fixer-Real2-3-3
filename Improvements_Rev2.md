# PCF Validator & Smart Fixer - Improvements_Rev2.md

## 1. Enhancements of Existing Tools

*   **Marquee Select & Marquee Zoom (User Idea 3a):**
    *   **Current Issue:** Basic implementation struggles to graphically define a precise selection box. The visual feedback (the dotted line) often lags or doesn't accurately represent the 3D space being enclosed.
    *   **Enhancement:** Transition from a simple 2D screen-space rectangle to a robust **frustum-based selection**.
        *   Visually, render a semi-transparent, filled polygon (e.g., light blue with a solid border for 'window' selection, light green with a dashed border for 'crossing' selection, similar to AutoCAD).
        *   Implement **Directional Selection**: Dragging Left-to-Right selects only elements fully enclosed (Window). Dragging Right-to-Left selects any element touched by the box (Crossing).
*   **Measurement Tool:**
    *   Add multi-point continuous measurements (chain dimensions).
    *   Implement "Snap to Centerline", "Snap to Surface", and "Snap to End/Node" for precise measurements, showing visual snap indicators (squares, circles, triangles) when hovering over key geometry points.
*   **Property Panels (Pipeline & Support):**
    *   Transition from floating panels to a dedicated, dockable "Properties Inspector" on the right sidebar. This prevents panels from obscuring the 3D view and provides a consistent location for data.
    *   Add inline editing directly within the property panel for attributes like Description, Rating, or Custom CA attributes.
*   **Section Box (Clipping Planes):**
    *   Add interactive 3D gizmos (translation arrows and rotation arcs) directly on the faces of the Section Box cube, allowing users to drag faces to resize the box dynamically, rather than relying on an invisible bounding box.

## 2. New Features Recommended

*   **Undo/Redo Stack Visualization:** A "History" panel showing the list of recent actions (e.g., "Deleted 5 pipes", "Moved Support", "Fixed 6mm gap"), allowing the user to jump back to any specific state.
*   **Clash Detection Engine:** A utility to analyze the 3D topology and highlight overlapping components or pipes that intersect without a proper connection node.
*   **PCF Export/Save As:** The ability to write the modified, fixed, or newly drawn 3D geometry back out to a standard PCF file format for use in other piping software (AutoCAD Plant 3D, Smart3D, etc.).
*   **Isometrics Generation Preview:** A button to generate a 2D isometric drawing preview of the current spool or pipeline directly within the browser, utilizing a library like `d3.js` or basic SVG rendering based on the 3D nodes.

## 3. The "Draw Canvas" (User Idea 3b)

Creating a dedicated space for drafting new piping geometry from scratch is a massive and valuable addition.

### Core Mechanics & Workflow
*   **Entry:** A prominent "Draw Mode" button toggles the interface from the current "Topology/Fixer" view to the "Draw Canvas".
*   **Grid & Snapping:** A dynamic, infinite 3D grid plane (XY, XZ, or YZ, switchable via quickkeys like F5). Snapping is mandatory for professional drafting: Snap to Grid, Snap to Ortho (locking to axes), Snap to Endpoints, Snap to Intersections.
*   **Drafting Process:**
    1.  **Click 1 (Start Point):** Anchors the start of the pipe.
    2.  **Mouse Move (Rubber-banding):** A phantom cylinder stretches from the start point to the cursor.
    3.  **Heads-Up Display (HUD) Popup:** As the cursor moves, a floating text input appears near the cursor.
        *   The user can click to place the next point, OR type a value (e.g., "1500") and press Enter to constrain the length to exactly 1500mm in the current mouse direction.
        *   This HUD should also have quick dropdowns for the current **Bore**, **Spec (Rating)**, and a toggle to "Insert Component" (Valve, Flange, Support) at the next click.
*   **Post-Draw Editing (Double Click):**
    *   Double-clicking a drawn pipe segment opens a contextual modal or highlights the properties in the sidebar.
    *   Users can type a new length, and the system must intelligently push/pull connected components down the line to accommodate the change without breaking connections.

## 4. Expert Inputs: Architecting a Professional "Draw Canvas"

To make the "Draw Canvas" feel like a professional CAD application (like AutoCAD Plant 3D or PDMS), the UI and interaction model must be highly specialized.

### Layout & UI
*   **Command Line Interface (CLI):** At the bottom of the screen, add a command prompt. Power users rely on keyboards. Typing `PL` (Polyline/PipeRun), `V` (Valve), `S` (Support), followed by coordinates or lengths is vastly faster than clicking buttons.
*   **Tool Palettes (Left Dock):** Categorized drag-and-drop palettes.
    *   *Pipes & Fittings:* Elbows (90, 45), Tees, Reducers, Caps.
    *   *Valves & Inline:* Gate, Globe, Check, Instruments.
    *   *Supports:* Anchors, Guides, Hangers, Shoes.
*   **Properties & Outliner (Right Dock):**
    *   Top half: A tree-view (Outliner) of the Spools and Pipelines being drawn.
    *   Bottom half: The Properties Inspector for the currently selected item.

### Essential 3D Tools
*   **Auto-Routing & Auto-Fittings:** If a user draws a pipe along the X-axis, then clicks a point along the Y-axis, the system *must automatically* insert the correct Elbow fitting (based on current Spec) at the corner.
*   **Elevation/Z-Override:** Drawing in 3D on a 2D screen is hard. Provide quick hotkeys (e.g., holding `Ctrl` while dragging) to lock movement strictly to the Z (Vertical) axis.
*   **UCS (User Coordinate System):** The ability to align the drawing grid to an existing angled pipe face, allowing the user to draw branching lines at compound angles easily.

## 5. Professionalizing the Current 3D Topo Canvas

To elevate the current 3D Topo Viewer/Fixer to an enterprise-grade standard, the following architectural and visual changes are recommended:

### Visual Quality & Rendering
*   **PBR Materials (Physically Based Rendering):** Move away from simple `MeshBasicMaterial` or `MeshPhongMaterial`. Use `MeshStandardMaterial` with subtle metalness and roughness values. This gives pipes a realistic steel/plastic sheen, improving depth perception significantly.
*   **Ambient Occlusion (SSAO):** Implement Screen Space Ambient Occlusion in the Three.js post-processing pipeline. This adds soft shadows in corners (where pipes meet fittings), drastically improving the realism and readability of complex geometric clusters.
*   **Anti-Aliasing:** Ensure `antialias: true` is on the WebGLRenderer, and consider FXAA/SMAA post-processing passes if jagged edges are visible on thin lines/labels.
*   **Dynamic Grid:** The current static grid is fine, but a professional grid fades out gracefully in the distance (fog integration) and subdivides intelligently as the user zooms in (showing 1000mm blocks, then 100mm blocks, then 10mm blocks).

### Layout Modifications
*   **The "Ribbon" vs. Contextual Menus:** The top toolbar ribbon is good for global actions (View, Config, Shading). However, object-specific actions (Delete, Stretch, Connect, Measure) should be moved to a **Right-Click Context Menu**.
    *   *Workflow:* Select a pipe -> Right Click -> Select "Measure", "Isolate", or "Delete". This reduces mouse travel and screen clutter.
*   **View Cube:** Replace the generic "FRNT/TOP/ISO" text buttons with a standard interactive 3D View Cube in the top right corner. Users can click faces, edges, or corners of the cube to snap to precise isometric or orthographic views instantly.
*   **Docking Framework:** Implement a robust window-manager library (like `golden-layout` or `rc-dock`). Professional apps allow users to drag panels (Data Table, 3D Canvas, Properties, Logs) and arrange them on multiple monitors or split-screens according to their workflow. The current fixed-tab layout limits multi-tasking.
