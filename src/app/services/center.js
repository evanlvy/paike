import axios from 'axios';

import { server } from './common/info';

class Api {
  constructor() {
    this.baseUrl = server.url + "/api/v1";
  }

  queryCenters = () => {
    const data = [
      {
        id: "1", name: "基础分中心",
        jiaoyanshi: [{id: "1", name: "解剖"},
                     {id: "2", name: "病理"},
                     {id:"3", name: "生化"},
                     {id: "4", name: "生理"},
                     {id:"5", name: "微寄"},
                     {id: "6", name: "组胚"},
                     {id: "7", name: "生物遗传"},
                     {id: "8", name: "计算机"}],
      },
      {
        id: "2", name: "护理分中心",
        jiaoyanshi: [{id: "9", name: "基础护理"},
                     {id: "10", name: "内科护理"},
                     {id: "11", name: "外科护理"}]
      },
      {
        id: "3", name: "影像分中心",
        jiaoyanshi: [{id: "12", name: "影像诊断"},
                     {id: "13", name: "影像技术"}]
      },
      {
        id: "4", name: "临床分中心",
        jiaoyanshi: [{id: "14", name: "内科"},
                     {id: "15", name: "外科"},
                     {id: "16", name: "妇科"},
                     {id: "17", name: "儿科"},
                     {id: "18", name: "五官"},
                     {id: "19", name: "眼视光"},
                     {id: "20", name: "康复"},
                     {id: "21", name: "中医"},
                     {id: "22", name: "预防"}]
      },
      {
        id: "5", name: "药学分中心",
        jiaoyanshi: [{id:"23", name: "药理"}, {id:"24", name: "化学"}, {id: "25", name: "药剂"}, {id:"26", name: "生药"}]
      },
      {
        id: "6", name: "医疗技术分中心",
        jiaoyanshi: [{id:"27", name: "检验"}, {id:"28", name: "美容"}]
      },
      {
        id: "7", name: "社科部",
        jiaoyanshi: [{id:"29", name: "概论"}, {id:"30", name: "基础"}]
      },
    ];
    try {
      const url = this.baseUrl+"/centers";
      console.log("Request url "+url);
      /*let response = await axios.post(url);
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
