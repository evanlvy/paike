import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { actions as appActions } from './app';

import { api as authApi } from '../../services/auth';

// types
export const types = {
  LOGIN: "AUTH/LOGIN",
  LOGOUT: "AUTH/LOGOUT",
};

// actions
export const actions = {
  login: (username, password) => {
    return async (dispatch) => {
      try {
        dispatch(appActions.startRequest());
        const result = await authApi.login(username, password);
        console.log("login: Got data"+JSON.stringify(result));
        dispatch(appActions.finishRequest());
        dispatch(loginResult(result));
      } catch (error) {
        dispatch(appActions.setError(error))
        dispatch(loginResult({error: {message: error.message}}));
      }
    }
  },
  logout: () => ({
    type: types.LOGOUT
  }),
}

const loginResult = (authResult) => {
  let name = null;
  let token = null;
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
    }
  }
  return {
    type: types.LOGIN,
    userToken: token,
    userName: name,
    error: authResult.error,
  }
}

// reducers
const userInfo = (state = Immutable.fromJS({}), action) => {
  switch(action.type) {
    case types.LOGIN:
      return Immutable.fromJS({ token: action.userToken, name: action.userName });
    case types.LOGOUT:
      return Immutable.fromJS({ token: null, name: null });
    default:
      return state;
  }
}

const error = ( state = Immutable.fromJS({}), action) => {
  switch(action.type) {
    case types.LOGIN:
      return action.error ? Immutable.fromJS(action.error) : Immutable.fromJS({});
    case types.LOGOUT:
      return Immutable.fromJS({});
    default:
      return state;
  }
}

const reducer = combineReducers({
  userInfo,
  error,
});

export default reducer;

// selectors
export const getLoggedUser = state => {
  return state.getIn(["auth", "userInfo"]).toJS();
};

export const getLoggedError = state => {
  return state.getIn(["auth", "error"]).toJS();
}
