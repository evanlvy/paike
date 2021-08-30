import Immutable, { has } from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as progressdocApi } from '../../services/progressdoc';

// action types
export const types = {
    SEARCH_DOC_LIST: "PROGRESSDOC/SEARCH_DOC_LIST",
    FETCH_DOC_LIST: "PROGRESSDOC/FETCH_DOC_LIST",
    FETCH_DOC: "PROGRESSDOC/FETCH_DOC",
    SET_SELECTED_DEPAETMENT: "PROGRESSDOC/SET_SELECTED_DEPAETMENT",
    SET_OPENED_DOC_ID: "PROGRESSDOC/SET_OPENED_DOC_ID",
    ADD_DOC: "PROGRESSDOC/ADD_DOC",
    DEL_DOC: "PROGRESSDOC/DEL_DOC",
    UPDATE_DOC: "PROGRESSDOC/UPDATE_DOC",
    ADD_ROW: "PROGRESSDOC/ADD_ROW",
    DEL_ROW: "PROGRESSDOC/DEL_ROW",
    UPDATE_ROW: "PROGRESSDOC/UPDATE_ROW",
    ADD_LABITEM: "PROGRESSDOC/ADD_LABITEM",
    DEL_LABITEM: "PROGRESSDOC/DEL_LABITEM",
    UPDATE_LABITEM: "PROGRESSDOC/UPDATE_LABITEM",
    SEARCH_LABITEM: "PROGRESSDOC/SEARCH_LABITEM",
  };

export const buildGroupStageWeekId = (stage, weekIdx, degreeId, gradeId) => {
  return stage+"_"+weekIdx+"_"+degreeId+"_"+gradeId;
}

// actions
export const actions = {
    searchList: (keyword, department_id=0, stage=0, items_per_page=0, page_id=0) => {
      console.log(`searchDocList: keyword: ${keyword}, dep_id: ${department_id}`);
      return async (dispatch, getState) => {
        try {
          if (shouldSearchList(stage, getState())) {
            console.log("shouldSearchList: return yes!");
            dispatch(appActions.startRequest());
            const data = await progressdocApi.queryDocListByKeyword(keyword, department_id, items_per_page, page_id);
            dispatch(appActions.finishRequest());
            let groups = convertGroupsToPlain(data);
            dispatch(searchListSuccess(keyword, department_id, groups));
          }
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    fetchDocList: (department_id, stage=0, items_per_page=0, page_id=0) => {
      console.log(`fetchDocList: dep_id: ${department_id}`);
      return async (dispatch, getState) => {
        try {
          if (shouldFetchList(stage, getState())) {
            console.log("shouldFetchList: return yes!");
            dispatch(appActions.startRequest());
            const data = await progressdocApi.queryDocList(department_id, stage, items_per_page, page_id);
            dispatch(appActions.finishRequest());
            let groups = convertGroupsToPlain(data);
            dispatch(fetchListSuccess(department_id, stage, groups));
          }
          dispatch(setSelectedDepartment(department_id, stage));
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    fetchDoc: (id) => {
      console.log(`fetchDoc: doc_id: ${id}`);
      return async (dispatch, getState) => {
        try {
            if (shouldFetchDoc(id, getState())) {
              console.log("shouldFetchDoc: return yes!");
              dispatch(appActions.startRequest());
              const data = await rawplanApi.queryDoc(id);
              dispatch(appActions.finishRequest());
              dispatch(fetchDocSuccess(id, data));
            }
            dispatch(setSelectedDoc(id));
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    }
}

const shouldSearchList = (keyword, department_id, state) => {
  const doc_list = state.getIn(["progressdoc", "searchedList", department_id+"_"+keyword]);
  return !doc_list || doc_list.length === 0;
}

const shouldFetchList = (department_id, stage, state) => {
  const doc_list = state.getIn(["progressdoc", "fetchedList", department_id+"_"+stage]);
  return !doc_list || doc_list.length === 0;
}

const shouldFetchDoc = (doc_id, state) => {
  const doc = state.getIn(["progressdoc", "fetchedDoc", doc_id]);
  return !doc || doc.length === 0;
}

const convertGroupsToPlain = (groupsInfo) => {
    console.log("Got doc Groups: "+JSON.stringify(groupsInfo));
    return {...groupsInfo};
}

const searchListSuccess = (keyword, department_id, groups) => {
  return ({
    type: types.SEARCH_LIST,
    keyword,
    department_id,
    groups
  })
}

const setSelectedDepartment = (department_id, keyword) => {
  return ({
    type: types.SET_SELECTED_SEARCH,
    department_id,
    keyword
  })
}

const fetchListSuccess = (department_id, stage, groups) => {
  return ({
    type: types.FETCH_LIST,
    department_id,
    stage,
    groups
  })
}

const fetchDocSuccess = (id, data) => {
  return ({
    type: types.FETCH_DOC,
    id,
    data
  })
}

const setSelectedDoc = (id) => {
  return ({
    type: types.SET_OPENED_DOC_ID,
    id
  })
}

const setSelectedDepartment = (id, stage) => {
  return ({
    type: types.SET_SELECTED_DEPAETMENT,
    id,
    stage
  })
}

// reducers
const searchedList = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.SEARCH_DOC_LIST:
      return state.merge({[action.department_id+"_"+action.keyword]: action.plans});
    case types.SET_SELECTED_SEARCH:
      return state.merge({selected: action.department_id+"_"+action.keyword});
    default:
      return state;
  }
}

const fetchedList = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_DOC_LIST:
      return state.merge({[action.department_id+"_"+action.stage]: action.plans});
    case types.SET_SELECTED_DEPAETMENT:
      return state.merge({selected: action.id+"_"+action.stage});
    default:
      return state;
  }
}

const fetchedDoc = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_DOC:
      return state.merge({[""+action.id]: action.data});
    case types.SET_OPENED_DOC_ID:
      return state.merge({selected: action.id})
    default:
      return state;
  }
}

const reducer = combineReducers({
  searchedList,
  fetchedList,
  fetchedDoc,
});

export default reducer;

// selectors
export const getList = state => state.getIn(["progressDoc", "fetchedList", getSelectedDepartment(state)]).valueSeq();

export const getSearchedList = (state) => state.getIn(["progressDoc", "searchedList", getSelectedSearch(state)]).valueSeq();

export const getSelectedSearch = (state) => state.getIn(["progressDoc", "searchedList", "selected"]);

export const getSelectedDepartment = (state) => state.getIn(["progressDoc", "fetchedList", "selected"]);

export const getSelectedDocId = (state) => state.getIn(["progressDoc", "fetchedDoc", "selected"]);

export const getDoc = (state) => state.getIn(["progressDoc", "fetchedDoc", getSelectedDocId(state)]);

export const getDocList = createSelector(
  getList,
  (docList) => {
    if (!docList) return [];
    return docList.toJS();
  }
);

export const getSearchedDocList = createSelector(
  getSearchedList, 
  (docList) => {
    if (!docList) return [];
    return docList.toJS();
  }
);

export const getDocContents = createSelector(
  getDoc,
  (value) => {
    return value;
  }
);