import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryLabs = async (centerId) => {
    try {
      const url = this.baseUrl+"/labs";
      console.log("Request url "+url+" with center: "+centerId);
      let request_param = {
        center: centerId,
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
