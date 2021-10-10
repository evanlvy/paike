import Immutable, { has } from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as curriculumsApi } from '../../services/curriculums';

// action types
export const types = {
    SET_SELECTED_GROUP: "CURRICULUMS/SET_SELECTEDGROUP",
    FETCH_LIST: "CURRICULUMS/FETCH_LIST",
    SET_ROW_CHANGED: "CURRICULUMS/SET_ROWCHANGED",
    CLEAR_ROW_CHANGES: "CURRICULUMS/CLEAR_ROWCHANGES",
    ADD_ITEM: "CURRICULUMS/ADD_ITEM",
    DEL_ITEM: "CURRICULUMS/DEL_ITEM",
    UPDATE_ITEM: "CURRICULUMS/UPDATE_ITEM",
  };

const STATE_PREFIX = "curriculums";

export const buildDataIdentifier = (stage, departmentId, degreeId, gradeId) => {
  return stage+"_"+departmentId+"_"+degreeId+"_"+gradeId;
}

// actions
export const actions = {
    fetchList: (stage, department_id, degree_id=null, grade_id=null, items_per_page=null, page_id=null) => {
      // department_id is MUST because there're more than 300 items for each group.
      console.log(`fetchList: dep_id: ${department_id}`);
      return async (dispatch, getState) => {
        try {
          let group_id = buildDataIdentifier(stage, department_id, degree_id, grade_id);
          if (shouldFetchList(group_id, getState())) {
            console.log("shouldFetchList: return yes!");
            dispatch(appActions.startRequest());
            const data = await curriculumsApi.queryCurriculumsWithSuspects(stage, department_id, degree_id, grade_id, null, null, null, items_per_page, page_id);
            dispatch(appActions.finishRequest());
            //let groups = convertGroupsToPlain(data);
            dispatch(fetchListSuccess(group_id, data));
          }
          dispatch(setSelectedGroup(group_id));
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
            const data = await curriculumsApi.updateRow(rowId, getRowDiff(getState(), rowId));
            console.log("updateRow: return ok for rowId: "+data.id);
            dispatch(appActions.finishRequest());
            const selectedDataId = getSelectedDataId(getState());
            dispatch(actions.clearRowChanges(selectedDataId));
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    reloadRows: (items_per_page=null, page_id=null) => {
      return async (dispatch, getState) => {
        try {
            // Get stage week info from state
            const selectedDataId = getSelectedDataId(getState());
            let item_splited = selectedDataId.split('_');
            if (item_splited.length === 4) {
              console.log("reloadRows!");
              dispatch(appActions.startRequest());
              const data = await curriculumsApi.queryCurriculumsWithSuspects(item_splited[0], item_splited[1], item_splited[2], item_splited[3], null, null, null, items_per_page, page_id);
              dispatch(appActions.finishRequest());
              //let rows = convertRawplanToPlain(data);
              dispatch(fetchListSuccess(selectedDataId, data));
              // Clear changed rows, this will trigger rerender
              dispatch(actions.clearRowChanges(selectedDataId));
            }
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    clearSelectedGroup: () => ({
      type: types.SET_SELECTED_GROUP,
      selectedDataId: 'null'
    }),
    setRowChanged: (selectedDataId, rowId, colId, cellItem) => ({
      type: types.SET_ROW_CHANGED,
      selectedDataId,
      rowId,
      colId,
      cellItem
    }),
    clearRowChanges: (selectedDataId) => ({
      type: types.CLEAR_ROW_CHANGES,
      selectedDataId
    }),
    getChangedRowIds: () => {
      // Use thunk to call selector with State ref. In order to peek state value only.
      return (dispatch, getState) => {
        const state = getState();
        return getChangedRowIds(state);
      }
    },
}

const shouldFetchList = (groupId, state) => {
  const row_list = state.getIn([STATE_PREFIX, "fetchedList", groupId]);
  return !row_list || row_list.length === 0;
}

const setSelectedGroup = (selectedDataId) => {
  return ({
    type: types.SET_SELECTED_GROUP,
    selectedDataId
  })
}

const fetchListSuccess = (groupId, data) => {
  return ({
    type: types.FETCH_LIST,
    groupId,
    data
  })
}

// reducers
const fetchedList = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LIST:
      return state.merge({[action.groupId]: action.data});
    default:
      return state;
  }
}

const selectedDataId = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.SET_SELECTED_GROUP:
      return state.merge({id: action.selectedDataId});
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
        [action.selectedDataId]: {
          [action.rowId]: {
            [action.colId]: action.rowItem,
          }
        }
      });
    case types.CLEAR_ROW_CHANGES:
      return state.remove(action.selectedDataId);  // Should return ImmutableJS object instead of empty obj {} directly!
    default:
      return state;
  }
}

const reducer = combineReducers({
  fetchedList,
  selectedDataId,
  rowChanged,
});

export default reducer;

// selectors
export const getList = state => state.getIn([STATE_PREFIX, "fetchedList", getSelectedDataId(state)]);

export const getRows = (state) => state.getIn([STATE_PREFIX, "dataStore", getSelectedDataId(state)]);

export const getRowDiff = (state, rowId) => state.getIn([STATE_PREFIX, "rowChanged", getSelectedDataId(state), rowId]);

export const getRowDiffArray = (state) => state.getIn([STATE_PREFIX, "rowChanged", getSelectedDataId(state)]);

export const getChangedRowIds = (state) => Object.keys(state.getIn([STATE_PREFIX, "rowChanged", getSelectedDataId(state)]));

export const getSelectedDataId = (state) => state.getIn([STATE_PREFIX, "selectedDataId", "id"]);

export const countChangedRows = (state) => {
  let combined_id = getSelectedDataId(state);
  if (combined_id) {
    if (state.hasIn([STATE_PREFIX, "rowChanged", combined_id])) {
      // The deep in object is not immutable!
      return Object.keys(state.getIn([STATE_PREFIX, "rowChanged", combined_id])).length;
    }
  }
  return 0;
}

export const getCurriculumList = createSelector(
  getList,
  getSelectedDataId,
  (docList, selectedDataId) => {
    if (!docList) return [];
    return Object.values(docList);
  }
);

export const countRowChanged = createSelector(
  countChangedRows,
  (value) => {
    return value;
  }
);
