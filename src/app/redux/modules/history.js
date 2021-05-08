import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { DATA_EXPIRATION_TIME } from './common/info';
import { actions as appActions } from './app';
import { api as historyApi } from '../../services/history';

// action types
export const types = {
  FETCH_HISTORY: "HISTORY/FETCH_HISTORY",
  FETCH_HISTORY_BYTIME: "HISTORY/FETCH_HISTORY_BYTIME"
};

// actions
export const actions = {
  fetchHistory: (year, week) => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchHistory(year, week, getState())) {
          dispatch(appActions.startRequest());
          const data = await historyApi.queryHistory(year, week);
          dispatch(appActions.finishRequest());
          const { historyBySched, historyByIds } = convertHistoryBySchedToPlain(data, year, week);
          dispatch(fetchHistoryBySchedSuccess(historyBySched, historyByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
  fetchHistoryByTime: (page_idx, page_size) => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchHistoryByTime(page_idx, page_size, getState())) {
          dispatch(appActions.startRequest());
          const data = await historyApi.queryHistoryByTime(page_idx, page_size);
          dispatch(appActions.finishRequest());
          const { historyList, historyInfo, historyByIds } = convertHistoryByTimeToPlain(data.list, data.totalPage, data.count, getState());
          dispatch(fetchHistoryByTimeSuccess(historyList, historyInfo, historyByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

export const buildHistorySchedId = (year, week) => {
  return ""+year+(week < 10 ? "0"+week : ""+week);
}

const shouldFetchHistory = (year, week, state) => {
  console.log(`shouldFetchHistory, year: ${year}, week: ${week}`);
  const historySchedId = buildHistorySchedId(year, week);
  const historyBySched = state.getIn(["history", "historyBySched", historySchedId]);
  if (!historyBySched || Date.now() - historyBySched.update > DATA_EXPIRATION_TIME) {
    console.log(`shouldFetchHistory, id: ${historySchedId}`);
    return true;
  }
  console.log("shouldFetchHistory: no need fetch data");
  return false;
}

const convertHistoryBySchedToPlain = (historyInfoList, year, week) => {
  let historyBySched = {}, historyByIds = {}, historyList = [];
  historyInfoList.forEach(historyItem => {
    historyByIds[historyItem.id] = { ...historyItem };
    historyList.push(""+historyItem.id);
  });
  const historySchedId = buildHistorySchedId(year, week);
  historyBySched[historySchedId] = { list: historyList, update: Date.now() };
  return {historyBySched, historyByIds};
}

const fetchHistoryBySchedSuccess = (historyBySched, historyByIds) => {
  return {
    type: types.FETCH_HISTORY,
    historyBySched,
    historyByIds,
  };
}

const shouldFetchHistoryByTime = (page_idx, page_size, state) => {
  console.log(`shouldFetchHistoryByTime, pageIdx: ${page_idx}, pageSize: ${page_size}`);
  const historyByTimeList = state.getIn(["history", "historyByTimeList"]).toJS();
  if (page_idx*page_size > historyByTimeList.length) {
    console.log("shouldFetchHistoryByTime");
    return true;
  }
  console.log("shouldFetchHistoryByTime, no need fetch data");
  return false;
}

const convertHistoryByTimeToPlain = (historyInfoList, totalPage, count, state) => {
  let historyByIds = {};
  let historyInfo = { totalPage: totalPage, count: count };
  let historyList = state.getIn(["history", "historyByTimeList"]).toJS();
  historyInfoList.forEach(historyItem => {
    if (!historyList.includes(""+historyItem.id)) {
      historyByIds[historyItem.id] = { ...historyItem };
      historyList.push(""+historyItem.id);
    }
  });
  return {historyList, historyInfo, historyByIds};
}

const fetchHistoryByTimeSuccess = (historyList, historyInfo, historyByIds) => {
  return {
    type: types.FETCH_HISTORY_BYTIME,
    historyList,
    historyInfo,
    historyByIds,
  };
}

// reducers
const historyByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_HISTORY:
    case types.FETCH_HISTORY_BYTIME:
      return state.merge(action.historyByIds);
    default:
      return state;
  }
}

const historyBySched = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_HISTORY:
      return state.merge(action.historyBySched);
    default:
      return state;
  }
}

const historyByTimeList = (state = Immutable.fromJS([]), action) => {
  switch (action.type) {
    case types.FETCH_HISTORY_BYTIME:
      return Immutable.List(action.historyList);
    default:
      return state;
  }
}

const historyByTimeInfo = (state = Immutable.fromJS({}), action) => {
  switch(action.type) {
    case types.FETCH_HISTORY_BYTIME:
      return state.merge(action.historyInfo);
    default:
      return state;
  }
}

const reducer = combineReducers({
  historyByIds,
  historyBySched,
  historyByTimeList,
  historyByTimeInfo
});

export default reducer;

// selectors
export const getHistory = state => state.getIn(["history", "historyByIds"]);

export const getHistoryById = (state, id) => state.getIn(["history", "historyByIds", id]);

export const getHistoryBySched = state => state.getIn(["history", "historyBySched"]);
export const getHistoryInfoBySched = createSelector(
  [getHistory, getHistoryBySched],
  (history, historyBySched) => {
    const historySchedIds = Object.keys(historyBySched.toJS());
    let result = {};
    historySchedIds.forEach(historySchedId => {
      const historyBySchedId = historyBySched.get(historySchedId);
      const historyIds = historyBySchedId.list;
      let historyList = [];
      historyIds.forEach(historyId => {
        let historyInfo = {...history.get(historyId)};
        historyList.push(historyInfo);
      });
      result[historySchedId] = historyList;
    });
    //console.log("getHistoryInfoBySched: "+JSON.stringify(result));
    return result;
  }
);

export const getHistoryByTimeInfo = state => state.getIn(["history", "historyByTimeInfo"]);
export const getHistoryByTime = state => state.getIn(["history", "historyByTimeList"]);
export const getHistoryInfoByTime = createSelector(
  [getHistory, getHistoryByTimeInfo, getHistoryByTime],
  (history, historyInfo, historyList) => {
    let result = {...historyInfo.toJS()}, list = [];
    historyList.forEach(historyId => {
      let historyItem = {...history.get(historyId)};
      list.push(historyItem);
    });
    result["list"] = list;
    console.log("getHistoryByTime: "+JSON.stringify(result));
    return result;
  }
)
