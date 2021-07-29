import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryGroups = async (stage) => {
    try {
      const url = this.baseUrl+"/get_rawplangroup";
      console.log("Request url "+url+" with stage: "+stage);
      let request_param = {
        stage_id: stage,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.groups;
    } catch (error) {
      throw error;
    }
  }

  queryRawplan = async (stage, weekIdx, degreeId, gradeId) => {
    try {
      const url = this.baseUrl+"/get_rawplan";
      console.log("Request url "+url+" with degree: "+degreeId+", grade: "+gradeId+", stage: "+stage+", week: "+weekIdx);
      let request_param = {
        stage_id: stage,
        week_idx: weekIdx,
        degree_id: degreeId,
        grade_id: gradeId,
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
