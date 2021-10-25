import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as gradeApi } from '../../services/grade';
import { format } from 'date-fns';

const STATE_PREFIX = "grade";
// action types
export const types = {
  FETCH_DEGREE_GRADE: "GRADE/FETCH_DEGREE_GRADE",
  UPDATE_SCHOOL_YEARWEEK: "GRADE/UPDATE_SCHOOL_YEARWEEK",
  FETCH_STAGE_LIST: "GRADE/FETCH_STAGE_LIST",
  SET_CURRENT_STAGE: "GRADE/SET_CURRENT_STAGE",
  RECOVER_STAGE: "GRADE/RECOVER_STAGE",
  FETCH_GRADEDEGREE_GROUPS: "GRADE/FETCH_GROUPS",
  SET_STAGE_OF_GROUP: "GRADE/SET_STAGE_OF_GROUP",
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
          data["yearOriginal"] = data["year"];
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
  fetchGroups: (stage) => {
    console.log(`fetchGroups: ids: year: ${stage}`);
    return async (dispatch, getState) => {
      try {
        if (shouldFetchGroups(stage, getState())) {
          dispatch(appActions.startRequest());
          const data = await gradeApi.queryGroups(stage);
          dispatch(appActions.finishRequest());
          let groups = convertGroupsToPlain(stage, data);
          dispatch(fetchGroupsSuccess(stage, groups));
        }
        dispatch(setSelectedGroupStage(stage))
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
  setStage: (stageId) => ({
    type: types.SET_CURRENT_STAGE,
    stageId: Number(stageId),
  }),
  recoverStage: () => ({
    type: types.RECOVER_STAGE,
  }),
}

const shouldFetchAllGradeInfo = (state) => {
  const degrees = getDegreeIds(state);
  //console.log(`shouldFetchAllGradeInfo: ${degrees} ${degrees.size}`);
  return !degrees || degrees.size === 0;
}

const shouldFetchStageList = (state) => {
  const stages = getImmutableStageList(state);
  return !stages || stages.size === 0;
}

const shouldFetchGroups = (stage, state) => {
  const groupList = state.getIn([STATE_PREFIX, "groupList", stage]);
  return !groupList || groupList.length === 0;
}

const convertGroupsToPlain = (stage, groupsInfo) => {
  let groupsByIds = {};
  console.log("Got GradeDegree Groups: "+JSON.stringify(groupsInfo));
  groupsInfo.forEach(groupInfo => {
      groupsByIds[groupInfo.id] = {id: groupInfo.id, title: groupInfo.name, grade: groupInfo.grade_id, degree: groupInfo.degree_id};
  });
  return groupsByIds;
}

const fetchGroupsSuccess = (stage, groups) => {
  return ({
    type: types.FETCH_GRADEDEGREE_GROUPS,
    stage,
    groups
  })
}

const setSelectedGroupStage = (stage) => {
  return ({
    type: types.SET_STAGE_OF_GROUP,
    stage
  })
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
    case types.SET_CURRENT_STAGE:
      return state.merge({year: action.stageId});
    case types.RECOVER_STAGE:
      let oriStage = Number(state.getIn(["yearOriginal"]));
      if (oriStage) {
        return state.merge({year: oriStage});
      }
      return state;
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

const groupList = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_GRADEDEGREE_GROUPS:
      return state.merge({[action.stage]: action.groups});
    case types.SET_STAGE_OF_GROUP:
      return state.merge({selected: action.stage});
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
  groupList,
});

export default reducer;

// selectors
export const getSchoolYear = state => state.getIn([STATE_PREFIX, "schoolYearWeek", "year"]);
export const getSchoolWeek = state => state.getIn([STATE_PREFIX, "schoolYearWeek", "week"]);

export const getDegrees = state => state.getIn([STATE_PREFIX, "degreeByIds"]);

export const getDegreeIds = state => state.getIn([STATE_PREFIX, "degreeIds"]);

export const getGrades = state => state.getIn([STATE_PREFIX, "gradeByIds"]);

export const getGradeByAllDegree = state => state.getIn([STATE_PREFIX, "gradeByDegree"]);

const getImmutableStageList = state => state.getIn([STATE_PREFIX, "stages"]);
export const getStageList = state => state.getIn([STATE_PREFIX, "stages"]).toJS();

export const getSelectedGroupStage = (state) => state.getIn([STATE_PREFIX, "groupList", "selected"]);

export const getGroups = state => state.getIn([STATE_PREFIX, "groupList", ""+getSelectedGroupStage(state)]);

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

export const getGradeDegreeGroups = createSelector(
  getSelectedGroupStage,
  getGroups,
  (stage, groups) => {
    //console.log("Selector: getGradeDegreeGroups triggered");
    if (!groups) return [];
    return Object.values(groups);
  }
);