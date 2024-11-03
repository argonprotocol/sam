import ChartController from "../controllers/ChartController";
export default async function runStart(req: Request) {
  const chartController = new ChartController();

  const body = await req.json();

  return await chartController.start(body.rules);
}
