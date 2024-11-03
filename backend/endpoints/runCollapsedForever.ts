import ChartController from "../controllers/ChartController";

export default async function runCollapsedForever(req: Request) {
  const chartController = new ChartController();

  const body = await req.json();

  return await chartController.collapsedForever(body.rules, body.startingVaultMeta);
}
