import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  querySubjects = (gradeTypeId, gradeId) => {
    const data = [
      {id: "1", name: "护理"},
      {id: "2", name: "助产"},
      {id: "3", name: "临床医学"},
      {id: "4", name: "临床医学\n病理"},
      {id: "5", name: "全科医学"},
      {id: "6", name: "卫生信息\n管理"},
      {id: "7", name: "医学影像"},
      {id: "8", name: "影像技术"},
      {id: "9", name: "放射治疗\n技术"},
      {id: "10", name: "医学美容"},
    ];
    try {
      const url = this.baseUrl+"/subjects";
      console.log("Request url "+url+" with grade type: "+gradeTypeId+", grade: "+gradeId);
      /*let request_param = {
        gradeType: gradeTypeId,
        grade: gradeId,
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
