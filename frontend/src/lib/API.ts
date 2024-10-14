import emitter from "../emitters/basic";

const API_BASE_URL = 'http://localhost:3000';

export default class API {
  static async getSimulationData(data?: any) {
    const response = await fetch(`${API_BASE_URL}/run`, {
      method: 'POST', // Specify the method as POST
      headers: {
        'Content-Type': 'application/json' // Set the content type to JSON
      },
      body: JSON.stringify(data || {}) // Include the data in the body of the request
    });
    const responseData = await response.json();
    emitter.emit('simulationData', responseData);
    return responseData;
  }

  static async getDollarData(data?: any) {
    const response = await fetch(`${API_BASE_URL}/run/dollar`, {
      method: 'POST', // Specify the method as POST
      headers: {
        'Content-Type': 'application/json' // Set the content type to JSON
      },
      body: JSON.stringify(data || {}) // Include the data in the body of the request
    });
    return response.json();
  }
}
