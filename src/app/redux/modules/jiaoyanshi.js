import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as jiaoyanshiApi } from '../../services/jiaoyanshi';

// action types
export const types = {
  FETCH_JIAOYANSHI: "JIAOYANSHI/FETCH_JIAOYANSHI"
};

// actions
export const actions = {
  fetchJiaoyanshi: () => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchJiaoyanshi(getState())) {
          dispatch(appActions.startRequest());
          const data = await jiaoyanshiApi.queryJiaoyanshi();
          dispatch(appActions.finishRequest());
          const { centerByIds, centerIds, jiaoyanshiByIds, jiaoyanshiByCenter } = convertJiaoyanshiToPlain(data);
          dispatch(fetchJiaoyanshiSuccess(centerIds, centerByIds, jiaoyanshiByCenter, jiaoyanshiByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const shouldFetchJiaoyanshi = (state) => {
  const jiaoyanshiByIds = getJiaoyanshi(state);
  return !jiaoyanshiByIds || jiaoyanshiByIds.size === 0;
}

const fetchJiaoyanshiSuccess = (centerIds, centerByIds, jiaoyanshiByCenter, jiaoyanshiByIds) => {
  return ({
    type: types.FETCH_JIAOYANSHI,
    centerIds,
    centerByIds,
    jiaoyanshiByCenter,
    jiaoyanshiByIds
  })
}

const convertJiaoyanshiToPlain = (data) => {
  let jiaoyanshiByIds = {};
  let jiaoyanshiByCenter = {};
  let centerByIds = {};
  let centerIds = [];
  //console.log("Got JiaoYanShi data: "+JSON.stringify(data));
  const jysList = data;
  jysList.forEach(item => {
    jiaoyanshiByIds[item.id] = { ...item };
    if (item.center_id > 0) {
      if (!centerByIds[item.center_id]) {
        centerByIds[item.center_id] = {id: item.center_id, name: item.department_center};
        centerIds.push(""+item.center_id);
      }
      if (!jiaoyanshiByCenter[item.center_id]) {
        jiaoyanshiByCenter[item.center_id] = [];
      }
      jiaoyanshiByCenter[item.center_id].push(""+item.id);
    }
  });
  return {
    centerByIds,
    centerIds,
    jiaoyanshiByIds,
    jiaoyanshiByCenter
  };
}
// reducers
const jiaoyanshiByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return state.merge(action.jiaoyanshiByIds);
    default:
      return state;
  }
}

const jiaoyanshiByCenter = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return state.merge(action.jiaoyanshiByCenter);
    default:
      return state;
  }
}

const centerByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return state.merge(action.centerByIds);
    default:
      return state;
  }
}

const centerIds = (state = Immutable.fromJS([]), action) => {
  switch(action.type) {
    case types.FETCH_JIAOYANSHI:
      return Immutable.List(action.centerIds);
    default:
      return state;
  }
}

const reducer = combineReducers({
  jiaoyanshiByIds,
  jiaoyanshiByCenter,
  centerByIds,
  centerIds
});

export default reducer;

// selectors
export const getJiaoyanshi = state => state.getIn(["jiaoyanshi", "jiaoyanshiByIds"]);

export const getJiaoyanshiById = (state, id) => state.getIn(["jiaoyanshi", "jiaoyanshiByIds", id]);

export const getJiaoyanshiByCenters = (state) => state.getIn(["jiaoyanshi", "jiaoyanshiByCenter"]);

export const getCenter = state => state.getIn(["jiaoyanshi", "centerByIds"]);

export const getCenterById = (state, id) => state.getIn(["jiaoyanshi", "byIds", id]);

export const getCenterIds = state => state.getIn(["jiaoyanshi", "centerIds"]);

export const getJiaoyanshiOfAllCenters = createSelector(
  [getCenterIds, getCenter, getJiaoyanshiByCenters, getJiaoyanshi],
  (centerIds, centers, jysByCenters, jys) => {
    let jysInfo = [];
    if (!centerIds || !centers || !jysByCenters || !jys) {
      return [];
    }
    centerIds.forEach(id => {
      const center = centers.get(id);
      const jysByCenter = jysByCenters.get(id);
      //console.log("jysByCenters.get "+id);
      let jysInfoByCenters = [];
      jysByCenter.forEach(jysId => {
        jysInfoByCenters.push(jys.get(jysId));
      });
      center["jiaoyanshi"] = jysInfoByCenters;
      //console.log("build center: "+JSON.stringify(center));
      jysInfo.push(center);
    });
    return jysInfo;
  }
);
