import { createSelector } from 'reselect';
import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { actions as appActions } from './app';

import { api as authApi } from '../../services/auth';

// types
export const types = {
  LOGIN: "AUTH/LOGIN",
  LOGOUT: "AUTH/LOGOUT",
  STUNUM: "AUTH/STUNUM",
  CLEAR_ERR: "AUTH/CLEARERR",
  TIMESTAMP: "AUTH/TIMESTAMP"
};

// actions
export const actions = {
  login: (username, password) => {
    return async (dispatch) => {
      try {
        dispatch(appActions.startRequest());
        dispatch(actions.clearError());
        const result = await authApi.login(username, password);
        console.log("login: Got data"+JSON.stringify(result));
        dispatch(appActions.finishRequest());
        dispatch(loginResult(result));
      } catch (error) {
        dispatch(appActions.setError(error))
        dispatch(loginResult({error: {message: error.message}}));
      } finally {
        dispatch(appActions.finishRequest());
        dispatch(rspTimeStamp()); 
      }
    }
  },
  studentLogin: (stu_num) => {
    return async (dispatch) => {
      try {
        // Check stunum at first
        dispatch(appActions.startRequest());
        const stunum_result = await authApi.queryStuNum(stu_num);
        console.log("parseStuNum: Got data"+JSON.stringify(stunum_result));
        dispatch(appActions.finishRequest());
        dispatch(parseStuNumSuccess(stunum_result));
        // Login as student
        dispatch(appActions.startRequest());
        dispatch(actions.clearError());
        const result = await authApi.login("test@test.com", "abcdefgh");
        console.log("stuLogin: Got data"+JSON.stringify(result));
        dispatch(loginResult(result));
      } catch (error) {
        dispatch(appActions.setError(error))
        dispatch(loginResult({error: {message: error.message}}));
      } finally {
        dispatch(appActions.finishRequest());
        dispatch(rspTimeStamp());
      }
    }
  },
  logout: () => ({
    type: types.LOGOUT
  }),
  clearError: () => ({
    type: types.CLEAR_ERR
  }),
  isAdmin: () => {
    // Use thunk to call selector with State ref. In order to peek state value only.
    return (dispatch, getState) => {
      let roles = getRoles(getState());
      if (!Array.isArray(roles) || roles.length < 1){
        return false;
      }
      return roles.includes("superadmin");
    }
  },
  isOfficer: () => {
    // Use thunk to call selector with State ref. In order to peek state value only.
    return (dispatch, getState) => {
      let roles = getRoles(getState());
      if (!Array.isArray(roles) || roles.length < 1){
        return false;
      }
      return roles.includes("normaladmin");
    }
  },
  isTeacher: () => {
    // Use thunk to call selector with State ref. In order to peek state value only.
    return (dispatch, getState) => {
      let roles = getRoles(getState());
      if (!Array.isArray(roles) || roles.length < 1){
        return false;
      }
      return roles.includes("teacher");
    }
  },
  isStudent: () => {
    // Use thunk to call selector with State ref. In order to peek state value only.
    return (dispatch, getState) => {
      let stuInfo = getStudentInfo(getState());
      if (!Array.isArray(stuInfo) || stuInfo.length < 1){
        return false;
      }
      return !!stuInfo.major_name;
    }
  },
}

const loginResult = (authResult) => {
  let name = null;
  let token = null;
  let user_id = -1, department_id = -1, labdiv_id = -1;
  let department_name = "", labdiv_name = "";
  let roles = [];
  if (authResult) {
    token = authResult.api_token;
    if (authResult.user) {
      name = authResult.user.name;
      if (authResult.user.firstName) {
        name = authResult.user.firstName;
      }
      if (authResult.user.lastName) {
        name += authResult.user.lastName;
      }
      if (authResult.user.id) {
        user_id = authResult.user.id;
      }
      if (authResult.user.department_id) {
        department_id = authResult.user.department_id;
        if (authResult.user.department_name) {
          department_name = authResult.user.department_name;
        }
      }
      if (authResult.user.labdivision_id) {
        labdiv_id = authResult.user.labdivision_id
        if (authResult.user.labdivision_name) {
          labdiv_name = authResult.user.labdivision_name;
        }
      }
      if (authResult.user.groups) {
        roles = authResult.user.groups;
      }
    }
  }
  return {
    type: types.LOGIN,
    userToken: token,
    userName: name,
    id: user_id,
    departmentId: department_id,
    departmentName: department_name,
    labdivisionId: labdiv_id,
    labdivisionName: labdiv_name,
    roles: roles,
    error: authResult.error,
  }
}

const parseStuNumSuccess = (data) => {
  return ({
    type: types.STUNUM,
    data
  })
}

const rspTimeStamp = () => {
  return ({
    type: types.TIMESTAMP,
    data: new Date().getTime(),
  })
}

// reducers
const userInfo = (state = Immutable.fromJS({}), action) => {
  switch(action.type) {
    case types.LOGIN:
      return Immutable.fromJS({ token: action.userToken, name: action.userName, id: action.id,
        departmentId: action.departmentId, departmentName: action.departmentName,
        labdivisionId: action.labdivisionId, labdivisionName: action.labdivisionName,
        roles: action.roles
      });
    case types.LOGOUT:
      return Immutable.fromJS({ token: null, name: null, id: 0, departmentId: 0, departmentName: "", labdivisionId: 0, labdivisionName: "", roles: []});
    default:
      return state;
  }
}

const error = ( state = Immutable.fromJS({}), action) => {
  switch(action.type) {
    case types.LOGIN:
      return action.error ? Immutable.fromJS(action.error) : Immutable.fromJS({});
    case types.LOGOUT:
    case types.CLEAR_ERR:
      return Immutable.fromJS({});
    default:
      return state;
  }
}

const stuInfo = ( state = Immutable.fromJS({}), action) => {
  switch(action.type) {
    case types.STUNUM:
      return Immutable.fromJS(action.data);
    default:
      return state;
  }
}

const timeStamp = ( state = Immutable.fromJS({}), action) => {
  switch(action.type) {
    case types.TIMESTAMP:
      return Immutable.fromJS(action.data);
    default:
      return state;
  }
}

const reducer = combineReducers({
  userInfo,
  stuInfo,
  error,
  timeStamp,
});

export default reducer;
// selectors
export const getLoggedUser = state => {
  return state.getIn(["auth", "userInfo"]).toJS();
};

export const getLoggedError = state => {
  return state.getIn(["auth", "error"]).toJS();
}

export const getRoles = state => {
  let roles = state.getIn(["auth", "userInfo", "roles"]);
  return roles?roles.toJS():[];
};

export const getStudentInfo = state => {
  return state.getIn(["auth", "stuInfo"]).toJS();
};

export const getDepartmentId = state => {
  return state.getIn(["auth", "userInfo", "departmentId"]);
};

export const getRspTimeStamp = state => {
  return state.getIn(["auth", "timeStamp"]);
};

export const getAccessLevel = createSelector(
  getRoles, getStudentInfo,
  (roles, stuInfo) => {
    let level = "ZERO";
    if (stuInfo && stuInfo.major_name){
      level = "STUDENT";
    }
    if (!Array.isArray(roles) || roles.length < 1){
      return level;
    }
    if (roles.includes("superadmin")) {
      return "ADMIN";
    }
    if (roles.includes("normaladmin")) {
      return "OFFICER";
    }
    if (roles.includes("teacher")) {
      return "PROFESSOR";
    }
    return level;
  }
);
