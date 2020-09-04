import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';

import { actions as appActions } from './app';
import { api as teacherApi } from '../../services/teacher';

// action types
export const types = {
  FETCH_TEACHERS: "TEACHER/FETCH_TEACHERS"
};

// actions
export const actions = {
  fetchTeachers: (jiaoyanshiId) => {
    return (dispatch, getState) => {
      try {
        if (shouldFetchTeachers(jiaoyanshiId, getState())) {
          dispatch(appActions.startRequest());
          const data = queryTeachers(jiaoyanshiId);
          dispatch(appActions.finishRequest());
          const { teacherByIds, teacherIds } = convertTeachersToPlain(data);
          dispatch(fetchTeachersSuccess(jiaoyanshiId, teacherIds, teacherByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const queryTeachers = async (jiaoyanshiId) => {
  return await teacherApi.queryTeachers(jiaoyanshiId);
}

const shouldFetchTeachers = (jiaoyanshiId, state) => {
  const teacherIds = getTeachersByJiaoyanshi(state, jiaoyanshiId);
  return !teacherIds;
}

const fetchTeachersSuccess = (jiaoyanshiId, teacherIds, teacherByIds) => {
  return ({
    type: types.FETCH_TEACHERS,
    jiaoyanshiId,
    teacherIds,
    teacherByIds
  })
}

const convertTeachersToPlain = (teachers) => {
  let teacherByIds = {};
  let teacherIds = [];
  console.log("Got Teachers data: "+JSON.stringify(teachers));
  teachers.forEach(item => {
    teacherByIds[item.id] = { ...item };
    teacherIds.push(item.id);
  });
  return {
    teacherByIds,
    teacherIds
  };
}
// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_TEACHERS:
      return state.merge(action.teacherByIds);
    default:
      return state;
  }
}

const byJiaoyanshi = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_TEACHERS:
      return state.merge({[action.jiaoyanshiId]: action.teacherIds});
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  byJiaoyanshi,
});

export default reducer;

// selectors
export const getTeachers = state => state.getIn(["teacher", "byIds"]);

export const getTeacherById = (state, id) => state.getIn(["teacher", "byIds", id]);

export const getTeachersByJiaoyanshi = (state, jiaoyanshiId) => state.getIn(["teacher", "byJiaoyanshi", jiaoyanshiId]);
