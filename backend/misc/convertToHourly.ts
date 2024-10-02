import * as Path from 'path';
import * as fs from 'fs';
import loadCsvFile from './lib/loadCsvFile';

const terraDataPath = Path.join(__dirname, 'data', 'terra-curve.csv');
const outputCsvPath = Path.join(__dirname, 'data', 'terra-curve-hourly.csv');

const rows = loadCsvFile(terraDataPath);

// interpolate prices and generate hourly timestamps
const hourlyPrices = [];
for (let i = 0; i < rows.length - 1; i++) {
    const startPrice = parseFloat(rows[i].price);
    const endPrice = parseFloat(rows[i + 1].price);
    const step = (endPrice - startPrice) / 24;

    const startDate = new Date(rows[i].date);
    for (let j = 0; j < 24; j++) {
        const hourlyDate = new Date(startDate);
        hourlyDate.setHours(j-5);
        hourlyPrices.push({
            date: hourlyDate.toISOString().replace('T', ' ').substring(0, 19),
            price: (startPrice + step * j).toFixed(10)
        });
    }
}

// Manually create CSV content
let csvContent = 'date,price\n';
hourlyPrices.forEach(row => {
    csvContent += `${row.date},${row.price}\n`;
});

// Write the hourly prices to a new CSV file
fs.writeFileSync(outputCsvPath, csvContent);

console.log(`Hourly prices written to ${outputCsvPath}`);