import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { getGradeByAllType, getGrades } from './grade';
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
          const data = gradeApi.queryGradeTypes();
          dispatch(appActions.finishRequest());
          const {typeByIds, allTypes, gradeByIds, gradeByTypes} = convertGradeTypesToPlain(data);
          dispatch(fetchAllGradeTypesSuccess(typeByIds, allTypes, gradeByIds, gradeByTypes));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const shouldFetchAllGradeTypes = (state) => {
  const allTypes = getAllGradeTypeIds(state);
  return !allTypes || allTypes.size === 0;
}

const fetchAllGradeTypesSuccess = (typeByIds, allTypes, gradeByIds, gradeByTypes) => {
  return ({
    type: types.FETCH_ALL_GRADE_TYPES,
    typeByIds,
    allTypes,
    gradeByIds,
    gradeByTypes,
  })
}

const convertGradeTypesToPlain = (types) => {
  let typeByIds = {};
  let allTypes = [];
  let gradeByIds = {};
  let gradeByTypes = {};
  //console.log("Got Grade types data: "+JSON.stringify(types));
  types.forEach(item => {
    typeByIds[item.id] = { ...item };
    allTypes.push(item.id);
    let grades = [];
    item.grades.forEach(grade => {
      gradeByIds[grade.id] = { ...grade };
      grades.push(grade.id);
    })
    gradeByTypes[item.id] = grades;
  });
  return {
    typeByIds,
    allTypes,
    gradeByIds,
    gradeByTypes,
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
export const getGradeTypes = state => state.getIn(["grade_type", "byIds"]);

export const getGradeTypeById = (state, id) => state.getIn(["grade_type", "byIds", id]);

export const getAllGradeTypeIds = state => state.getIn(["grade_type", "allIds"]);

export const getGradesOfAllGradeTypes = createSelector(
  [getAllGradeTypeIds, getGradeTypes, getGradeByAllType, getGrades],
  (gradeTypeIds, gradeTypes, gradesByTypes, grades) => {
    let gradeInfo = gradeTypeIds.map(id => {
      const type = gradeTypes.get(id);
      const gradesByType = gradesByTypes.get(id);
      //console.log("gradesByTypes.get "+JSON.stringify(id));
      const gradeInfosByType = gradesByType.map(gradeId => {
        return grades.get(gradeId);
      });
      type["grades"] = gradeInfosByType;
      //console.log("build type: "+JSON.stringify(type));
      return type;
    });
    gradeInfo.length = gradeTypeIds.size;
    return gradeInfo;
  }
);
