import BlockchainRunner from '../engine/BlockchainRunner';

self.addEventListener('message', async (event) => {
  const { rules, emitEvery } = event.data;
  const runner = new BlockchainRunner(rules, emitEvery);
  runner.onMarkers = (markers: any) => {
    self.postMessage({ markers });
  };
  const { markers, phases } = await runner.runCollapseThenRecover();
  self.postMessage({ markers, phases, isFinished: true });
});