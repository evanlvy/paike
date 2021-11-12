import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryTeachersOccupied = async (jysId, stage_id, week) => {
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

  queryTeachers = async (jysId=null, labDivisionId=null, id=null, name=null, email=null, username=null) => {
    try {
      const url = this.baseUrl+"/get_teachers";
      console.log("Request url "+url+" with jys: "+jysId+", user_id: "+id+", name: "+name);
      let request_param = {};
      if (jysId) {
        request_param["department_id"] = jysId;
      }
      else if (labDivisionId) {
        request_param["labdivision_id"] = labDivisionId;
      }
      else if (id) {
        request_param["id"] = id;
      }
      else if (name) {
        request_param["name"] = name;
      }
      else if (email) {
        request_param["email"] = email;
      }
      else if (username) {
        request_param["username"] = username;
      }
      else {
        throw new Error("No parameter found when trying to get teachers!"); 
      }
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
