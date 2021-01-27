import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { DATA_EXPIRATION_TIME } from './common/info';
import { actions as appActions } from './app';
import { api as teacherApi } from '../../services/teacher';
import { types as kebiaoTypes } from './kebiao';
import { getJiaoyanshiIds, getJiaoyanshi } from './jiaoyanshi';

// action types
export const types = {
  FETCH_TEACHERS: "TEACHER/FETCH_TEACHERS"
};

// actions
export const actions = {
  fetchTeachersByJys: (jiaoyanshiId, year, week) => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchTeachers(jiaoyanshiId, year, week, getState())) {
          dispatch(appActions.startRequest());
          const data = await teacherApi.queryTeachers(jiaoyanshiId, year, week);
          dispatch(appActions.finishRequest());
          const { teacherByIds, teacherIds, kebiaoByTeacherSched, kebiaoByIds } = convertTeachersToPlain(data, year, week);
          dispatch(fetchTeachersSuccess(jiaoyanshiId, teacherIds, teacherByIds, kebiaoByTeacherSched, kebiaoByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

export const buildTeacherSchedId = (teacherId, year, week) => {
  return teacherId+"_"+year+(week < 10 ? "0"+week : ""+week);
}

const shouldFetchTeacherSchedInfo = (teacherIds, year, week, state) => {
  for (let i=0; i < teacherIds.length; i++) {
    const teacherId = teacherIds[i];
    const kebiaoWeekInfo = state.getIn(["teacher", "kebiaoByTeacherSched", buildTeacherSchedId(teacherId, year, week)]);
    if (!kebiaoWeekInfo || Date.now()-kebiaoWeekInfo.update > DATA_EXPIRATION_TIME) {
      console.log(`shouldFetchTeachers, id: ${buildTeacherSchedId(teacherId, year, week)}`);
      return true;
    }
  };
  return false;
}

const shouldFetchTeachers = (jiaoyanshiId, year, week, state) => {
  const teacherIds = state.getIn(["teacher", "byJiaoyanshi", ""+jiaoyanshiId]);
  if (!teacherIds) {
    console.log("shouldFetchTeachers, no teachers exists");
    return true;
  }
  if (shouldFetchTeacherSchedInfo(teacherIds, year, week, state)) {
    console.log("shouldFetchTeachers, need more teacherSchedInfo");
    return true;
  }
  console.log("shouldFetchTeachers: no need fetch data");
  return false;
}

const convertTeachersToPlain = (teachers, year, week) => {
  let teacherByIds = {};
  let teacherIds = [];
  let kebiaoByTeacherSched = {};
  let kebiaoByIds = {};
  //console.log("Got Teachers data: "+JSON.stringify(teachers));
  teachers.forEach(teacher => {
    teacherByIds[teacher.teacher_id] = { id: teacher.teacher_id, name: teacher.teacher_name };
    teacherIds.push(teacher.teacher_id);
    const teacherSchedId = buildTeacherSchedId(teacher.teacher_id, year, week);
    if (kebiaoByTeacherSched[teacherSchedId] == null) {
      kebiaoByTeacherSched[teacherSchedId] = { schedules:[] };
    }
    kebiaoByTeacherSched[teacherSchedId].update = Date.now();
    if (teacher.schedules && teacher.schedules.length > 0) {
      teacher.schedules.forEach(kebiao => {
          kebiaoByIds[kebiao.id] = {...kebiao};
          if (kebiao.week === week) {
            const hourIndex = (kebiao.index-1)/2;
            let kebiaoInWeek = kebiaoByTeacherSched[teacherSchedId].schedules;
            if (kebiaoInWeek[kebiao.day_in_week-1] == null) {
              kebiaoInWeek[kebiao.day_in_week-1] = [null, null, null, null, null, null];
            }
            let kebiaoInDay = kebiaoInWeek[kebiao.day_in_week-1];
            if (kebiaoInDay[hourIndex] == null) {
              kebiaoInDay[hourIndex] = [];
            }
            kebiaoInDay[hourIndex].push(kebiao.id+"");
          }
      });
    }
  });
  return {
    teacherByIds,
    teacherIds,
    kebiaoByTeacherSched,
    kebiaoByIds
  };
}

const fetchTeachersSuccess = (jiaoyanshiId, teacherIds, teacherByIds, kebiaoByTeacherSchedList, kebiaoByIds) => {
  return ({
    type: types.FETCH_TEACHERS,
    jiaoyanshiId,
    teacherIds,
    teacherByIds,
    kebiaoByTeacherSchedList,
    kebiaoByIds,
  })
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

const kebiaoByTeacherSched = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_TEACHERS:
      return state.merge(action.kebiaoByTeacherSchedList);
    case kebiaoTypes.UPDATE_KEBIAO:
      return Immutable.fromJS({});
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  byJiaoyanshi,
  kebiaoByTeacherSched
});

export default reducer;

// selectors
export const getTeachers = state => state.getIn(["teacher", "byIds"]);

export const getTeachersByJys = state => state.getIn(["teacher", "byJiaoyanshi"]);

export const getKebiaoByTeacherSched = state => state.getIn(["teacher", "kebiaoByTeacherSched"]);

export const getTeachersByAllJys = createSelector(
  [getJiaoyanshiIds, getJiaoyanshi, getTeachersByJys, getTeachers],
  (jysIds, jys, teacherByJys, teachers) => {
    let teacherInfo = {};
    if (!jysIds || !jys || !teacherByJys || !teachers) {
      return teacherInfo;
    }
    const allJysIds = ["0", ...jysIds.toJS()];
    allJysIds.forEach(jysId => {
      let jysInfo = null;
      if (jysId === "0") {
        jysInfo = {id: 0, name: "实训中心"};
      } else {
        jysInfo = jys.get(jysId);
      }
      const teachersList = teacherByJys.get(jysId);
      if (teachersList) {
        let teacherListByJys = [];
        teachersList.forEach(teacherId => {
          const teacherInfo = teachers.get(teacherId+"");
          teacherListByJys.push({id: teacherInfo.id, title: teacherInfo.name});
        });
        jysInfo["teachers"] = teacherListByJys;
        //console.log("build jys: "+JSON.stringify(jysInfo));
        teacherInfo[jysId] = jysInfo;
      }
    });

    return teacherInfo;
  }
)
