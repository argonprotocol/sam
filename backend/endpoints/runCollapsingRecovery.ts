import ChartController from "../controllers/ChartController";

export default async function runCollapsingRecovery(req: Request) {
  const chartController = new ChartController();

  // console.log('runCollapse', req, await req.text());
  const body = await req.json();

  return await chartController.collapsingRecovery(body.rules, body.startingVaultMeta);
}
