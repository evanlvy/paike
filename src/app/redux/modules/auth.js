import Immutable from 'immutable';
import { actions as appActions } from './app';

import { api as authApi } from '../../services/auth';

// initial state
const initialState = Immutable.fromJS({
  userToken: null,
  userName: null,
});

export const types = {
  LOGIN: "AUTH/LOGIN",
  LOGOUT: "AUTH/LOGOUT",
};

// actions
export const actions = {
  login: (username, password) => {
    return (dispatch) => {
      try {
        dispatch(appActions.startRequest());
        const data = authApi.login(username, password);
        console.log("login: Got data"+JSON.stringify(data));
        dispatch(appActions.finishRequest());
        dispatch(actions.setLoginInfo(data.token, data.username));
      } catch (error) {
        dispatch(appActions.setError(error))
      }
    }
  },
  logout: () => ({
    type: types.LOGOUT
  }),
  setLoginInfo : (token, username) => ({
    type: types.LOGIN,
    userToken: token,
    userName: username,
  })
}

// reducers
const reducer = (state = initialState, action) => {
  switch(action.type) {
    case types.LOGIN:
      console.log("LOGIN: token: "+action.userToken+", name: "+action.userName);
      return state.merge({ userToken: action.userToken, userName: action.userName });
    case types.LOGOUT:
      return state.merge({ userToken: null, userName: null });
    default:
      return state;
  }
}

export default reducer;

// selectors
export const getLoggedUser = state => {
  return state.get("auth");
};
