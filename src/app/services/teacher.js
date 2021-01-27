import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryTeachers = async (jysId, stage_id, week) => {
    try {
      const url = this.baseUrl+"/teacher_jobs";
      console.log("Request url "+url+" with jys: "+jysId+", stage_id: "+stage_id+", week: "+week);
      let request_param = {
        dep_id: jysId,
        stage_id: stage_id,
        week: week,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.teachers;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
