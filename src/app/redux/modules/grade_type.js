import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';

import { actions as appActions } from './app';
import { api as gradeApi } from '../../services/grade';

// action types
export const types = {
  FETCH_ALL_GRADE_TYPES: "GRADE/FETCH_ALL_TYPES"
};
// action creators
export const actions = {
  fetchAllGradeTypes: () => {
    return (dispatch, getState) => {
      try {
        if (shouldFetchAllGradeTypes(getState())) {
          dispatch(appActions.startRequest());
          const data = queryGradeTypes();
          dispatch(appActions.finishRequest());
          const {typeByIds, allTypes} = convertGradeTypesToPlain(data);
          dispatch(fetchAllGradeTypesSuccess(typeByIds, allTypes));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const queryGradeTypes = async () => {
  return await gradeApi.queryGradeTypes();
}

const shouldFetchAllGradeTypes = (state) => {
  const allTypes = getAllGradeTypeIds(state);
  return !allTypes || allTypes.size === 0;
}

const fetchAllGradeTypesSuccess = (typeByIds, allTypes) => {
  return ({
    type: types.FETCH_ALL_TYPES,
    typeByIds,
    allTypes,
  })
}

const convertGradeTypesToPlain = (types) => {
  let typeByIds = {};
  let allTypes = [];
  console.log("Got Grade types data: "+JSON.stringify(types));
  types.forEach(item => {
    typeByIds[item.id] = { ...item };
    allTypes.push(item.id);
  });
  return {
    typeByIds,
    allTypes,
  }
}
// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_ALL_GRADE_TYPES:
      return state.merge(action.typeByIds);
    default:
      return state;
  }
}

const allIds = (state = Immutable.fromJS([]), action) => {
  switch(action.type) {
    case types.FETCH_ALL_GRADE_TYPES:
      return Immutable.List(action.allTypes);
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
export const getAllGradeTypeIds = state => state.getIn(["grade_type", "allIds"]);

export const getGradeTypes = state => state.getIn(["grade_type", "byIds"]);

export const getGradeTypeById = (state, id) => state.getIn(["grade_type", "byIds", id]);
