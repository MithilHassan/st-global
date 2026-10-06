const fs = require('fs');

const originalTs = fs.readFileSync('lib/types.ts', 'utf8');
const outputTs = fs.readFileSync('output.ts', 'utf8');

// Replace CurrencyInfo and CURRENCIES
const updated1 = originalTs.replace(/export interface CurrencyInfo \{[\s\S]*?\];/, outputTs);

// Replace numberToWordsCurrency
const finalCode = updated1.replace(
  /export function numberToWordsCurrency\(amount: number, currencyCode: string\): string \{[\s\S]*?return result \+ " Only";\n\}/,
  `export function numberToWordsCurrency(amount: number, currencyCode: string): string {
  const info = getCurrencyInfo(currencyCode);
  const safeAmount = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  const major = Math.floor(safeAmount);
  const minor = Math.round((safeAmount - major) * 100);
  let result = numberToWords(major) + " " + (major === 1 ? info.singular : info.plural);
  if (minor > 0) result += " and " + numberToWords(minor) + " " + (minor === 1 ? info.minorSingular : info.minorPlural);
  return result + " Only";
}`
);

fs.writeFileSync('lib/types.ts', finalCode);
console.log("Updated lib/types.ts");
