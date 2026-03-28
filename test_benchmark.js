import fs from 'fs';
import { fix6mmGaps, fix25mmGapsWithPipe } from './src/engine/GapFixEngine.js';

// Minimal mocked PCF parser just to read EP coords for the test
function parsePCF(content) {
  const lines = content.split('\n');
  const rows = [];
  let currentRow = null;
  let idx = 1;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    if (['PIPE', 'ELBOW', 'TEE', 'FLANGE', 'VALVE', 'SUPPORT', 'GASKET', 'WELDOLET'].includes(line.split(' ')[0])) {
        if (currentRow) rows.push(currentRow);
        currentRow = { type: line.split(' ')[0], _rowIndex: idx++ };
    } else if (currentRow) {
        if (line.startsWith('END-POINT')) {
            const parts = line.split(' ').filter(p=>p);
            const pt = { x: parseFloat(parts[1]), y: parseFloat(parts[2]), z: parseFloat(parts[3]) };
            if (!currentRow.ep1) currentRow.ep1 = pt;
            else if (!currentRow.ep2) currentRow.ep2 = pt;
        }
        if (line.startsWith('PIPELINE-REFERENCE')) {
             currentRow.pipelineRef = line.split(' ')[1];
        }
    }
  }
  if (currentRow) rows.push(currentRow);
  return rows;
}

const content = fs.readFileSync('benchmark-broken.pcf', 'utf-8');
const dataTable = parsePCF(content);

// Apply 6mm fix
const { updatedTable: t1, fixLog: l1 } = fix6mmGaps(dataTable);
// Apply 25mm fix
const { updatedTable: t2, fixLog: l2 } = fix25mmGapsWithPipe(t1);

console.log("=== 6MM FIX LOG ===");
l1.forEach(l => console.log(l.message));

console.log("\n=== 25MM FIX LOG ===");
l2.forEach(l => console.log(l.message));

console.log("\n=== SUMMARY ===");
console.log(`Initial rows: ${dataTable.length}`);
console.log(`Final rows: ${t2.length}`);

const countGaps = (table, maxDist) => {
    let count = 0;
    const top = table.filter(r => r.type !== 'SUPPORT' && r.ep1 && r.ep2);
    for (let i = 0; i < top.length - 1; i++) {
        const d = Math.sqrt(
            Math.pow(top[i].ep2.x - top[i+1].ep1.x, 2) +
            Math.pow(top[i].ep2.y - top[i+1].ep1.y, 2) +
            Math.pow(top[i].ep2.z - top[i+1].ep1.z, 2)
        );
        if (d > 0 && d <= maxDist) count++;
    }
    return count;
};

console.log(`Remaining gaps <= 25mm: ${countGaps(t2, 25.0)}`);
