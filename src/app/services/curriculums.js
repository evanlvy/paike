import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryCurriculums = async (stage, department_id=-1, teacher_id=-1, major_id=-1, class_id=-1, items_per_page=-1, page_id=-1) => {
    try {
      const url = this.baseUrl+"/get_curriculums";
      console.log("Request url "+url+" with stage: "+stage+", department: "+department_id+", teacher: "+teacher_id+", class_id: "+class_id);
      let input_param = {
        stage_id: stage,
        department_id: department_id,
        class_id: class_id,
        major_id: major_id,
        user_id: teacher_id,
        items_per_page: items_per_page,
        page_id: page_id,
      };
      let request_param = {};
      Object.keys(input_param).forEach(key => {
        if (input_param[key] >= 0) {
          request_param[key] = input_param[key];
        }
      });
      let response = await axios.post(url, request_param);
      const { success, data, total, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  updateRow = async (rowId, arrayDiff) => {
    try {
      const url = this.baseUrl+"/set_curriculum";
      console.log("Request url "+url+" with rowId: "+rowId+" Diff: "+JSON.stringify(arrayDiff));
      let request_param = {
        id: rowId,
      };
      let response = await axios.post(url, Object.assign(request_param, arrayDiff));
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.id;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
