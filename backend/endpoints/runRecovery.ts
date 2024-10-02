import ChartController from "../controllers/ChartController";
import { toNumber } from "../lib/utils";

export default async function runRecovery(req: Request) {
  const chartController = new ChartController();

  const { asset, rules, lastDate, lastPrice } = await req.json();

  return await chartController.recovery(asset, rules, lastDate, lastPrice);
}
