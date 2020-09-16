import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { getJiaoyanshiByAllCenter, getJiaoyanshi } from './jiaoyanshi';
import { api as centerApi } from '../../services/center';

// action types
export const types = {
  FETCH_ALL_CENTERS: "CENTER/FETCH_ALL_CENTERS"
};
// action creators
export const actions = {
  fetchAllCenters: () => {
    return (dispatch, getState) => {
      try {
        if (shouldFetchAllCenters(getState())) {
          dispatch(appActions.startRequest());
          const data = centerApi.queryCenters();
          dispatch(appActions.finishRequest());
          const {centerByIds, allCenters, jiaoyanshiByIds, jiaoyanshiByCenter} = convertCentersToPlain(data);
          dispatch(fetchAllCentersSuccess(centerByIds, allCenters, jiaoyanshiByIds, jiaoyanshiByCenter));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const shouldFetchAllCenters = (state) => {
  const allCenters = getAllCenterIds(state);
  return !allCenters || allCenters.size === 0;
}

const fetchAllCentersSuccess = (centerByIds, allCenters, jiaoyanshiByIds, jiaoyanshiByCenter) => {
  return ({
    type: types.FETCH_ALL_CENTERS,
    centerByIds,
    allCenters,
    jiaoyanshiByIds,
    jiaoyanshiByCenter,
  });
}

const convertCentersToPlain = (centers) => {
  let centerByIds = {};
  let allCenters = [];
  let jiaoyanshiByIds = {};
  let jiaoyanshiByCenter = {};
  console.log("Got Centers data: "+JSON.stringify(centers));
  centers.forEach(item => {
    centerByIds[item.id] = { ...item };
    allCenters.push(item.id);
    let jysList = [];
    item.jiaoyanshi.forEach((jys) => {
        jiaoyanshiByIds[jys.id] = { ...jys };
        jysList.push(jys.id);
    })
    jiaoyanshiByCenter[item.id] = jysList;
  });
  return {
    centerByIds,
    allCenters,
    jiaoyanshiByIds,
    jiaoyanshiByCenter,
  }
}
// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_ALL_CENTERS:
      return state.merge(action.centerByIds);
    default:
      return state;
  }
}

const allIds = (state = Immutable.fromJS([]), action) => {
  switch(action.type) {
    case types.FETCH_ALL_CENTERS:
      return Immutable.List(action.allCenters);
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  allIds,
});

export default reducer;

// selectors
export const getAllCenterIds = state => state.getIn(["center", "allIds"]);

export const getCenters = state => state.getIn(["center", "byIds"]);

export const getCenterById = (state, id) => state.getIn(["center", "byIds", id]);

export const getJiaoyanshiOfAllCenters = createSelector(
  [getAllCenterIds, getCenters, getJiaoyanshiByAllCenter, getJiaoyanshi],
  (centerList, centers, jysByCenters, jys) => {
    let jysInfo = centerList.map(id => {
      const center = centers.get(id);
      const jysByCenter = jysByCenters.get(id);
      //console.log("jysByCenters.get "+id);
      const jysInfoByCenters = jysByCenter.map(jysId => {
        return jys.get(jysId);
      });
      center["jiaoyanshi"] = jysInfoByCenters;
      //console.log("build center: "+JSON.stringify(center));
      return center;
    });
    jysInfo.length = centerList.size;
    return jysInfo;
  }
);
