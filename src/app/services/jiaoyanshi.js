import axios from 'axios';

import { server } from './common/info';
import { convertDFtoArray } from '../redux/modules/common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryJiaoyanshi = async (in_brief=false, id=0, center_id=0) => {
    try {
      const url = this.baseUrl+"/department";
      console.log("Request url "+url);
      let params = {};
      if (id > 0) params['id'] = id;
      if (center_id > 0) params['center_id'] = center_id;
      if (in_brief) params['brief'] = true;
      let response = await axios.post(url, params);
      const { success, data, message } = response.data;
      if (!success) {
        if (!message) {
          throw new Error("服务器返回错误! 请联系管理员。");
        }
        else {
          throw new Error(message.message);
        }
      }
      if (!in_brief && data && data.hasOwnProperty('1')) {
        return Object.values(data);
      }
      if (data.hasOwnProperty('dfcol') && data.hasOwnProperty('dfdata')) {
        return convertDFtoArray(data);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
