import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';

import { actions as appActions } from './app';
import { api as jiaoyanshiApi } from '../../services/jiaoyanshi';

// action types
export const types = {
  FETCH_JIAOYANSHI: "JIAOYANSHI/FETCH_JIAOYANSHI"
};

// actions
export const actions = {
  fetchJiaoyanshi: (centerId) => {
    return (dispatch, getState) => {
      try {
        if (shouldFetchJiaoyanshi(centerId, getState())) {
          dispatch(appActions.startRequest());
          const data = queryJiaosYanShi(centerId);
          dispatch(appActions.finishRequest());
          const { jiaoyanshiByIds, jiaoyanshiIds } = convertJiaoyanshiToPlain(data);
          dispatch(fetchJiaoyanshiSuccess(centerId, jiaoyanshiIds, jiaoyanshiByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const queryJiaosYanShi = async (centerId) => {
  return await jiaoyanshiApi.queryJiaoyanshi(centerId);
}

const shouldFetchJiaoyanshi = (centerId, state) => {
  const jiaoyanshiIds = getJiaoyanshiByCenter(state, centerId);
  return !jiaoyanshiIds;
}

const fetchJiaoyanshiSuccess = (centerId, jiaoyanshiIds, jiaoyanshiByIds) => {
  return ({
    type: types.FETCH_JIAOYANSHI,
    centerId,
    jiaoyanshiIds,
    jiaoyanshiByIds
  })
}

const convertJiaoyanshiToPlain = (jiaoyanshi) => {
  let jiaoyanshiByIds = {};
  let jiaoyanshiIds = [];
  console.log("Got JiaoYanShi data: "+JSON.stringify(jiaoyanshi));
  jiaoyanshi.forEach(item => {
    jiaoyanshiByIds[item.id] = { ...item };
    jiaoyanshiIds.push(item.id);
  });
  return {
    jiaoyanshiByIds,
    jiaoyanshiIds
  };
}
// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return state.merge(action.jiaoyanshiByIds);
    default:
      return state;
  }
}

const byCenter = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return state.merge({[action.centerId]: action.jiaoyanshiIds});
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
export const getJiaoyanshi = state => state.getIn(["jiaoyanshi", "byIds"]);

export const getJiaoyanshiById = (state, id) => state.getIn(["jiaoyanshi", "byIds", id]);

export const getJiaoyanshiByCenter = (state, centerId) => state.getIn(["jiaoyanshi", "byCenter", centerId]);
