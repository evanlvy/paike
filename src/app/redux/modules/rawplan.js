import Immutable, { has } from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as rawplanApi } from '../../services/rawplan';

// action types
export const types = {
    FETCH_RAWPLAN_GROUPS: "RAWPLAN/FETCH_GROUPS",
    FETCH_RAWPLAN: "RAWPLAN/FETCH_RAWPLAN",
    SET_SELECTED_GROUP: "RAWPLAN/SET_SELECTEDGROUP",
    SET_ROW_CHANGED: "RAWPLAN/SET_ROWCHANGED",
    CLEAR_ROW_CHANGES: "RAWPLAN/CLEAR_ROWCHANGES"
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
              console.log("shouldFetchRawplan: return yes!");
              dispatch(appActions.startRequest());
              const data = await rawplanApi.queryRawplan(stage, weekIdx, degreeId, gradeId);
              dispatch(appActions.finishRequest());
              let plans = convertRawplanToPlain(data);
              dispatch(fetchRawplanSuccess(groupStageWeekId, plans));
            }
            dispatch(setSelectedGroup(groupStageWeekId));
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    reloadRows: () => {
      return async (dispatch, getState) => {
        try {
            // Get stage week info from state
            const groupStageWeekId = getSelectedGroup(getState());
            let item_splited = groupStageWeekId.split('_');
            if (item_splited.length === 4) {
              console.log("reloadRows!");
              dispatch(appActions.startRequest());
              const data = await rawplanApi.queryRawplan(item_splited[0], item_splited[1], item_splited[2], item_splited[3]);
              dispatch(appActions.finishRequest());
              let plans = convertRawplanToPlain(data);
              dispatch(fetchRawplanSuccess(groupStageWeekId, plans));
              // Clear changed rows, this will trigger rerender
              dispatch(actions.clearChanges(groupStageWeekId));
            }
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    commitRow: (rowId) => {
      console.log(`updateRow: rowId: ${rowId}`);
      return async (dispatch, getState) => {
        try {
            dispatch(appActions.startRequest());
            const data = await rawplanApi.updateRow(rowId, getRowDiff(getState(), rowId));
            console.log("updateRow: return ok for rowId: "+data.id);
            dispatch(appActions.finishRequest());
            const groupStageWeekId = getSelectedGroup(getState());
            dispatch(actions.clearChanges(groupStageWeekId));
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    setRowChanged: (groupStageWeekId, rowId, colId, planItem) => ({
      type: types.SET_ROW_CHANGED,
      groupStageWeekId,
      rowId,
      colId,
      planItem
    }),
    clearChanges: (groupStageWeekId) => ({
      type: types.CLEAR_ROW_CHANGES,
      groupStageWeekId
    }),
    getChangedRowIds: () => {
      // Use thunk to call selector with State ref. In order to peek state value only.
      return (dispatch, getState) => {
        const state = getState();
        return getChangedRowIds(state);
      }
    },
}

const shouldFetchGroups = (stage, state) => {
    const prev_stage = state.getIn(["rawplan", "yearId"]);
    return prev_stage !== stage;
}

const shouldFetchRawplan = (groupStageWeekId, state) => {
  const planList = state.getIn(["rawplan", "planRows", groupStageWeekId, 'plans']);
  console.log("shouldFetchRawplan: "+groupStageWeekId);
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

const convertRawplanToPlain = (plans) => {
  let data_dict = {};
  //console.log("Got rawplan rows: "+JSON.stringify(plans));
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

const rowChanged = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.SET_ROW_CHANGED:
      //console.log("rowChanged reducer:" + JSON.stringify(state));
      // How to change deep level state!
      // Ref: https://stackoverflow.com/questions/36031590/right-way-to-update-state-in-redux-reducers
      return state.mergeDeep({
        [action.groupStageWeekId]: {
          [action.rowId]: {
            [action.colId]: combinePlanItem(action.planItem)
          }
        }
      });
    case types.CLEAR_ROW_CHANGES:
      return state.remove(action.groupStageWeekId);  // Should return ImmutableJS object instead of empty obj {} directly!
    default:
      return state;
  }
}

const regexPlanItem = /\D{3}_\d{2}/g;
export const parsePlan = (plan_row) => {
  let item_dict = {};
  //console.log("parsePlan: "+JSON.stringify(plan_row));
  for (let key of Object.keys(plan_row)) {
    let value = plan_row[key];
    //console.log("parsePlan: value:"+JSON.stringify(value));
    if (typeof value === "string") {
      let found = key.match(regexPlanItem);
      if (!found || found.length < 1) {
        // non-plan keys
        item_dict[key] = value;
      }
      else {
        // compact plan keys
        let item_splited = value.split('$');
        if (item_splited.length === 4) {
          item_dict[key] = {course: item_splited[0], cid: item_splited[1], teacher: item_splited[2], tid: item_splited[3]};
        }
      }
    }
    else if (typeof value === "number") {
      // non-plan keys
      item_dict[key] = value;
    }
  }
  //let ret_val = {id: plan_row.id, begin_week: plan_row.begin_week, to: plan_row.end_week, class: plan_row.class_name, room: plan_row.classroom};
  //return Object.assign(ret_val, item_dict);
  return item_dict;
}

const combinePlanItem = (item) => {
  if (typeof item === "object") {
    // Plan item with course name/teacher name/cid/tid
    return Object.values(item).join("$");
  }
  else if (!item) {
    // In case user delete this item!
    return "";
  }
  else { // String item like Classroom
    return item;
  }
}

const reducer = combineReducers({
  groupList,
  yearId,
  planRows,
  groupStageWeekId,
  rowChanged,
  //planItem,
});

export default reducer;

// selectors
export const getGroups = state => state.getIn(["rawplan", "groupList"]).valueSeq();

export const getStage = (state) => state.getIn(["rawplan", "yearId", "id"]);

export const getSelectedGroup = (state) => state.getIn(["rawplan", "groupStageWeekId", "id"]);

export const getRows = (state) => state.getIn(["rawplan", "planRows", getSelectedGroup(state), 'plans']);

export const getRowDiff = (state, rowId) => state.getIn(["rawplan", "rowChanged", getSelectedGroup(state), rowId]);

export const countChangedRows = (state) => {
  let combined_id = getSelectedGroup(state);
  if (combined_id) {
    if (state.hasIn(["rawplan", "rowChanged", combined_id])) {
      // The deep in object is not immutable!
      return Object.keys(state.getIn(["rawplan", "rowChanged", combined_id])).length;
    }
  }
  return 0;
}

//export const getChangedRowIds = (state) => state.getIn(["rawplan", "rowChanged", getSelectedGroup(state)]).keySeq().toJS();
export const getChangedRowIds = (state) => Object.keys(state.getIn(["rawplan", "rowChanged", getSelectedGroup(state)]));

export const getRawplanGroups = createSelector(
  getGroups,
  (groups) => {
    if (!groups) return [];
    return groups.toJS();
  }
);

export const getPlansByGroup = createSelector(
  getRows, 
  (rows) => {
    if (!rows || rows.length <= 0) {
      return null;
    }
    //console.log("ReSelector: rows="+JSON.stringify(rows));
    return Object.values(rows);
  }
);

export const countRowChanged = createSelector(
  countChangedRows,
  (value) => {
    return value;
  }
);

export const getTeacherStatistics = createSelector(
  getRows, countChangedRows,
  (rows, changed) => {
    if (!rows || rows.length <= 0) {
      return [];
    }
    //console.log("getTeacherStatistics ReSelector: rows="+JSON.stringify(rows));
    // Find out teacher's hours each day. Warning if it's over 6 hours!
    let teacher_slot_array = {};
    Object.keys(rows).forEach(plan_id => {
      Object.keys(rows[plan_id]).forEach(key => {
        if (typeof rows[plan_id][key] === "object"){
          // Check teacher
          if (rows[plan_id][key].hasOwnProperty("teacher")) {
            // Get teacher list
            let teachers = rows[plan_id][key]["teacher"];
            if (teachers && teachers.length > 0) {
              let teacher_array = teachers.split(' ');
              teacher_array.forEach(tname => {
                if (teacher_slot_array.hasOwnProperty(tname)) {
                  teacher_slot_array[tname].push(key);
                }
                else {
                  teacher_slot_array[tname] = [key];
                }
              });              
            }
          }
        }
      });
    });
    if (Object.keys(teacher_slot_array).length <= 0) {
      return [];
    }
    console.log("getTeacherStatistics ReSelector: rows="+JSON.stringify(teacher_slot_array));
    // Data item sample: [teacher_name: {total: 28, conflicted: [mon, fri], overtime: [mon, fri]} ...]
    let teacher_statistics_map = {};  // Object of teachers
    Object.keys(teacher_slot_array).forEach(tname => {
      let slot_array = teacher_slot_array[tname];
      let total_hours = 0;
      let slot_map = {};
      let weekday_map = {};
      let conflicted_slot = [];
      let overtime_day = [];
      slot_array.forEach(slot => {
        total_hours += 1;
        slot_map[slot] = slot_map[slot] ? slot_map[slot]+1 : 1;
        if (slot_map[slot] === 2 ) {
          conflicted_slot.push(slot);
        }
        let weekday = slot.substring(0,3);
        weekday_map[weekday] = weekday_map[weekday] ? weekday_map[weekday]+1 : 1;
        if (weekday_map[weekday] === 6) {
          overtime_day.push(weekday);
        }
      });

      teacher_statistics_map[tname] = {"name": tname, "total": total_hours, "conflicted": conflicted_slot, "overtime": overtime_day};
      /*if (conflicted_slot.length < 1) {
        delete teacher_statistics_map[tname].conflicted;
      }
      if (overtime_day.length < 1) {
        delete teacher_statistics_map[tname].overtime;
      }*/
    });

    return Object.values(teacher_statistics_map).sort(function(a, b) {
      return b["total"]-a["total"];
    });;
  }
);