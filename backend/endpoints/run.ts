import ChartController from "../controllers/ChartController";
export default async function run(req: Request) {
  const chartController = new ChartController();

  const body = await req.json();

  const startData = await chartController.start(body.rules);

  const lastStartMarker = startData[startData.length - 1];
  const collapseData = await chartController.collapse(body.rules, lastStartMarker.endingDate, lastStartMarker.endingPrice);

  const lastCollapseMarker = collapseData[collapseData.length - 1];
  const recoveryData = await chartController.recovery(body.rules, lastCollapseMarker.endingDate, lastCollapseMarker.endingPrice);

  const lastRecoveryMarker = recoveryData[recoveryData.length - 1];
  const dollarData = await chartController.dollar(lastRecoveryMarker.endingDate, body.rules);

  return {
    startData,
    collapseData,
    recoveryData,
    dollarData,
  };
}
