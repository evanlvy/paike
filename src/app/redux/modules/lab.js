import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';

import { actions as appActions } from './app';
import { api as labApi } from '../../services/lab';

// action types
export const types = {
  FETCH_LABS: "LAB/FETCH_LABS",
};

// actions
export const actions = {
  fetchLabs: (centerId) => {
    return (dispatch, getState) => {
      try {
        if (shouldFetchLabs(centerId, getState())) {
          dispatch(appActions.startRequest());
          const data = labApi.queryLabs(centerId);
          dispatch(appActions.finishRequest());
          const { labByIds, labIds } = convertLabsToPlain(data);
          dispatch(fetchLabsSuccess(centerId, labIds, labByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  }
}

const shouldFetchLabs = (centerId, state) => {
  const labIds = getLabsByCenter(state, centerId);
  return !labIds;
}

const fetchLabsSuccess = (centerId, labIds, labByIds) => {
  return ({
    type: types.FETCH_LABS,
    centerId,
    labIds,
    labByIds
  })
}

const convertLabsToPlain = (labs) => {
  let labByIds = {};
  let labIds = [];
  console.log("Got Labs data: "+JSON.stringify(labs));
  labs.forEach(item => {
    labByIds[item.id] = { ...item };
    labIds.push(item.id);
  });
  return {
    labByIds,
    labIds
  };
}
// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LABS:
      return state.merge(action.labByIds);
    default:
      return state;
  }
}

const byCenter = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LABS:
      return state.merge({[action.centerId]: action.labIds});
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  byCenter,
});

export default reducer;

// selectors
export const getLabs = state => state.getIn(["lab", "byIds"]);

export const getLabById = (state, id) => state.getIn(["lab", "byIds", id]);

export const getLabsByCenter = (state, centerId) => state.getIn(["lab", "byCenter", centerId]);
