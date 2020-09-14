import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';

import { actions as appActions } from './app';
import { types as gradeTypeActionTypes } from './grade_type';
import { api as gradeApi } from '../../services/grade';

// action types
export const types = {
  FETCH_GRADES_BY_TYPE: "GRADE/FETCH_GRADES_BY_TYPE"
};
// actions
export const actions = {
  fetchGrades: (typeId) => {
    return (dispatch, getState) => {
      try {
        if (shouldFetchGrades(typeId, getState())) {
          dispatch(appActions.startRequest());
          const data = gradeApi.queryGrades(typeId);
          dispatch(appActions.finishRequest());
          const { gradeByIds, gradeIds } = convertGradesToPlain(data);
          dispatch(fetchGradesSuccess(typeId, gradeByIds, gradeIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const shouldFetchGrades = (typeId, state) => {
  const gradeIds = getGradeByType(state, typeId);
  return !gradeIds;
}

const fetchGradesSuccess = (typeId, gradeByIds, gradeIds) => {
  return ({
    type: types.FETCH_GRADES_BY_TYPE,
    typeId,
    gradeIds,
    gradeByIds,
  })
}

const convertGradesToPlain = (grades) => {
  let gradeByIds = {};
  let gradeIds = [];
  console.log("Got Grade data: "+JSON.stringify(grades));
  grades.forEach(item => {
    gradeByIds[item.id] = { ...item };
    gradeIds.push(item.id);
  });
  return {
    gradeByIds,
    gradeIds
  };
}
// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case gradeTypeActionTypes.FETCH_ALL_GRADE_TYPES:
      return state.merge(action.gradeByIds);
    case types.FETCH_GRADES_BY_TYPE:
      return state.merge(action.gradeByIds);
    default:
      return state;
  }
}

const byType = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case gradeTypeActionTypes.FETCH_ALL_GRADE_TYPES:
      console.log("Grade, byType, got data: "+JSON.stringify(action.gradeByTypes));
      return state.merge(action.gradeByTypes);
    case types.FETCH_GRADES_BY_TYPE:
      return state.merge({[action.typeId]: action.gradeIds});
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  byType,
});

export default reducer;

// selectors
export const getGrades = state => state.getIn(["grade", "byIds"]);

export const getGradeById = (state, id) => state.getIn(["grade", "byIds", id]);

export const getGradeByAllType = (state) => state.getIn(["grade", "byType"]);

export const getGradeByType = (state, typeId) => state.getIn(["grade", "byType", typeId]);
