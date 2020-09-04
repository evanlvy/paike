import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';

import { actions as appActions } from './app';
import { api as subjectApi } from '../../services/subject';

// action types
export const types = {
  FETCH_SUBJECTS: "SUBJECT/FETCH_SUBJECTS"
};

// actions
export const actions = {
  fetchSubjects: (gradeTypeId, gradeId) => {
    return (dispatch, getState) => {
      try {
        if (shouldFetchSubjects(gradeTypeId, gradeId, getState())) {
          dispatch(appActions.startRequest());
          const data = querySubjects(gradeTypeId, gradeId);
          dispatch(appActions.finishRequest());
          const { subjectByIds, subjectIds } = convertSubjectsToPlain(data);
          dispatch(fetchSubjectsSuccess(gradeTypeId, gradeId, subjectIds, subjectByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const querySubjects = async (gradeTypeId, gradeId) => {
  return await subjectApi.querySubjects(gradeTypeId, gradeId);
}

const buildGradeInfoId = (gradeTypeId, gradeId) => {
  return gradeTypeId+"_"+gradeId;
}

const shouldFetchSubjects = (gradeTypeId, gradeId, state) => {
  const subjectIds = getSubjectByGrade(state, gradeTypeId, gradeId);
  return !subjectIds;
}

const fetchSubjectsSuccess = (gradeTypeId, gradeId, subjectIds, subjectByIds) => {
  return ({
    type: types.FETCH_SUBJECTS,
    gradeTypeId,
    gradeId,
    subjectIds,
    subjectByIds
  })
}

const convertSubjectsToPlain = (subjects) => {
  let subjectByIds = {};
  let subjectIds = [];
  console.log("Got Subjects data: "+JSON.stringify(subjects));
  subjects.forEach(item => {
    subjectByIds[item.id] = { ...item };
    subjectIds.push(item.id);
  });
  return {
    subjectByIds,
    subjectIds
  };
}
// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_SUBJECTS:
      return state.merge(action.subjectByIds);
    default:
      return state;
  }
}

const byGrade = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_SUBJECTS:
      const gradeInfoId = buildGradeInfoId(action.gradeTypeId, action.gradeId);
      return state.merge({[gradeInfoId]: action.subjectIds});
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  byGrade,
});

export default reducer;

// selectors
export const getSubjects = state => state.getIn(["subject", "byIds"]);

export const getSubjectById = (state, id) => state.getIn(["subject", "byIds", id]);

export const getSubjectByGrade = (state, gradeTypeId, gradeId) => state.getIn(["subject", "byGrade", buildGradeInfoId(gradeTypeId, gradeId)]);
