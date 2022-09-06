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
      if (error.response && error.response.status) {
        response = { errorCode: error.response.status, message: error.message}
      } else {
        response = error.response;
      }
    }

    if (response) {
      if (!response.data) {
        return { error: response };
      }
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

  queryStuNum = async (stu_num) => {
    let response = null;
    try {
      const url = this.baseUrl+"/parse_studentnum";
      console.log("Request url "+url+" with ("+stu_num+")");
      response = await axios.post(url, {
          stunum: stu_num
        });
    } catch (error) {
      response = error.response;
    }

    if (response) {
      const { success, data, message } = response.data;
      if (!success) {
        return { error: message };
      }
      console.log("queryStuNum: return data"+JSON.stringify(data));
      return data;
    } else {
      return { error: { errorCode: "EFFFFFFFF", message: "No response data defined"} };
    }
  }
}

export const api = new Api();
