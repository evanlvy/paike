import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryDocList = async (department_id, stage=0, items_per_page=0, page_id=0) => {
    try {
      const url = this.baseUrl+"/get_progressgroup";
      console.log("Request url "+url+" with stage: "+stage+" department_id: "+department_id);
      let request_param = {
        stage_id: stage,
        department_id: department_id,
        items_per_page: items_per_page,
        page_id: page_id,
      };
      if (stage_id <= 0) {
        delete request_param.stage_id;
      }
      if (items_per_page <= 0) {
        delete request_param.items_per_page;
      }
      if (page_id <= 0) {
        delete request_param.page_id;
      }
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.groups;
    } catch (error) {
      throw error;
    }
  }

  queryDocListByKeyword = async (keyword, department_id=0, items_per_page=0, page_id=0) => {
    try {
      const url = this.baseUrl+"/get_progressgroup";
      console.log("Request url "+url+" with stage: "+stage+" department_id: "+department_id);
      let request_param = {
        name: keyword,
        department_id: department_id,
        items_per_page: items_per_page,
        page_id: page_id,
      };
      if (department_id <= 0) {
        delete request_param.department_id;
      }
      if (items_per_page <= 0) {
        delete request_param.items_per_page;
      }
      if (page_id <= 0) {
        delete request_param.page_id;
      }
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.groups;
    } catch (error) {
      throw error;
    }
  }

  queryDoc = async (doc_id) => {
    try {
      const url = this.baseUrl+"/get_progressdoc";
      console.log("Request url "+url+" with doc_id: "+doc_id);
      let request_param = {
        doc_id: stage,
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

  addDoc = async (props_map) => {
    // $params_required = ['course_name', 'department_id', 'description', 'total_hours', 'theory_hours', 'lab_hours'];
    // $params_optional = ['short_name', 'flex_hours', 'textbook', 'exam_type', 'comments'];
    try {
      const url = this.baseUrl+"/add_progressdoc";
      console.log("Request url "+url+" with doc_prop: "+JSON.stringify(props_map));
      let request_param = {...props_map};
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

  deleteDoc = async (doc_id) => {
    try {
      const url = this.baseUrl+"/del_progressdoc";
      console.log("Request url "+url+" with doc_id: "+doc_id);
      let request_param = {
        doc_id: stage,
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

  updateDocProps = async (docId, arrayDiff) => {
    try {
      const url = this.baseUrl+"/set_progressdoc";
      console.log("Request url "+url+" with rowId: "+docId+" Diff: "+JSON.stringify(arrayDiff));
      let request_param = {
        id: docId,
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

  updateDocRow = async (rowId, arrayDiff) => {
    try {
      const url = this.baseUrl+"/set_progressitem";
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

  addDocRow = async (props_map) => {
    try {
      const url = this.baseUrl+"/add_progressitem";
      console.log("Request url "+url+" with Input: "+JSON.stringify(props_map));
      let response = await axios.post(url, props_map);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  deleteDocRow = async (rowId) => {
    try {
      const url = this.baseUrl+"/del_progressitem";
      console.log("Request url "+url+" with rowId: "+rowId);
      let request_param = {
        id: rowId,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  updateLabItem = async (itemId, arrayDiff) => {
    try {
      const url = this.baseUrl+"/set_labitem";
      console.log("Request url "+url+" with itemId: "+itemId+" Diff: "+JSON.stringify(arrayDiff));
      let request_param = {
        id: itemId,
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

  addLabItem = async (props_map) => {
    try {
      const url = this.baseUrl+"/add_labitem";
      console.log("Request url "+url+" with input: "+JSON.stringify(props_map));
      let response = await axios.post(url, props_map);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  deleteLabItem = async (itemId) => {
    try {
      const url = this.baseUrl+"/del_labitem";
      console.log("Request url "+url+" with itemId: "+itemId);
      let request_param = {
        id: itemId,
      };
      let response = await axios.post(url, request_param);
      const { success, data, message } = response.data;
      if (!success) {
        throw new Error(message.message);
      }
      return data.id;
    } catch (error) {
      throw error;
    }
  }
  
  getLabItems = async (itemId, keyword="", course_name="", department_id=0, items_per_page=0, page_id=0) => {
    try {
      const url = this.baseUrl+"/get_labitem";
      console.log("Request url "+url+" with itemId: "+itemId);
      let request_param = {
        id: itemId,
      };
      if (itemId <= 0) {
        request_param = {
          department_id: department_id,
          description: course_name,
          name: keyword,
          items_per_page: items_per_page,
          page_id: page_id,
        }
        if (keyword <= 0) {
          delete request_param.name;
        }
        if (course_name <= 0) {
          delete request_param.description;
        }
        if (department_id <= 0) {
          delete request_param.department_id;
        }
        if (items_per_page <= 0) {
          delete request_param.items_per_page;
        }
        if (page_id <= 0) {
          delete request_param.page_id;
        }
        if (request_param === {}) {
          throw new Error("Missing parameter!");
        }
      }
      let response = await axios.post(url, request_param);
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
