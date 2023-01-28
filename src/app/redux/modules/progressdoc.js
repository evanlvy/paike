import Immutable, { isImmutable } from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as progressdocApi } from '../../services/progressdoc';

export const tableFields = {
  // doc list table fields
  USER_ID: "user_id",
  DEPARTMENT_ID: "department_id",

  // progress_item details table fields
  WEEK_IDX: "week_idx",
  ORDER_IN_WEEK: "order_in_week",
  CHAPTER_NAME: "chapter_name",
  THEORY_ITEM_CONTENT: "theory_item_content",
  THEORY_ITEM_HOURS: "theory_item_hours",
  LABITEM_CONTENT: "labitem_content",
  LABITEM_HOURS: "labitem_hours",
  LAB_ALLOC: "lab_alloc",
  LABITEM_ID: "labitem_id",
  TEACHING_MODE: "teaching_mode",
  COMMENT: "comment",
}

// action types
export const types = {
    SEARCH_DOC_LIST: "PROGRESSDOC/SEARCH_DOC_LIST",
    FETCH_DOC_GROUP: "PROGRESSDOC/FETCH_DOC_GROUP",
    UPDATE_FETCHED_GROUP: "PROGRESSDOC/UPDATE_FETCHED_GROUP",
    UPDATE_DOC_LIST: "PROGRESSDOC/UPDATE_DOC_LIST",
    FETCH_DOC: "PROGRESSDOC/FETCH_DOC",
    CLEAR_DOC: "PROGRESSDOC/CLEAR_DOC",
    CLEAR_DOC_CONTENT: "PROGRESSDOC/CLEAR_DOC_CONTENT",
    UPDATE_LAB_ITEM_CACHE: "PROGRESSDOC/UPDATE_LAB_ITEM_CACHE",
    SET_SELECTED_GROUP: "PROGRESSDOC/SET_SELECTED_GROUP",
    SET_SELECTED_SEARCH: "PROGRESSDOC/SET_SELECTED_SEARCH",
    SET_OPENED_DOC_ID: "PROGRESSDOC/SET_OPENED_DOC_ID",
    CLR_OPENED_DOC_ID: "PROGRESSDOC/CLR_OPENED_DOC_ID",
    ADD_DOC: "PROGRESSDOC/ADD_DOC",
    DEL_DOC: "PROGRESSDOC/DEL_DOC",
    UPDATE_DOC: "PROGRESSDOC/UPDATE_DOC",
    UPDATE_DOCS: "PROGRESSDOC/UPDATE_DOCS",
    ADD_ROW: "PROGRESSDOC/ADD_ROW",
    DEL_ROW: "PROGRESSDOC/DEL_ROW",
    UPDATE_ROW: "PROGRESSDOC/UPDATE_ROW",
    FETCH_LABITEM: "PROGRESSDOC/FETCH_LABITEM",
    SEARCH_LABITEM: "PROGRESSDOC/SEARCH_LABITEM",
    UPDATE_LABITEM: "PROGRESSDOC/UPDATE_LABITEM",
    ADD_LABITEM: "PROGRESSDOC/ADD_LABITEM",
    DEL_LABITEM: "PROGRESSDOC/DEL_LABITEM",
    SET_SELECTED_LABITEM: "PROGRESSDOC/SET_SELECTED_LABITEM",
    SET_CREATED_LABITEM: "PROGRESSDOC/SET_CREATED_LABITEM",
    GET_CURRICULUM_COUNT_RESULT: "PROGRESSDOC/GET_CURRICULUM_COUNT_RESULT",
  };

export const nonProps = ["total", "items", "curriculums"];

export const buildGroupStageWeekId = (stage, weekIdx, degreeId, gradeId) => {
  return stage+"_"+weekIdx+"_"+degreeId+"_"+gradeId;
}

// actions
export const actions = {
    searchList: (keyword, department_id=0, stage=0, items_per_page=0, page_id=0) => {
      console.log(`searchDocList: keyword: ${keyword}, dep_id: ${department_id}`);
      return async (dispatch, getState) => {
        try {
          if (shouldSearchList(keyword, department_id, getState())) {
            console.log("shouldSearchList: return yes!");
            dispatch(appActions.startRequest());
            const data = await progressdocApi.queryDocListByKeyword(keyword, department_id, items_per_page, page_id);
            dispatch(appActions.finishRequest());
            //let groups = convertGroupsToPlain(data);
            dispatch(searchListSuccess(keyword, department_id, data));
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
          if (shouldFetchList(department_id, stage, getState())) {
            console.log("shouldFetchList: return yes!");
            dispatch(appActions.startRequest());
            const data = await progressdocApi.queryDocList(department_id, stage, items_per_page, page_id);
            dispatch(appActions.finishRequest());
            //let groups = convertGroupsToPlain(data);
            dispatch(fetchGroupSuccess(department_id, stage, Object.keys(data)));
            dispatch(updateDocs(data));
          }
          dispatch(setSelectedGroup(department_id, stage));
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
              const data = await progressdocApi.queryDoc(id);
              dispatch(appActions.finishRequest());
              dispatch(fetchDocSuccess(id, data));
            }
            dispatch(setSelectedDoc(id));
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    fetchLabitem: (id, updateProgressId=0) => {
      console.log(`fetchLabitem: labitem_id: ${id}`);
      return async (dispatch, getState) => {
        try {
            if (updateProgressId > 0 || shouldFetchLabitem(id, getState())) {
              console.log("shouldFetchLabitem: return yes!");
              dispatch(appActions.startRequest());
              const data = await progressdocApi.getLabItems(id);
              dispatch(appActions.finishRequest());
              dispatch(fetchLabitemSuccess(id, data));
              if (updateProgressId > 0){
                dispatch(updateLabItemCache(getOpenedDocId(getState()), updateProgressId, data[id]));
              }
            }
            dispatch(setSelectedLabitem(id));
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    clearSelectedLabitem: () => ({
      type: types.SET_SELECTED_LABITEM,
      id: 0
    }),
    searchLabitem: (course_name, short_name="", content="", department_id=-1) => {
      console.log(`searchLabitem: course_name: ${course_name}`);
      return async (dispatch, getState) => {
        try {
            //if (shouldSearchLabitem(id, getState())) {
              //console.log("shouldFetchLabitem: return yes!");
              dispatch(appActions.startRequest());
              const data = await progressdocApi.getLabItems(-1, true, content, "", course_name, short_name, department_id);
              dispatch(appActions.finishRequest());
              dispatch(searchLabitemSuccess(data));
            //}
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    clearSearchedLabitem: () => {
      return async (dispatch, getState) => {
        dispatch(searchLabitemSuccess({}));
      }
    },
    setStateProgressItem: (id) => {

    },
    closeDoc: () => ({
      type: types.CLR_OPENED_DOC_ID,
    }),
    clearCreatedLabitem: () => ({
      type: types.SET_CREATED_LABITEM,
      id:""
    }),
    /* params_json_sample = {
      "id": 1,
      "props": {"id": 1, "course_name": "ssskkk"},
      "items_dfcol": ["id", "ord"],
      "items_dfdata": [[1, 9999], [2, 8888]],
      or
      "items": {"0": {"id": 1, "ord": 888},
                "1": {"id": 2, "ord": 999}}
    }*/
    saveDoc: (docId, propsDiffDict, itemsDiffDict, itemsDiffCol=null, itemsDiffDataframe=null) => {
      // Save progress doc props from form to progress_doc table
      console.log(`saveDoc: doc_id: ${docId}`);
      return async (dispatch, getState) => {
        try {
          dispatch(appActions.startRequest());
          const new_id = await progressdocApi.setDoc(docId, propsDiffDict, itemsDiffDict, itemsDiffCol, itemsDiffDataframe);
          dispatch(appActions.finishRequest());
          dispatch(appActions.setToast({type:"success", message:"toast.toast_request_save_success"}));
          dispatch(setSelectedDoc(-1));  // Close doc dialog
          let isNewDoc = docId <= 0;
          if (!isNewDoc) {
            dispatch(setDocSuccess(docId));  // Clear doc store
            // To update doc list table in progressdoc-screen.  
            dispatch(updateDoc(docId, propsDiffDict));
          } else {
            dispatch(addToFetchedGroup(getSelectedGroup(getState()), new_id));
          }
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    /*updateLabItemInProgressList: (progressId, labItemObj, locArray) => {
      return async (dispatch, getState) => {
        // When user confirm on selecting another labitem, just change the labitem_id inside states.
        let loc_items = {};
        locArray.forEach((v, i) => loc_items[i] = {location:v});
        let itemObj = Object.assign(labItemObj, {items:loc_items});
        console.log(`updateLabItemCache: progress_id: ${progressId}`);
        dispatch(updateLabItemCache(getOpenedDocId(getState()), progressId, itemObj));
      }
    },*/
    saveLabItem: (progressId, labitemId, itemDiffDict) => {
      // Add/modify a lab item, return the created/modified labitem_id
      console.log(`saveLabItem: labitem_id: ${labitemId}`);
      return async (dispatch, getState) => {
        try {
          dispatch(appActions.startRequest());
          if (labitemId <= 0) {
            const new_id = await progressdocApi.addLabItem(itemDiffDict);
            dispatch(appActions.setToast({type:"success", message:"toast.toast_request_create_success"}));
            dispatch(setCreatedLabitem(new_id));
          } else {
            const data = await progressdocApi.updateLabItem(labitemId, itemDiffDict);
            dispatch(appActions.setToast({type:"success", message:"toast.toast_request_save_success"}));
          }
          dispatch(appActions.finishRequest());
          // To update doc list table in progressdoc-screen.
          /*if ('lab_locs' in itemDiffDict) {
            let loc_items = {};
            itemDiffDict['lab_locs'].forEach((v, i) => loc_items[i] = {location:v});
            dispatch(updateLabItemCache(getOpenedDocId(getState()), progressId, loc_items));
          }*/
        } catch (error) {
          if (error.cause && error.cause==="E00000404"){
            dispatch(appActions.finishRequest());
            dispatch(appActions.setToast({type:"warning", message:"toast.toast_lab_location_not_found"}));
          } else {
            dispatch(appActions.setError(error));
          }
        }
      }
    },
    getCurriculumCount: (doc_id) => {
      return async (dispatch, getState) => {
        try {
          dispatch(appActions.startRequest());
          if (doc_id) {
            const result = await progressdocApi.getCurriculumCount(doc_id);
            let count = result.count?result.count:0;
            dispatch(setCurriculumsCountResult(count));
          }
          dispatch(appActions.finishRequest());
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
    deleteDoc: (doc_id) => {
      return async (dispatch) => {
        try {
          dispatch(appActions.startRequest());
          if (doc_id) {
            const result = await progressdocApi.deleteDoc(doc_id);
            let count = result.count?result.count:0;
            if (count > 0) {
              dispatch(delDocSuccess(doc_id));
            }
          }
          dispatch(appActions.finishRequest());
        } catch (error) {
          dispatch(appActions.setError(error));
        }
      }
    },
}

const shouldSearchList = (keyword, department_id, state) => {
  const doc_list = state.getIn(["progressdoc", "searchedList", department_id+"_"+keyword]);
  return !doc_list || doc_list.length === 0;
}

const shouldFetchList = (department_id, stage, state) => {
  const doc_list = state.getIn(["progressdoc", "fetchedGroup", department_id+"_"+stage]);
  return !doc_list || doc_list.length === 0;
}

const shouldFetchDoc = (doc_id, state) => {
  return !state.hasIn(["progressdoc", "fetchedDoc", ""+doc_id, 'items']);
}

const shouldFetchLabitem = (labitem_id, state) => {
  return !state.hasIn(["progressdoc", "fetchedLabitems", ""+labitem_id]);
}

const convertGroupsToPlain = (groupsInfo) => {
    console.log("Got doc Groups: "+JSON.stringify(groupsInfo));
    return {...groupsInfo};
}

const searchListSuccess = (keyword, department_id, groups) => {
  return ({
    type: types.SEARCH_DOC_LIST,
    keyword,
    department_id,
    groups
  })
}

const setSelectedSearch = (department_id, keyword) => {
  return ({
    type: types.SET_SELECTED_SEARCH,
    department_id,
    keyword
  })
}

const fetchGroupSuccess = (department_id, stage, data) => {
  return ({
    type: types.FETCH_DOC_GROUP,
    department_id,
    stage,
    data
  })
}

const addToFetchedGroup = (selected, id) => {
  return ({
    type: types.UPDATE_FETCHED_GROUP,
    selected,
    id
  })
}

const fetchDocSuccess = (id, data) => {
  return ({
    type: types.FETCH_DOC,
    id,
    data
  })
}

const fetchLabitemSuccess = (id, data) => {
  return ({
    type: types.FETCH_LABITEM,
    data
  })
}

const searchLabitemSuccess = (data) => {
  return ({
    type: types.SEARCH_LABITEM,
    data,
  })
}

const setSelectedDoc = (id) => {
  return ({
    type: types.SET_OPENED_DOC_ID,
    id
  })
}

const setSelectedGroup = (id, stage) => {
  return ({
    type: types.SET_SELECTED_GROUP,
    id,
    stage
  })
}

const setSelectedLabitem = (id) => {
  return ({
    type: types.SET_SELECTED_LABITEM,
    id
  })
}

const setCreatedLabitem = (id) => {
  return ({
    type: types.SET_CREATED_LABITEM,
    id
  })
}

const setDocSuccess = (id) => {
  return ({
    type: types.CLEAR_DOC_CONTENT,
    id
  })
}

const delDocSuccess = (id) => {
  return ({
    type: types.CLEAR_DOC,
    id
  })
}

const updateDoc = (id, props) => {
  return ({
    type: types.UPDATE_DOC,
    id,
    props
  })
}

const updateDocs = (docs) => {
  return ({
    type: types.UPDATE_DOCS,
    docs
  })
}

const updateLabItemCache = (docId, progressId, labItemObj) => {
  return ({
    type: types.UPDATE_LAB_ITEM_CACHE,
    docId,
    progressId,
    labItemObj
  })
}

const setCurriculumsCountResult = (count) => {
  return ({
    type: types.GET_CURRICULUM_COUNT_RESULT,
    count
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

const fetchedGroup = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_DOC_GROUP:
      return state.merge({[action.department_id+"_"+action.stage]: action.data});
    case types.SET_SELECTED_GROUP:
      return state.merge({selected: action.id+"_"+action.stage});
    case types.UPDATE_FETCHED_GROUP:
      return state.update(action.selected, docList => 
        {docList.push(action.id)});
    default:
      return state;
  }
}

const fetchedDoc = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_DOC:
      return state.merge({[""+action.id]: action.data});
    case types.UPDATE_DOC:
      return state.mergeDeep({
        [action.id]: {...action.props, id: action.id, updated_at: "Just Now"}
      });
    case types.UPDATE_DOCS:
      return state.mergeDeep(action.docs);
    case types.CLEAR_DOC:
      return state.removeIn([""+action.id]);
    case types.CLEAR_DOC_CONTENT:
      return state.removeIn([""+action.id, "items"]);
    case types.SET_OPENED_DOC_ID:
      return state.merge({selected: action.id})
    case types.CLR_OPENED_DOC_ID:
      return state.merge({selected: -1})
    //case types.REMOVE_LAB_LOCATIONS:
    //  return state.removeIn([""+action.docId, "items", ""+action.progressId, "lab_alloc", "items"]);
    case types.UPDATE_LAB_ITEM_CACHE:
      let route = [""+action.docId, "items", ""+action.progressId, "lab_alloc"];
      return state.removeIn(route).mergeIn([""+action.docId, "items", ""+action.progressId], {lab_alloc:action.labItemObj});
      /*return state.mergeDeep({
        [action.docId]: {
          "items": {
            [action.progressId]: {
              "lab_alloc": {
                "items": action.locations}
            }
          }
        }
      });*/
    default:
      return state;
  }
}

const fetchedLabitems = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LABITEM:
      return state.merge(action.data);
    case types.SET_SELECTED_LABITEM:
      return state.merge({selected: action.id})
    case types.SET_CREATED_LABITEM:
      return state.merge({created: action.id})
    default:
      return state;
  }
}

const searchedLabitemBriefs = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.SEARCH_LABITEM:
      return Immutable.fromJS(action.data);//state.merge(action.data);
    default:
      return state;
  }
}

const curriculumCountResult = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.GET_CURRICULUM_COUNT_RESULT:
      return action.count;
    default:
      return state;
  }
}

const reducer = combineReducers({
  searchedList,
  fetchedGroup,
  fetchedDoc,
  fetchedLabitems,
  searchedLabitemBriefs,
  curriculumCountResult,
});

export default reducer;

// selectors
export const getGroup = state => state.getIn(["progressdoc", "fetchedGroup", getSelectedGroup(state)]);
export const getSelectedGroup = (state) => state.getIn(["progressdoc", "fetchedGroup", "selected"]);

export const getSearchedList = (state) => state.getIn(["progressdoc", "searchedList", getSelectedSearch(state)]).valueSeq();
export const getSelectedSearch = (state) => state.getIn(["progressdoc", "searchedList", "selected"]);

export const getDocs = (state) => state.getIn(["progressdoc", "fetchedDoc"]);
export const getDoc = (state) => state.getIn(["progressdoc", "fetchedDoc", ""+getOpenedDocId(state)]);
export const getOpenedDocId = (state) => state.getIn(["progressdoc", "fetchedDoc", "selected"]);

export const getLabitem = (state) => state.getIn(["progressdoc", "fetchedLabitems", ""+getSelectedLabitem(state)]);
export const getSelectedLabitem = (state) => state.getIn(["progressdoc", "fetchedLabitems", "selected"]);
export const getCreatedLabitem = (state) => state.getIn(["progressdoc", "fetchedLabitems", "created"]);
export const getCachedLabitems = (state) => state.getIn(["progressdoc", "fetchedLabitems"]);
export const getSearchedLabitemBriefs = (state) => state.getIn(["progressdoc", "searchedLabitemBriefs"]).toJS();
export const getCurriculumCountResult = (state) => state.getIn(["progressdoc", "curriculumCountResult"]);

export const getDocList = createSelector(
  [getGroup, getDocs],
  (docList, docs) => {
    if (!docList || !docs) return [];
    //return Object.values(docList);
    let ret = docs.filter(function (value, key) {
      return (docList.includes(key));
    });
    return ret.valueSeq();
  }
);

export const getDocProps = createSelector(
  [getDoc, getOpenedDocId],
  (value, openedId) => {
    if (openedId <= 0 || !value || Object.keys(value).length <= 0) {
      return null;
    }
    // Remove non-props values
    let {total, items, curriculums, checksum, ...docProps} = value;
    return docProps;
  }
);

export const getCurriculumCount = createSelector(
  [getDoc, getOpenedDocId],
  (value, openedId) => {
    if (openedId <= 0 || !value || Object.keys(value).length <= 0) {
      return null;
    }
    return value.curriculums;
  }
);

export const getDocItems = createSelector(
  [getDoc, getOpenedDocId],
  (value, openedId) => {
    if (openedId <= 0 || !value || Object.keys(value).length <= 0 || !value.items) {
      return null;
    }
    //console.log("ReSelector: rows="+JSON.stringify(rows));
    // Trans to array
    return Object.values(value.items);
  }
);

export const getLabitemContent = createSelector(
  getLabitem,
  (value) => {
    if (!value) return [];
    return value;
  }
);

export const parseImmutableLocs = (imm_loc_array) => {
  let loc_data = imm_loc_array;
  if (isImmutable(loc_data)) {
    loc_data =imm_loc_array.toJS();
  }
  let short_names = Object.values(loc_data).map(function (lab_info) {
    return lab_info.location;
  });
  return short_names.join(', ');
};

// TBD: not in use yet
export const getSearchedDocList = createSelector(
  getSearchedList, 
  (docList) => {
    if (!docList) return [];
    return docList.toJS();
  }
);