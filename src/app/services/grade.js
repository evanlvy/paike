import axios from 'axios';

import { server } from './common/info';

export class api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryGradeTypes = async () => {
    try {
      const url = this.baseUrl+"/grades_types";
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
