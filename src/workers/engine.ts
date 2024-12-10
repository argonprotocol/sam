import BlockchainRunner from '../engine/BlockchainRunner';
import { IFilterName } from '../store';

self.addEventListener('message', async (event) => {
  const { rules, emitEvery, filterName } = event.data;
  const runner = new BlockchainRunner(rules, emitEvery);
  runner.onMarkers = (markers: any) => {
    self.postMessage({ markers });
  };
  const { markers, phases } = run(filterName, runner);
  self.postMessage({ markers, phases, isFinished: true, filterName });
});

function run(filterName: IFilterName, runner: BlockchainRunner): { markers: any, phases: any } {
  if (filterName === 'collapseThenRecover') {
    return runner.runCollapseThenRecover();
  } else if (filterName === 'collapsedForever') {
    return runner.runCollapsedForever();
  } else if (filterName === 'collapsingRecovery') {
    return runner.runCollapsingRecovery();
  }
  throw new Error(`Invalid filter name: ${filterName}`);
}
