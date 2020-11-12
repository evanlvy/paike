import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryGrades = async () => {
    try {
      const url = this.baseUrl+"/actual_grade_from_classes";
      console.log("Request url "+url);
      let response = await axios.post(url, {});
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      //console.log(`Response of url: ${url} is ${JSON.stringify(data[0])}`);
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
