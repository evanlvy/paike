import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryTeachers = async (jiaoyanshiId) => {
    try {
      const url = this.baseUrl+"/teachers";
      console.log("Request url "+url+" with jiaoyanshi: "+jiaoyanshiId);
      let request_param = {
        jiaoyanshi: jiaoyanshiId,
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
