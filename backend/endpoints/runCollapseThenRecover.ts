import ChartController from "../controllers/ChartController";

export default async function runCollapse(req: Request) {
  const chartController = new ChartController();

  const body = await req.json();

  return await chartController.collapseThenRecover(body.rules, body.startingVaultMeta);
}
