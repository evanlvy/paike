import Immutable, { isImmutable } from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as jiaoyanshiApi } from '../../services/jiaoyanshi';

// colors
const colors = [
  "gray.400", "red.400", "blue.400",
  "orange.300", "cyan.500", "purple.500",
  "pink.500", "teal.400", "green.800",
];

// action types
export const types = {
  FETCH_JIAOYANSHI: "JIAOYANSHI/FETCH_JIAOYANSHI"
};

// actions
export const actions = {
  fetchJiaoyanshi: () => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchJiaoyanshi(getState())) {
          dispatch(appActions.startRequest());
          const data = await jiaoyanshiApi.queryJiaoyanshi();
          dispatch(appActions.finishRequest());
          const { centerByIds, centerIds, jiaoyanshiByIds, jiaoyanshiIds, jiaoyanshiByCenter } = convertJiaoyanshiToPlain(data);
          dispatch(fetchJiaoyanshiSuccess(centerIds, centerByIds, jiaoyanshiByCenter, jiaoyanshiByIds, jiaoyanshiIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
  getJysDictByFaculty: (fac_id=-1) => {
    // Use thunk to call selector with State ref. In order to peek state value only.
    return (dispatch, getState) => {
      const state = getState();
      return getJysDictByFac(state, fac_id);
    }
  },
}

const shouldFetchJiaoyanshi = (state) => {
  const jiaoyanshiByIds = getJiaoyanshi(state);
  return !jiaoyanshiByIds || jiaoyanshiByIds.size === 0;
}

const fetchJiaoyanshiSuccess = (centerIds, centerByIds, jiaoyanshiByCenter, jiaoyanshiByIds, jiaoyanshiIds) => {
  return ({
    type: types.FETCH_JIAOYANSHI,
    centerIds,
    centerByIds,
    jiaoyanshiByCenter,
    jiaoyanshiByIds,
    jiaoyanshiIds
  })
}

const convertJiaoyanshiToPlain = (data) => {
  let jiaoyanshiByIds = {};
  let jiaoyanshiIds = [];
  let jiaoyanshiByCenter = {};
  let centerByIds = {};
  let centerIds = [];
  //console.log("Got JiaoYanShi data: "+JSON.stringify(data));
  let colorIndex = 1;
  const jysList = data;
  jysList.forEach(item => {
    jiaoyanshiByIds[item.id] = { ...item, title: item.name};
    if (item.center_id > 0) {
      let item_color;
      if (!centerByIds[item.center_id]) {
        item_color = colors[colorIndex];
        colorIndex = (colorIndex+1) % colors.length;
        centerByIds[item.center_id] = {id: item.center_id, name: item.department_center, title: item.department_center, color: item_color};
        centerIds.push(""+item.center_id);
      } else {
        item_color = centerByIds[item.center_id].color;
      }
      jiaoyanshiByIds[item.id].color = item_color;
      if (!jiaoyanshiByCenter[item.center_id]) {
        jiaoyanshiByCenter[item.center_id] = [];
      }
      jiaoyanshiByCenter[item.center_id].push(""+item.id);
      jiaoyanshiIds.push(""+item.id);
    }
  });
  return {
    centerByIds,
    centerIds,
    jiaoyanshiByIds,
    jiaoyanshiIds,
    jiaoyanshiByCenter
  };
}
// reducers
const jiaoyanshiByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return state.merge(action.jiaoyanshiByIds);
    default:
      return state;
  }
}

const jiaoyanshiIds = (state = Immutable.fromJS([]), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return Immutable.List(action.jiaoyanshiIds);
    default:
      return state;
  }
}

const jiaoyanshiByCenter = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return state.merge(action.jiaoyanshiByCenter);
    default:
      return state;
  }
}

const centerByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_JIAOYANSHI:
      return state.merge(action.centerByIds);
    default:
      return state;
  }
}

const centerIds = (state = Immutable.fromJS([]), action) => {
  switch(action.type) {
    case types.FETCH_JIAOYANSHI:
      return Immutable.List(action.centerIds);
    default:
      return state;
  }
}

const reducer = combineReducers({
  jiaoyanshiByIds,
  jiaoyanshiIds,
  jiaoyanshiByCenter,
  centerByIds,
  centerIds
});

export default reducer;

// selectors
export const getJiaoyanshi = state => state.getIn(["jiaoyanshi", "jiaoyanshiByIds"]).sortBy(o => o["id"]);

export const getJiaoyanshiIds = state => state.getIn(["jiaoyanshi", "jiaoyanshiIds"]);

export const getJiaoyanshiByCenters = state => state.getIn(["jiaoyanshi", "jiaoyanshiByCenter"]);

export const getCenter = state => state.getIn(["jiaoyanshi", "centerByIds"]);

export const getCenterIds = state => state.getIn(["jiaoyanshi", "centerIds"]);

export const getJysDictByFac = (state, fac_id=-1) => {
  // Use thunk to call selector with State ref. In order to peek state value only.
  let jys = getJiaoyanshi(state);
  let jys_list = jys;
  if (fac_id > 0) {
    jys_list = jys.filter(o => (o["faculty_id"] === fac_id));
  }
  let jys_out = {};
  jys_list.forEach(jys_obj => {
    jys_out[jys_obj["id"]+""] = jys_obj["title"];
  });
  return jys_out;  // {"1": "Computer Dep.", "2": "Chemistry"...}
  //return jys_out.map(jys_obj => {
    // Just return id and name
    //return {id: jys_obj["id"], title: jys_obj["title"]};
    //return {[jys_obj["id"]]: jys_obj["title"]};
  //});
}

export const getAllJiaoyanshi = createSelector(
  [getJiaoyanshiIds, getJiaoyanshi],
  (jysIds, jys) => {
    if (!jysIds || !jys) {
      return [];
    }
    let jysList = [];
    jysIds.forEach(id => {
      const jysInfo = jys.get(id);
      jysList.push(jysInfo);
    });
    return jysList;
  }
)

/*export const getAllJiaoyanshi = createSelector(
  [getJiaoyanshiIds, getJiaoyanshi],
  (jysIds, jys) => {
    if (!jysIds || !jys) {
      return [];
    }
    return jys.filter(o => (jysIds.indexOf(""+o["id"]) >= 0)).values();
  }
)*/

export const getColoredJysList = createSelector(
  // Without Social Science!
  getJiaoyanshi,
  (jyses) => {
    if (!jyses) {
      return [];
    }
    return jyses.reduce((accumulator, jys) => {
      return (!jys.center_id || jys.center_id <= 0)?accumulator:accumulator.concat({id: jys.id, name: jys.name, color: jys.color});
    }, []);
  }
)

export const getJiaoyanshiOfAllCenters = createSelector(
  [getCenterIds, getCenter, getJiaoyanshiByCenters, getJiaoyanshi],
  (centerIds, centers, jysByCenters, jys) => {
    let jysInfo = [];
    if (!centerIds || !centers || !jysByCenters || !jys) {
      return [];
    }
    centerIds.forEach(id => {
      const center = centers.get(id);
      const jysByCenter = jysByCenters.get(id);
      //console.log("jysByCenters.get "+id);
      let jysInfoByCenters = [];
      jysByCenter.forEach(jysId => {
        jysInfoByCenters.push(jys.get(jysId));
      });
      center["jiaoyanshi"] = jysInfoByCenters;
      //console.log("build center: "+JSON.stringify(center));
      jysInfo.push(center);
    });
    return jysInfo;
  }
);
