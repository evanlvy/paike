import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryLiLunByBanji = async (banjiIds, stage_id, weekStart, weekEnd) => {
    try {
      const url = this.baseUrl+"/theory";
      console.log("Request url "+url+" with banji: "+JSON.stringify(banjiIds)+", stage_id: "+stage_id+", week from "+weekStart+" to "+weekEnd);
      let request_param = {
        stage_id: stage_id,
        class_id: banjiIds.join(),
        begin: weekStart,
        end: weekEnd-1,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      //console.log("Response of queryLiLunByBanji: "+JSON.stringify(data["schedules"]));
      return data["schedules"];
    } catch (error) {
      throw error;
    }
  }

  queryKeBiaoByBanji = async (banjiIds, stage_id, weekStart, weekEnd) => {
    try {
      const url = this.baseUrl+"/allschedule";
      console.log("Request url "+url+" with banji: "+JSON.stringify(banjiIds)+", stage_id: "+stage_id+", week from "+weekStart+" to "+weekEnd);
      let request_param = {
        stage_id: stage_id,
        class_id: banjiIds.join(),
        begin: weekStart,
        end: weekEnd-1,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      //console.log("Response of queryKeBiaoByBanji: "+JSON.stringify(data["schedules"]));
      return data["schedules"];
    } catch (error) {
      throw error;
    }
  }

  queryShiXunByJiaoyanshi = async (jysIds, stage_id, week) => {
    try {
      const url = this.baseUrl+"/experimentSchedule";
      console.log("Request url "+url+" with jys: "+JSON.stringify(jysIds)+", stage_id: "+stage_id+", week: "+week);
      let request_param = {
        stage_id: stage_id,
        dep_id: jysIds.join(),
        week: week
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      //console.log("Response of queryShiXunByJiaoyanshi: "+JSON.stringify(data["schedules"]));
      return data["schedules"];
    } catch (error) {
      throw error;
    }
  }

  updateKebiao = async (kebiao) => {
    try {
      const url = this.baseUrl+"/updateschedule";
      console.log("Request url "+url+" with kebiao: "+JSON.stringify(kebiao));
      let request_param = {
        id: kebiao.id,
        week: kebiao.week,
        day_in_week: kebiao.day_in_week,
        index: kebiao.index,
        hours: kebiao.hours,
        lab_teacher_id: kebiao.lab_teacher_id,
        lab_id: kebiao.lab_id
      };
      if (kebiao.comments) {
        request_param["comments"] = kebiao.comments;
      }
      console.log("Request params: "+JSON.stringify(request_param));
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      console.log("Response of updateKebiao: "+JSON.stringify(data["updates"]));
      return data["updates"];
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
