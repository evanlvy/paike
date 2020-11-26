import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as jiaoyanshiApi } from '../../services/jiaoyanshi';

// colors
const colors = [
  "gray.400", "red.400", "blue.400",
  "orange.300", "cyan.500", "purple.500",
  "pink.500", "teal.400", "green.800",
];

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
          const { centerByIds, centerIds, jiaoyanshiByIds, jiaoyanshiIds, jiaoyanshiByCenter } = convertJiaoyanshiToPlain(data);
          dispatch(fetchJiaoyanshiSuccess(centerIds, centerByIds, jiaoyanshiByCenter, jiaoyanshiByIds, jiaoyanshiIds));
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

const fetchJiaoyanshiSuccess = (centerIds, centerByIds, jiaoyanshiByCenter, jiaoyanshiByIds, jiaoyanshiIds) => {
  return ({
    type: types.FETCH_JIAOYANSHI,
    centerIds,
    centerByIds,
    jiaoyanshiByCenter,
    jiaoyanshiByIds,
    jiaoyanshiIds
  })
}

const convertJiaoyanshiToPlain = (data) => {
  let jiaoyanshiByIds = {};
  let jiaoyanshiIds = [];
  let jiaoyanshiByCenter = {};
  let centerByIds = {};
  let centerIds = [];
  //console.log("Got JiaoYanShi data: "+JSON.stringify(data));
  let colorIndex = 1;
  const jysList = data;
  jysList.forEach(item => {
    jiaoyanshiByIds[item.id] = { ...item, title: item.name};
    if (item.center_id > 0) {
      let item_color;
      if (!centerByIds[item.center_id]) {
        item_color = colors[colorIndex];
        colorIndex = (colorIndex+1) % colors.length;
        centerByIds[item.center_id] = {id: item.center_id, name: item.department_center, color: item_color};
        centerIds.push(""+item.center_id);
      } else {
        item_color = centerByIds[item.center_id].color;
      }
      jiaoyanshiByIds[item.id].color = item_color;
      if (!jiaoyanshiByCenter[item.center_id]) {
        jiaoyanshiByCenter[item.center_id] = [];
      }
      jiaoyanshiByCenter[item.center_id].push(""+item.id);
      jiaoyanshiIds.push(""+item.id);
    }
  });
  return {
    centerByIds,
    centerIds,
    jiaoyanshiByIds,
    jiaoyanshiIds,
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

const jiaoyanshiIds = (state = Immutable.fromJS([]), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return Immutable.List(action.jiaoyanshiIds);
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
  jiaoyanshiIds,
  jiaoyanshiByCenter,
  centerByIds,
  centerIds
});

export default reducer;

// selectors
export const getJiaoyanshi = state => state.getIn(["jiaoyanshi", "jiaoyanshiByIds"]);

export const getJiaoyanshiIds = state => state.getIn(["jiaoyanshi", "jiaoyanshiIds"]);

export const getJiaoyanshiByCenters = state => state.getIn(["jiaoyanshi", "jiaoyanshiByCenter"]);

export const getCenter = state => state.getIn(["jiaoyanshi", "centerByIds"]);

export const getCenterIds = state => state.getIn(["jiaoyanshi", "centerIds"]);

export const getAllJiaoyanshi = createSelector(
  [getJiaoyanshiIds, getJiaoyanshi],
  (jysIds, jys) => {
    let jysList = [];
    if (!jysIds || !jys) {
      return [];
    }
    jysIds.forEach(id => {
      const jysInfo = jys.get(id);
      jysList.push(jysInfo);
    });
    return jysList;
  }
)

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
