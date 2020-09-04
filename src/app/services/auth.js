import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  login = (name, password) => {
    const data = {
      token: "eadafderead",
      username: name
    };
    try {
      const url = this.baseUrl+"/login";
      console.log("Request url "+url+" with ("+name+")");
      /*let response = await axios.post(url, {
          username: name,
          password: password
        });
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data;*/
      console.log("login: return data"+JSON.stringify(data));
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
