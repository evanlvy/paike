import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  login = async (name, password) => {
    if (server.debug) {
      return {api_token: "FFFFFFFF", user: {name: "Debugger"}};
    }
    let response = null;
    try {
      const url = this.baseUrl+"/login";
      console.log("Request url "+url+" with ("+name+")");
      response = await axios.post(url, {
          username: name,
          password: password
        });
    } catch (error) {
      response = error.response;
    }

    if (response) {
      const { success, data, message } = response.data;
      if (!success) {
        return { error: message };
      }
      console.log("login: return data"+JSON.stringify(data));
      return data;
    } else {
      return { error: { errorCode: "EFFFFFFFF", message: "No response data defined"} };
    }
  }
}

export const api = new Api();
