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

/////////////////////////////////////////////////////////////

export function calculateWageProtection(payment, cpi) {
  return payment + (payment * cpi);
}

export function calculateTaxes(payment, currentCPI) {
  const taxRate = currentCPI >= 0.1 ? 0.3 : 0.2 + currentCPI;
  return payment * taxRate;
}

export function fetchArgonCPI(currentArgons, targetArgons) {
  // for this model, lets pretend dollar is stable
  const currentUsCpi = US_CPI_AT_START;

  // TODO: We need to add an eight block delay to the argon burn to account for the time it takes for the
  // transaction to be mined. This is a hack to get around the fact that we're not pulling from a live
  //  currency exchange.
  // https://www.investopedia.com/terms/q/quantitytheoryofmoney.asp


  // According to the Quantity Theory of Money, supply and demand must be matched. Therefore if one knows the
  // exchange rate of the dollar-to-x then one can presume to back that into an Argon CPI.

  // since we're not pulling from a live currency exchange, we'll back into the exchange rate by using the
  // Quantity Theory of Money, which says that the total price of a group of assets is equal to the total capital
  // chasing it.
  const usDollarToArgonExchangeRate = (currentArgons - (currentArgons - targetArgons)) / currentArgons;
  return ((currentUsCpi / US_CPI_AT_START) - 1) + ((1 / usDollarToArgonExchangeRate) - 1);
}

//////////////////////////////////

export function printHeaders() {
  console.log(
    ''.padEnd((18)),
    ' :  ',
    'CPI'.padEnd(10),
    ' -> ',
    'CPI'.padEnd(10),
    ' :  ',
    'BURNED ARGONS'.padEnd(15),
    ' :  ',
    'CIRCULATION       '.padEnd(40),
    ' :  ',
    '# ARGONS FOR DOLLAR'
  );
}

export function printRow(blockCount, lastBlock, currentBlock, argonsBurned, targetArgons, dayStats, terraPrice?) {
  const lastCPI = lastBlock.cpi;
  const lastArgons = lastBlock.circulation;
  const lastCostOfArgon = targetArgons / lastBlock.circulation;
  const lastArgonsForDollar = 1 / lastCostOfArgon;

  const currentCPI = currentBlock.cpi;
  const currentArgons = currentBlock.circulation;
  const currentCostOfArgon = targetArgons / currentBlock.circulation;
  const currentArgonsForDollar = 1 / currentCostOfArgon;

  const day = Math.round((blockCount / AVG_BLOCKS_PER_DAY));
  if (!dayStats[day]) {
    dayStats[day] = {
      start: {
        cpi: lastCPI,
        circulation: lastArgons,
        exchangeRate: 1 / lastArgonsForDollar,
      },
      terraPrice,
      burn: argonsBurned,
    };
  } else {
    dayStats[day].burn += argonsBurned;
    dayStats[day].end = {
      cpi: currentCPI,
      circulation: currentArgons,
      exchangeRate: 1 / currentArgonsForDollar,
    }
  }

  // console.log(
  //   `DAY ${day}, BLOCK ${(blockCount % AVG_BLOCKS_PER_DAY)}`.padEnd(18),
  //   ' :  ',
  //   `${addCommas(Math.round(lastCPI * 10000) / 10000)}`.padEnd(10),
  //   ' -> ',
  //   `${addCommas(Math.round(currentCPI * 10000) / 10000)}`.padEnd(10),
  //   ' :  ',
  //   `${addCommas(Math.round(argonsBurned))}`.padEnd(15),
  //   ' :  ',
  //   `${addCommas(Math.round(lastArgons))}`.padEnd(17),
  //   ' -> ',
  //   `${addCommas(Math.round(currentArgons))}`.padEnd(17),
  //   ' :  ',
  //   `${addCommas(Math.round(lastArgonsForDollar * 10) / 10)}`.padEnd(13),
  //   ' -> ',
  //   `${addCommas(Math.round(currentArgonsForDollar * 10) / 10)}`.padEnd(13),
  // );
}