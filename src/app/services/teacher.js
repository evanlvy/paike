import axios from 'axios';

import { server } from './common/info';
import { allInChinese } from '../redux/modules/common/info';

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

  searchTeachers = async (keyword="", name=null, email=null, department_id=0, labdivision_id=0) => {
    try {
      const url = this.baseUrl+"/users";
      console.log("Request url "+url+" with keyword: "+keyword+", dep_id: "+department_id+", lab_id: "+labdivision_id);
      let request_param = {};
      if (name) {
        request_param["name"] = name;
      } else if (email) {
        request_param["email"] = email;
      } else if (department_id > 0) {
        request_param['department_id'] = department_id;
      } else if (labdivision_id > 0) {
        request_param['labdivision_id'] = labdivision_id;
      } else if (typeof(keyword)==='string' && keyword.length >= 2) {
        let _keyword = keyword.toLowerCase();
        if (_keyword[0] >= 'a' && _keyword[0] <= 'z') {
          // Query by email
          request_param["email"] = _keyword;
        } else if (allInChinese(keyword)) {
          request_param["name"] = keyword;
        }
      }
      if (Object.keys(request_param).length <= 0) {
        throw new Error("No sufficient parameter found when trying to get teacher list!"); 
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
