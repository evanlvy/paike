import Immutable from "immutable";

// Init State
const initialState = Immutable.fromJS({
  requestsCount: 0,
  error: null
});

// Action types
export const types = {
  START_REQUEST: "APP/START_REQUEST",
  FINISH_REQUEST: "APP/FINISH_REQUEST",
  SET_ERROR: "APP/SET_ERROR",
  REMOVE_ERROR: "APP/REMOVE_ERROR",
  SET_TOAST: "APP/SET_TOAST",
  SET_SPINNER: "APP/SET_SPINNER",
}

// Action Creator
export const actions = {
  startRequest: () => ({
    type: types.START_REQUEST
  }),
  finishRequest: () => ({
    type: types.FINISH_REQUEST
  }),
  setError: (error) => ({
    type: types.SET_ERROR,
    error
  }),
  removeError: () => ({
    type: types.REMOVE_ERROR
  }),
  setToast: (toast) => ({
    type: types.SET_TOAST,
    toast
  }),
  setSpinner: (enabled) => ({
    type: types.SET_SPINNER,
    enabled
  }),
}

// reducer
const reducer = (state = initialState, action) => {
  switch(action.type) {
    case types.START_REQUEST:
      return state.merge({ requestsCount: state.get("requestsCount")+1 })
    case types.FINISH_REQUEST:
      return state.merge({ requestsCount: state.get("requestsCount")-1 });
    case types.SET_ERROR:
      return state.merge({ requestsCount: state.get("requestsCount")-1, error: action.error });
    case types.REMOVE_ERROR:
      return state.merge({ error: null });
    case types.SET_TOAST:
      return state.merge({ toast: action.toast });
    case types.SET_SPINNER:
      return state.merge({ spinner: action.enabled });
    default:
      return state;
  }
}

export default reducer;

// selectors
export const getError = state => {
  return state.getIn(["app", "error"]);
};

// toast type: ['success', 'error', 'warning', 'info']
export const getToast = state => {
  return state.getIn(["app", "toast"]);
};

export const getRequestQuantity = state => {
  return state.getIn(["app", "requestsCount"]);
};

export const getSpinner = state => {
  return state.getIn(["app", "spinner"]);
};
