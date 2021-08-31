import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as gradeApi } from '../../services/grade';
import { format } from 'date-fns';

// action types
export const types = {
  FETCH_DEGREE_GRADE: "GRADE/FETCH_DEGREE_GRADE",
  UPDATE_SCHOOL_YEARWEEK: "GRADE/UPDATE_SCHOOL_YEARWEEK",
  FETCH_STAGE_LIST: "GRADE/FETCH_STAGE_LIST"
};
// action creators
export const actions = {
  fetchAllGradeInfo: () => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchAllGradeInfo(getState())) {
          dispatch(appActions.startRequest());
          const data = await gradeApi.queryGrades();
          dispatch(appActions.finishRequest());
          const {degreeByIds, allDegrees, gradeByIds, gradeByDegree} = convertGradeInfoToPlain(data);
          dispatch(fetchAllGradeInfoSuccess(degreeByIds, allDegrees, gradeByIds, gradeByDegree));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
  updateSchoolYearWeekInfo: () => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchYearWeekInfo(getState())) {
          dispatch(appActions.startRequest());
          const curDate = new Date();
          const dateString = format(curDate, 'yyyy-MM-dd');
          const data = await gradeApi.querySchoolYearWeek(dateString);
          dispatch(appActions.finishRequest());
          dispatch(fetchSchoolYearWeekSuccess(data));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
  fetchStageList: () => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchStageList(getState())) {
          dispatch(appActions.startRequest());
          const data = await gradeApi.queryStageList();
          dispatch(appActions.finishRequest());
          dispatch(fetchStageListSuccess(data));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
}

const shouldFetchAllGradeInfo = (state) => {
  const degrees = getDegreeIds(state);
  //console.log(`shouldFetchAllGradeInfo: ${degrees} ${degrees.size}`);
  return !degrees || degrees.size === 0;
}

const shouldFetchStageList = (state) => {
  const stages = getStageList(state);
  return !stages || stages.size === 0;
}


const fetchAllGradeInfoSuccess = (degreeByIds, allDegrees, gradeByIds, gradeByDegree) => {
  return ({
    type: types.FETCH_DEGREE_GRADE,
    degreeByIds,
    allDegrees,
    gradeByIds,
    gradeByDegree,
  })
}

const convertGradeInfoToPlain = (degrees) => {
  let degreeByIds = {};
  let allDegrees = [];
  let gradeByIds = {};
  let gradeByDegree = {};
  //console.log("Got Degree data: "+JSON.stringify(degrees));
  degrees.forEach(item => {
    degreeByIds[item.id] = { ...item };
    allDegrees.push(""+item.id);
    let grades = [];
    const gradeIds = Object.keys(item.grades);
    gradeIds.forEach(gradeId => {
      const grade = item.grades[gradeId];
      gradeByIds[gradeId] = grade;
      grades.push(gradeId);
    })
    gradeByDegree[item.id] = grades;
  });
  return {
    degreeByIds,
    allDegrees,
    gradeByIds,
    gradeByDegree,
  }
}

const shouldFetchYearWeekInfo = (state) => {
  const schoolYear = getSchoolYear(state);
  const schoolWeek = getSchoolWeek(state);
  return !schoolYear || !schoolWeek;
}

const fetchSchoolYearWeekSuccess = (info) => {
  return ({
    type: types.UPDATE_SCHOOL_YEARWEEK,
    info
  })
}

const fetchStageListSuccess = (data) => {
  return ({
    type: types.FETCH_STAGE_LIST,
    data
  })
}
// reducers
const degreeByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_DEGREE_GRADE:
      return state.merge(action.degreeByIds);
    default:
      return state;
  }
}

const degreeIds = (state = Immutable.fromJS([]), action) => {
  switch(action.type) {
    case types.FETCH_DEGREE_GRADE:
      return Immutable.List(action.allDegrees);
    default:
      return state;
  }
}

const gradeByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_DEGREE_GRADE:
      return state.merge(action.gradeByIds);
    default:
      return state;
  }
}

const gradeByDegree = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_DEGREE_GRADE:
      return state.merge(action.gradeByDegree);
    default:
      return state;
  }
}

const schoolYearWeek = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.UPDATE_SCHOOL_YEARWEEK:
      return state.merge(action.info);
    default:
      return state;
  }
}

const stages = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_STAGE_LIST:
      return state.merge(action.data.stages);
    default:
      return state;
  }
}

const reducer = combineReducers({
  degreeByIds,
  degreeIds,
  gradeByIds,
  gradeByDegree,
  schoolYearWeek,
  stages,
});

export default reducer;

// selectors
export const getSchoolYear = state => state.getIn(["grade", "schoolYearWeek", "year"]);
export const getSchoolWeek = state => state.getIn(["grade", "schoolYearWeek", "week"]);

export const getDegrees = state => state.getIn(["grade", "degreeByIds"]);

export const getDegreeIds = state => state.getIn(["grade", "degreeIds"]);

export const getGrades = state => state.getIn(["grade", "gradeByIds"]);

export const getGradeByAllDegree = state => state.getIn(["grade", "gradeByDegree"]);

export const getStageList = state => state.getIn(["grade", "stages"]);

export const getGradesOfAllDegrees = createSelector(
  [getDegreeIds, getDegrees, getGradeByAllDegree, getGrades],
  (degreeIds, degreeByIds, gradesByAllDegree, grades) => {
    let gradeInfo = []
    degreeIds.forEach(id => {
      const degree = degreeByIds.get(id);
      const gradesByDegree = gradesByAllDegree.get(id);
      //console.log("gradesByDegree.get "+id+" degree: "+JSON.stringify(degree));
      let gradeInfosByDegree = [];
      gradesByDegree.forEach(gradeId => {
        gradeInfosByDegree.push({id: gradeId, name: grades.get(gradeId)});
      });
      degree["grades"] = gradeInfosByDegree;
      //console.log("build degree info: "+JSON.stringify(degree));
      gradeInfo.push(degree);
    });
    return gradeInfo;
  }
);
