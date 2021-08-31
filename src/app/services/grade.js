import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryGrades = async () => {
    try {
      const url = this.baseUrl+"/actual_grade_from_classes";
      console.log("Request url "+url);
      let response = await axios.post(url, {});
      console.log("Rsp: "+JSON.stringify(response));
      const { success, data, message } = response.data;
      if (!success) {
        if (!message) {
          throw new Error("服务器返回错误! 请联系管理员。");
        }
        else {
          throw new Error(message.message);
        }
      }
      //console.log(`Response of url: ${url} is ${JSON.stringify(data[0])}`);
      return data;
    } catch (error) {
      throw error;
    }
  }

  querySchoolYearWeek = async (date) => {
    try {
      const url = this.baseUrl+"/get_stage_week";
      console.log("Request url "+url);
      let response = await axios.post(url, {
        date: date
      });
      const { success, message, stage_id, week_idx } = response.data;
      if (!success) {
        if (!message) {
          throw new Error("服务器返回错误! 请联系管理员。");
        }
        else {
          throw new Error(message.message);
        }
      }
      return { year: stage_id, week: week_idx };
    } catch (error) {
      throw error;
    }
  }

  queryStageList = async () => {
    try {
      const url = this.baseUrl+"/stage";
      console.log("Request url "+url);
      let response = await axios.post(url);
      const { success, message, data } = response.data;
      if (!success) {
        if (!message) {
          throw new Error("服务器返回错误! 请联系管理员。");
        }
        else {
          throw new Error(message.message);
        }
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
