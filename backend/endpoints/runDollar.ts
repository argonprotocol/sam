import ChartController from "../controllers/ChartController";
export default async function runDollar(req: Request) {
  const chartController = new ChartController();

  const body = await req.json();
  const endingDate = new Date(body.endingDate);

  return await chartController.dollar(endingDate, body.rules);
}
