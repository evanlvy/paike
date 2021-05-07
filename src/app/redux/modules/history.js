import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { DATA_EXPIRATION_TIME } from './common/info';
import { actions as appActions } from './app';
import { api as historyApi } from '../../services/history';

// action types
export const types = {
  FETCH_HISTORY: "BANJI/FETCH_HISTORY"
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

// reducers
const historyByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_HISTORY:
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

const reducer = combineReducers({
  historyByIds,
  historyBySched,
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
