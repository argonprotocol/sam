export const AVG_BLOCKS_PER_DAY = 6 * 24;
export const US_CPI_AT_START = 292.7;

export const AVERAGE_INFLATION = 3.8 / 100;
export const CURRENT_INFLATION = 4.99 / 100;

export function calculateIndexInRange(number, rangeStart, rangeEnd) {
  return ((number - rangeStart) / (rangeEnd - rangeStart));
}

export function createPromisable<T = any>() {
  const promiseLike: any = {};
  promiseLike.promise = new Promise<T>((resolve, reject) => {
    promiseLike.resolve = resolve;
    promiseLike.reject = reject;
  });
  return promiseLike as IPromisable<T>;
}

export interface IPromisable<T = any> {
  promise: Promise<T>;
  resolve: (arg?: T) => void;
  reject: (error: Error) => void;
}

export function calculatePrice(capital, currency) {
  return capital / currency;
}
export function calculateDiscreteReturn(startingPrice, currentPrice): number {
  return ((currentPrice - startingPrice) / startingPrice);
}

export function calculateAnnualizedReturn(discreteReturn, daysRan): number {
  return discreteReturn * (365 / daysRan);
}

export function calculateCompoundedReturn(discreteReturn, days) {
  const periodsPerYear = 365 / days;
  const periodicRate = 1 + discreteReturn;
  return Math.pow(periodicRate, periodsPerYear) - 1;
}

export function addCommas(num: string | number, decimals = 2) {
  num = num.toString();
  return isInt(num) ? addCommasToInt(num) : addCommasToFloat(num, decimals);
}

export function addCommasToInt(str: string) {
  const arr = str.toString().split('.');
  const int = arr[0];
  return int.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}

export function addCommasToFloat(str: string, decimals = 2) {
  const arr = str.split('.');
  const int = arr[0];
  const dec = arr.length > 1 ? `.${arr[1]}` : '';
  return (
    // tslint:disable-next-line:prefer-template
    int.replace(/(\d)(?=(\d{3})+$)/g, '$1,') +
    '.' +
    parseFloat(dec)
      .toFixed(decimals)
      .split('.')[1]
  );
}

export function currency(num: string | number) {
  return addCommas(Number(num).toFixed(2));
}

export function isInt(n: any) {
  if (typeof n === 'string') return !n.includes('.');
  return n % 1 === 0;
}

export function toNumber(value: string): number {
  if (typeof value === 'number') return value;
  return Number(value.replace(/[^0-9.]/g, ''));
}

/////////////////////////////////////////////////////////////

export function calculateWageProtection(payment, cpi) {
  return payment + (payment * cpi);
}

export function calculateTaxes(payment, currentCPI) {
  const taxRate = currentCPI >= 0.1 ? 0.3 : 0.2 + currentCPI;
  return payment * taxRate;
}

export function formatDateAsYYYYMMDD(date: Date): string {
  return`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
}