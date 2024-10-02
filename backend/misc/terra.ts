import loadCsvFile from '../lib/loadCsvFile';
import * as Path from 'path';
import * as fs from 'fs';

const terraDataPath = Path.join(__dirname, 'data', 'terra-prices.csv');
const outputCsvPath = Path.join(__dirname, 'data', 'terra-prices-output.csv');

const rows = loadCsvFile(terraDataPath);
const columnsToSave = ['date', 'original', 'close'];

// Insert original column
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  rows[i] = {
    date: row.date,
    original: row.close,
    close: row.close,
  }
}

// Ensure the slope is always going down
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const nextRow = rows[i + 1];
  row.i = i;

  if (nextRow) {
    row.close = Number(row.close);
    nextRow.close = Number(nextRow.close);

    if (row.close > 0.99) {
      row.close = 1;
    } else if (row.close < nextRow.close) {
      smoothUntilNextDrop(i);
    }
  }
}

// Smooth out the data
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const prevRow = rows[i - 1];
  const nextRow = rows[i + 1];
  if (!prevRow || !nextRow) break;

  const diff = (prevRow.close - nextRow.close) / 3;
  row.close = (row.close + nextRow.close) / 2;
}

// Prepare CSV content
let csvContent = columnsToSave.join(',') + '\n';
for (const row of rows) {
  const rowData = columnsToSave.map(col => {
    const value = row[col];
    return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
  }).join(',');
  csvContent += rowData + '\n';
}

// Write to CSV file
fs.writeFileSync(outputCsvPath, csvContent);

console.log('Data saved to', outputCsvPath);

function smoothUntilNextDrop(i: number) {
  console.log('--------');
  const row = rows[i];
  const [nextValidRow, j] = findNextDrop(i);
  if (!nextValidRow) return;

  const daysSince = j - i;
  const toAdd = (nextValidRow.close - row.close) / daysSince;

  for (let k = i; k <= j; k++) {
    rows[k].close = rows[i].close + (toAdd * (k - i));
    console.log(i, k, j, rows[k].original, toAdd, rows[k].close, rows[k]);
  }
}

function findNextDrop(i: number): [row: typeof rows[number], index: number] {
  for (let j = i + 1; j < rows.length; j++) {
    if (rows[j].close < rows[i].close) {
      return [rows[j], j];
    }
  }
  return [null, 0];
}