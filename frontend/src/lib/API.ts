import { useBasicStore } from '../stores/basic';

const API_BASE_URL = 'http://localhost:3000';

export type IStageName = 'start' | 'collapseThenRecover' | 'collapsingRecovery' | 'collapsedForever' | 'dollar';

export default class API {
  static async getSimulationData(stage: IStageName, data: any) {
    const dataToSend = JSON.stringify(data || {});
    const response = await fetch(`${API_BASE_URL}/run/${stage}`, {
      method: 'POST', // Specify the method as POST
      headers: {
        'Content-Type': 'application/json' // Set the content type to JSON
      },
      body: dataToSend // Include the data in the body of the request
    });

    const responseData = await response.json();
    useBasicStore().saveSimulationData(stage, responseData);
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

    const responseData = await response.json();
    useBasicStore().saveSimulationData('dollar', responseData);
    return responseData;
  }
}
