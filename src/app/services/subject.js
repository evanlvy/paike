import axios from 'axios';

import { server } from './common/info';

export class api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  querySubjects = async (gradeTypeId, gradeId) => {
    try {
      const url = this.baseUrl+"/subjects";
      console.log("Request url "+url+" with grade type: "+gradeTypeId+", grade: "+gradeId);
      let request_param = {
        gradeType: gradeTypeId,
        grade: gradeId,
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
