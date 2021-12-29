import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  querySubjects = async (degreeId, gradeId) => {
    try {
      const url = this.baseUrl+"/actual_major_from_classes";
      console.log("Request url "+url+" with degree: "+degreeId+", grade: "+gradeId);
      let request_param = {
        degree_id: degreeId,
        grade_id: gradeId,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.majors;
    } catch (error) {
      throw error;
    }
  }

  queryBanji = async (gradeId, subjectId) => {
    try {
      const url = this.baseUrl+"/class";
      console.log("Request url "+url+" with grade: "+gradeId+", subject: "+subjectId);
      let request_param = {
        grade_id: gradeId,
        major_id: subjectId,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      console.log("Response of queryBanji: "+JSON.stringify(data["classes"]));
      return data["classes"];
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
