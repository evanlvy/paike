import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryJiaoyanshi = async () => {
    try {
      const url = this.baseUrl+"/department";
      console.log("Request url "+url);
      let response = await axios.post(url, {});
      const { success, data, message } = response.data;
      if (!success) {
        if (!message) {
          throw new Error("服务器返回错误! 请联系管理员。");
        }
        else {
          throw new Error(message.message);
        }
      }
      return data.departments;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
