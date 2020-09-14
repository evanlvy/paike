import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryGradeTypes = () => {
    const data = [
      {id: "1", name: "大专", grades:[{id: "1", name: "2017级"}, {id: "2", name: "2018级"}, {id: "3", name: "2019级"}]},
      {id: "2", name: "高职", grades:[{id: "2", name: "2018级"}, {id: "3", name: "2019级"}]},
      {id: "3", name: "对接", grades:[{id: "3", name: "2019级"}]},
    ];
    try {
      const url = this.baseUrl+"/grades_types";
      console.log("Request url "+url);
      /*let response = await axios.post(url);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data;*/
      return data;
    } catch (error) {
      throw error;
    }
  }

  queryGrades = async (type) => {
    try {
      const url = this.baseURL+"/grades";
      console.log("Request url "+url+" with type "+type);
      let request_param = {
        grade_type: type
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
