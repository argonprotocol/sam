import { divide } from "./Utils";

export default class Reserve {
  private amountRemaining: number = 0;
  private amountSpent: number = 0;

  constructor(amount: number, amountSpent: number = 0) {
    this.amountRemaining = amount;
    this.amountSpent = amountSpent;
  }

  public spend(amountToSpend: number) {
    amountToSpend = Math.min(this.amountRemaining, amountToSpend);
    this.amountRemaining = this.amountRemaining - amountToSpend;
    this.amountSpent = this.amountSpent + amountToSpend;
  }


  public reverseSpend(amountToReverse: number) {
    amountToReverse = Math.min(this.amountSpent, amountToReverse);
    this.amountRemaining = this.amountRemaining + amountToReverse;
    this.amountSpent = this.amountSpent - amountToReverse;
  }

  public exportMeta(priceOfToken: number): IReserveMeta {
    return {
      amountSpent: this.amountSpent,
      amountRemaining: this.amountRemaining,
      burnPerReserveDollar: divide(1, priceOfToken),
    };
  }
}


export interface IReserveMeta {
  amountRemaining: number;
  amountSpent: number;
  burnPerReserveDollar: number;
}
