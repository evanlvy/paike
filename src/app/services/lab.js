import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryLabs = async (centerId, stage_id, week) => {
    try {
      const url = this.baseUrl+"/lab";
      console.log("Request url "+url+" with center: "+centerId+", stage_id: "+stage_id+", week: "+week);
      let request_param = {
        stage_id: stage_id,
        dep_id: centerId,
        begin: {
          week: week,
          day: 1,
        },
        end: {
          week: week,
          day: 7,
        }
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.labs;
    } catch (error) {
      throw error;
    }
  }

  queryLabsByLabItem = async (labItemId, stage_id, week) => {
    try {
      const url = this.baseUrl+"/lab";
      console.log("Request url "+url+" with labItem: "+labItemId+", stage_id: "+stage_id+", week: "+week);
      let request_param = {
        stage_id: stage_id,
        item_id: labItemId,
        begin: {
          week: week,
          day: 1,
        },
        end: {
          week: week,
          day: 7,
        }
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.labs;
    } catch (error) {
      throw error;
    }
  }

  queryLabBuildings = () => {
    const data = [
      {id: "1", name: "A栋"},
      {id: "2", name: "B栋"},
      {id: "3", name: "C栋"},
      {id: "4", name: "D栋"},
      {id: "5", name: "E栋"},
      {id: "6", name: "F栋"},
      {id: "7", name: "L栋"},
    ]
    try {
      const url = this.baseUrl+"/lab_buildings";
      console.log("Request url "+url);
      /*let request_param = {
        center: centerId,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data;*/
      return data;
    } catch (error) {
      throw error;
    }
  }
}

export const api = new Api();
