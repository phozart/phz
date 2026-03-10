const c = require('../coverage/coverage-final.json');
const packages = {};
for (const [file, data] of Object.entries(c)) {
  const pkg = file.match(/packages\/([^/]+)\//)?.[1] || 'other';
  if (!packages[pkg]) packages[pkg] = { stmts: 0, covered: 0 };
  const s = data.s || {};
  for (const [k, v] of Object.entries(s)) {
    packages[pkg].stmts++;
    if (v > 0) packages[pkg].covered++;
  }
}
let totalStmts = 0, totalCovered = 0;
for (const [pkg, d] of Object.entries(packages).sort((a, b) => a[0].localeCompare(b[0]))) {
  const pct = d.stmts > 0 ? (d.covered / d.stmts * 100).toFixed(1) : '0.0';
  console.log(pkg.padEnd(20), pct.padStart(6) + '%', '(' + d.covered + '/' + d.stmts + ')');
  totalStmts += d.stmts;
  totalCovered += d.covered;
}
console.log('---');
console.log('TOTAL'.padEnd(20), (totalStmts > 0 ? (totalCovered / totalStmts * 100).toFixed(1) : '0.0').padStart(6) + '%', '(' + totalCovered + '/' + totalStmts + ')');
