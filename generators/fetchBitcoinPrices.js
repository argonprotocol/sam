const fs = require('fs');
const path = require('path');
const axios = require('axios');

// API endpoint for fetching Bitcoin price data
const BASE_URL = 'https://api.blockchain.info/charts/market-price';
const START_DATE = '2010-07-18'; // First known price date
const TODAY = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format

async function fetchBitcoinData() {
  try {
    // Make API request to fetch Bitcoin price data
    const response = await axios.get(BASE_URL, {
      params: {
        timespan: 'all',
        start: START_DATE,
        end: TODAY,
        format: 'json',
        sampled: false, // Request all data points without sampling
      },
    });

    const data = [];
    
    // Process each data point
    response.data.values.forEach((item, index) => {
      // Skip the first item if it has no price (y value)
      if (Object.values(data).length === 0 && !item.y) return;
      
      // Convert Unix timestamp to Date object and format as YYYY-MM-DD
      const date = new Date((item.x - 3600) * 1000) // Subtract 1 hour to adjust for timezone
      const dateStr = date.toISOString().split('T')[0];
      
      // Add formatted row to data record
      data.push({
        millis: item.x,
        date: dateStr,
        price: item.y,
      });
    });

    // Write data to CSV file
    const filePath = path.join(__dirname, '../src/data/bitcoinPrices.json')
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log('Data saved to src/databitcoinPrices.json');
  } catch (error) {
    console.error('Error fetching data:', error.response ? error.response.data : error.message);
  }
}

// Execute the function
fetchBitcoinData();