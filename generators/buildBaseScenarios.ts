import * as Fs from 'fs';
import * as Path from 'path';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { TERRA_COLLAPSE_DATE, TERRA_LAUNCH_DATE } from '../src/engine/BlockchainRunner';
import rules from '../src/lib/RulesConfig';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import BlockchainRunner from '../src/engine/BlockchainRunner';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

{
  console.log('RUNNING COLLAPSE THEN RECOVER');
  const runner = new BlockchainRunner(rules);
  const data = runner.runCollapseThenRecover();
  save('collapseThenRecover', data);
}

{
  console.log('RUNNING COLLAPSING RECOVERY');
  const runner = new BlockchainRunner(rules);
  const data = runner.runCollapsingRecovery();
  save('collapsingRecovery', data);
}

{
  console.log('RUNNING COLLAPSED FOREVER');
  const runner = new BlockchainRunner(rules);
  const data = runner.runCollapsedForever();
  save('collapsedForever', data);
}

function save(name: string, data: any) {
  // Save scenario data to JSON file
  const dataStringified = JSON.stringify(data, null, 2);
  const dataDir = Path.join(__dirname, '../public/data');
  const dataPath = Path.join(dataDir, `${name}.json`);

  if (!Fs.existsSync(dataDir)) {
    Fs.mkdirSync(dataDir, { recursive: true });
  }

  Fs.writeFileSync(dataPath, dataStringified);
}
