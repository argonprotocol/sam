import * as Fs from 'fs';
import * as Path from 'path';
import csvParse from 'csv-parse/lib/sync';

export default function loadCsvFile(...pathArgs: string[]) {
  const filePath = Path.resolve(...pathArgs);
  const data = Fs.readFileSync(filePath, 'utf-8');
  try {
    const csvParseFn = csvParse as any;
    return csvParseFn(data, {
      columns: true,
      skip_empty_lines: true
    });
  } catch(error) {
    console.log(data);
    throw error;
  }
}
