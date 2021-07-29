import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as rawplanApi } from '../../services/rawplan';

// action types
export const types = {
    FETCH_RAWPLAN_GROUPS: "RAWPLAN/FETCH_GROUPS",
    FETCH_RAWPLAN: "RAWPLAN/FETCH_RAWPLAN",
    SET_SELECTED_GROUP: "RAWPLAN/SET_SELECTEDGROUP"
  };

export const buildGroupStageWeekId = (stage, weekIdx, degreeId, gradeId) => {
  return stage+"_"+weekIdx+"_"+degreeId+"_"+gradeId;
}

// actions
export const actions = {
    fetchRawplanGroups: (stage) => {
      console.log(`fetchRawplanGroups: ids: year: ${stage}`);
      return async (dispatch, getState) => {
        try {
          if (shouldFetchGroups(stage, getState())) {
            dispatch(appActions.startRequest());
            const data = await rawplanApi.queryGroups(stage);
            dispatch(appActions.finishRequest());
            let groups = convertGroupsToPlain(stage, data);
            dispatch(fetchRawplanGroupsSuccess(stage, groups));
          }
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    fetchRawplan: (stage, weekIdx, degreeId, gradeId) => {
      console.log(`fetchRawplan: stage: ${stage}, weekIdx: ${weekIdx}, degreeId: ${degreeId}, gradeId: ${gradeId}`);
      return async (dispatch, getState) => {
        try {
            const groupStageWeekId = buildGroupStageWeekId(stage, weekIdx, degreeId, gradeId);
            if (shouldFetchRawplan(groupStageWeekId, getState())) {
              dispatch(appActions.startRequest());
              const data = await rawplanApi.queryRawplan(stage, weekIdx, degreeId, gradeId);
              dispatch(appActions.finishRequest());
              let plans = convertRawplanToPlain(stage, weekIdx, data);
              dispatch(fetchRawplanSuccess(groupStageWeekId, plans));
            }
            dispatch(setSelectedGroup(groupStageWeekId));
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
}

const shouldFetchGroups = (stage, state) => {
    const prev_stage = state.getIn(["rawplan", "yearId"]);
    return prev_stage !== stage;
}

const shouldFetchRawplan = (groupStageWeekId, state) => {
  const planList = state.getIn(["rawplan", "plans", groupStageWeekId]);
  return !planList || planList.length === 0;
}

const convertGroupsToPlain = (stage, groupsInfo) => {
    let groupsByIds = {};
    console.log("Got rawplan Groups: "+JSON.stringify(groupsInfo));
    groupsInfo.forEach(groupInfo => {
        groupsByIds[groupInfo.id] = {id: groupInfo.id, title: groupInfo.name, grade: groupInfo.grade_id, degree: groupInfo.degree_id};
    });
    return groupsByIds;
}

const fetchRawplanGroupsSuccess = (stage, groups) => {
    return ({
      type: types.FETCH_RAWPLAN_GROUPS,
      stage,
      groups
    })
}

const fetchRawplanSuccess = (groupStageWeekId, plans) => {
  return ({
    type: types.FETCH_RAWPLAN,
    groupStageWeekId,
    plans
  })
}

const setSelectedGroup = (groupStageWeekId) => {
  return ({
    type: types.SET_SELECTED_GROUP,
    groupStageWeekId
  })
}

const convertRawplanToPlain = (stage, week_idx, plans) => {
  let data_dict = {};
  console.log("Got rawplan rows: "+JSON.stringify(plans));
  plans.forEach(plan_row => {
    data_dict[plan_row.id] = parsePlan(plan_row);
  });
  return {plans: data_dict, update: Date.now()};
}

// reducers
const groupList = (state = Immutable.fromJS({}), action) => {
    switch (action.type) {
      case types.FETCH_RAWPLAN_GROUPS:
        return state.merge(action.groups);
      default:
        return state;
    }
  }

const yearId = (state = Immutable.fromJS({}), action) => {
    switch (action.type) {
        case types.FETCH_RAWPLAN_GROUPS:
            return state.merge({id: action.stage});
        default:
            return state;
    }
}

const planRows = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_RAWPLAN:
      return state.merge({[action.groupStageWeekId]: action.plans});
    default:
      return state;
  }
}

const groupStageWeekId = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.SET_SELECTED_GROUP:
      return state.merge({id: action.groupStageWeekId});
    default:
      return state;
  }
}

export const parsePlan = (plan_row) => {
  let item_dict = {};
  console.log("parsePlan: "+JSON.stringify(plan_row));
  for (let key of Object.keys(plan_row)) {
    let value = plan_row[key];
    console.log("parsePlan: value:"+JSON.stringify(value));
    if (typeof value === "string") {
      let item_splited = value.split('$');
      if (item_splited.length === 4) {
        item_dict[key] = {course: item_splited[0], cid: item_splited[1], teacher: item_splited[2], tid: item_splited[3]};
      }
    }
  }
  let ret_val = {id: plan_row.id, from: plan_row.begin_week, to: plan_row.end_week, class: plan_row.class_name, room: plan_row.classroom};
  return Object.assign(ret_val, item_dict);
}

const reducer = combineReducers({
  groupList,
  yearId,
  planRows,
  groupStageWeekId,
});

export default reducer;

// selectors
export const getGroups = state => state.getIn(["rawplan", "groupList"]);

export const getStage = (state) => state.getIn(["rawplan", "yearId", "id"]);

export const getPlans = (state) => state.getIn(["rawplan", "planRows"]);

export const getSelectedGroup = (state) => state.getIn(["rawplan", "groupStageWeekId", "id"]);

export const getRawplanGroups = createSelector(
  [getGroups, getStage],
  (groups, stage) => {
    if (!groups) return [];
    if (!Object.keys(groups).length) return [];
    //console.log("Selector: get Groups actual: "+groups);
    //console.log("Selector: get Groups: "+JSON.stringify(groups));
    let group_list = [];
    groups.forEach((value, key) => {
      group_list.push(value);
    })
    return group_list;
  }
);

export const getPlansByGroup = (state, groupStageWeekId) => {
  console.log("selector: "+groupStageWeekId);
  let group_from_state = groupStageWeekId;
  if (!groupStageWeekId) {
    group_from_state = getSelectedGroup(state);
  }
  let rows = state.getIn(["rawplan", "planRows", group_from_state, 'plans']);
  console.log("selector: "+rows);
  if (!rows) {
    return null;
  }
  return Object.values(rows);
};
