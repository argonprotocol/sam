import numbro from 'numbro';

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

export function addCommas(num: string | number, decimals?: number) {
  num = num.toString();
  decimals = decimals || countDecimals(num);
  return isInt(num) ? addCommasToInt(num) : addCommasToFloat(num, decimals);
}

export function addCommasToInt(str: string) {
  const arr = str.toString().split('.');
  const int = arr[0];
  return int.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
}

function countDecimals(num: number | string) {
  // Convert the number to a string
  const numberStr = typeof num === 'number' ? num.toString() : num;

  // Check if the number contains a decimal point
  if (numberStr.includes('.')) {
    // Split the string at the decimal point and return the length of the part after the decimal
    return numberStr.split('.')[1].length;
  } else {
    // If there's no decimal point, the number has 0 decimal places
    return 0;
  }
}

export function formatPrice(price: number, decimals?: number) {
  if (!price) return '0.00';
  if (price < 0.10 && price.toFixed(3).charAt(4) !== '0') {
    return price.toFixed(decimals || 3);
  } else  {
    return price.toFixed(decimals || 2);
  }
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

export function currency(num: string | number, decimals = 2) {
  return addCommas(Number(num).toFixed(decimals));
}

export function isInt(n: any) {
  if (typeof n === 'string') return !n.includes('.');
  return n % 1 === 0;
}

export function formatAsBillions(value: number | string) {
  const ONE_BILLION = 1_000_000_000;
  const TEN_MILLION = 10_000_000;
  const ONE_MILLION = 1_000_000;
  value = Number(value);

  if (value <= 0) return '0'
  if (value >= TEN_MILLION) {
    return `${addCommas(value / ONE_BILLION, 2)}B`;
  } else if (value >= ONE_MILLION) {
    return `${(value / ONE_BILLION).toFixed(3)}B`;
  } else {
    return value.toExponential(2);
  }
}

export function formatShorthandNumber(value: number | string, optionsOverride: { mantissa?: number, optionalMantissa?: boolean } = {}) {
  if (value === '--') {
    return value;
  }

  return numbro(value).format({
    average: true,
    mantissa: 1,
    optionalMantissa: true,
    ...optionsOverride,
  }).toUpperCase();
}


export function formatChangePct(pct: number) {
  if (pct === 0 || Math.abs(pct) === 100) return pct;

  let formatted = Math.round(pct * 100); // Initially round to whole number
  if (formatted !== 0 && Math.abs(formatted) !== 100) return formatted;

  let decimals = 0;
  while (true) {
    formatted = Math.round(pct * Math.pow(10, decimals + 2)) / Math.pow(10, decimals);
    if (formatted !== 0 && Math.abs(formatted) !== 100) {
      return formatted;
    }
    decimals++;
    if (decimals > 10) {
      return  Math.round(pct * 100); // Prevent infinite loop
    }
  }
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
}
