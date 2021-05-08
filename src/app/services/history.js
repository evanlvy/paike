import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryHistory = async (stage_id, week) => {
    try {
      const url = this.baseUrl+"/history";
      console.log("Request url "+url+"with stage_id: "+stage_id+", week: "+week);
      let request_param = {
        stage: stage_id,
        week: week
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      //console.log(`Response of url: ${url} is ${JSON.stringify(data[0])}`);
      return data.history;
    } catch (error) {
      throw error;
    }
  }

  queryHistoryByTime = async (page_idx, page_size) => {
    try {
      const url = this.baseUrl+"/history";
      console.log("Request url "+url+"with page index: "+page_idx+", size: "+page_size);
      let request_param = {
        pageIdx: page_idx,
        pageSize: page_size
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      //console.log(`Response of url: ${url} is ${JSON.stringify(data[0])}`);
      return {list: data.history, totalPage: data.totalPage, count: data.count};
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
