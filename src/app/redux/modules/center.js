import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';

import { actions as appActions } from './app';
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
          const data = queryCenters();
          dispatch(appActions.finishRequest());
          const {centerByIds, allCenters} = convertCentersToPlain(data);
          dispatch(fetchAllCentersSuccess(centerByIds, allCenters));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const queryCenters = async () => {
  return await centerApi.queryCenters();
}

const shouldFetchAllCenters = (state) => {
  const allCenters = getAllCenterIds(state);
  return !allCenters || allCenters.size === 0;
}

const fetchAllCentersSuccess = (centerByIds, allCenters) => {
  return ({
    type: types.FETCH_ALL_CENTERS,
    centerByIds,
    allCenters
  });
}

const convertCentersToPlain = (centers) => {
  let centerByIds = {};
  let allCenters = [];
  console.log("Got Centers data: "+JSON.stringify(centers));
  centers.forEach(item => {
    centerByIds[item.id] = { ...item };
    allCenters.push(item.id);
  });
  return {
    centerByIds,
    allCenters,
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
