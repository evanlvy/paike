import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryLabs = async (centerId) => {
    try {
      const url = this.baseUrl+"/labs";
      console.log("Request url "+url+" with center: "+centerId);
      let request_param = {
        center: centerId,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
