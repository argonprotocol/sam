export default class Reserve {
  private amountRemaining: number = 0;
  private amountSpent: number = 0;

  constructor(amount: number) {
    this.amountRemaining = amount;
  }

  public spend(amountToSpend: number) {
    amountToSpend = Math.min(this.amountRemaining, amountToSpend);
    this.amountRemaining -= amountToSpend;
    this.amountSpent += amountToSpend;
    return amountToSpend;
  }

  public exportMeta(priceOfToken: number): IReserveMeta {
    return {
      amountSpent: this.amountSpent,
      amountRemaining: this.amountRemaining,
      leveragePerDollar: 1 / priceOfToken,
    };
  }
}


export interface IReserveMeta {
  amountRemaining: number;
  amountSpent: number;
  leveragePerDollar: number;
}
