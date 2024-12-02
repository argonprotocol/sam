export default class BaseScenario {
  static async get(filter: 'collapseThenRecover' | 'collapsingRecovery' | 'collapsedForever') {
    const response = await fetch(`/data/${filter}.json`, {
      headers: {
        'Content-Type': 'application/json' // Set the content type to JSON
      },
    });

    const responseData = await response.json();
    return responseData;
  }
}
