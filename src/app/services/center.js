import axios from 'axios';

import { server } from './common/info';

export class api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  async queryCenters () {
    try {
      const url = this.baseUrl+"/centers";
      console.log("Request url "+url);
      let response = await axios.post(url);
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
