import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { DATA_EXPIRATION_TIME } from './common/info';
import { actions as appActions } from './app';
import { getCenter, getCenterIds } from './jiaoyanshi';
import { api as labApi } from '../../services/lab';

// action types
export const types = {
  FETCH_LABS: "LAB/FETCH_LABS",
};

// actions
export const actions = {
  fetchLabs: (centerId, year, week) => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchLabs(centerId, year, week, getState())) {
          dispatch(appActions.startRequest());
          const data = await labApi.queryLabs(centerId, year, week);
          dispatch(appActions.finishRequest());
          const { labByIds, labIds, shixunByLabSchedList, shixunByIds } = convertLabsToPlain(year, week, data);
          dispatch(fetchLabsSuccess(centerId, labIds, labByIds, shixunByLabSchedList, shixunByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  }
}

const shouldFetchLabs = (centerId, year, week, state) => {
  const labIds = state.getIn(["lab", "byCenter", ""+centerId]);
  if (!labIds) {
    console.log("shouldFetchLabs, no labs exists");
    return true;
  }
  for (let i=0; i < labIds.length; i++) {
    const labId = labIds[i];
    const shixunWeekInfo = state.getIn(["lab", "shixunByLabSched", buildLabSchedId(labId, year, week)]);
    if (!shixunWeekInfo || Date.now()-shixunWeekInfo.update > DATA_EXPIRATION_TIME) {
      console.log(`shouldFetchLabs, id: ${buildLabSchedId(labId, year, week)}`);
      return true;
    }
  };
  console.log("shouldFetchLabs: no need fetch data");
  return false;
}

const fetchLabsSuccess = (centerId, labIds, labByIds, shixunByLabSchedList, shixunByIds) => {
  return ({
    type: types.FETCH_LABS,
    centerId,
    labIds,
    labByIds,
    shixunByLabSchedList,
    shixunByIds,
  })
}

export const buildLabSchedId = (labId, year, week) => {
  return labId+"_"+year+(week < 10 ? "0"+week : ""+week);
}

const convertLabsToPlain = (year, week, labs) => {
  let labByIds = {};
  let labIds = [];
  let shixunByLabSchedList = {};
  let shixunByIds = {};
  //console.log("Got Labs data: "+JSON.stringify(labs));
  labs.forEach(lab => {
    labByIds[lab.id] = { ...lab, used: lab.used && lab.used.length > 0 };
    labIds.push(lab.id);
    const labSchedId = buildLabSchedId(lab.id, year, week);
    if (shixunByLabSchedList[labSchedId] == null) {
      shixunByLabSchedList[labSchedId] = { schedules:[] };
    }
    shixunByLabSchedList[labSchedId].update = Date.now();
    if (lab.used && lab.used.length > 0) {
      lab.used.forEach(shixun => {
          shixunByIds[shixun.id] = {...shixun};
          if (shixun.week === week) {
            const hourIndex = (shixun.index-1)/2;
            let shixunInWeek = shixunByLabSchedList[labSchedId].schedules;
            if (shixunInWeek[shixun.day_in_week-1] == null) {
              shixunInWeek[shixun.day_in_week-1] = [];
            }
            let shixunInDay = shixunInWeek[shixun.day_in_week-1];
            if (shixunInDay[hourIndex] == null) {
              shixunInDay[hourIndex] = [];
            }
            shixunInDay[hourIndex].push(shixun.id+"");
          }
      });
    }
  });
  console.log(`shixunByLabSchedList data: ${JSON.stringify(shixunByLabSchedList)}`);
  return {
    labByIds,
    labIds,
    shixunByLabSchedList,
    shixunByIds,
  };
}

// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LABS:
      return state.merge(action.labByIds);
    default:
      return state;
  }
}

const byCenter = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LABS:
      return state.merge({[action.centerId]: action.labIds});
    default:
      return state;
  }
}

const shixunByLabSched = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LABS:
      return state.merge(action.shixunByLabSchedList);
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  byCenter,
  shixunByLabSched,
});

export default reducer;

// selectors
export const getLabs = state => state.getIn(["lab", "byIds"]);

export const getLabsByCenters = state => state.getIn(["lab", "byCenter"]);

export const getShiXunByLabSched = state => state.getIn(["lab", "shixunByLabSched"]);

export const getLabsByAllCenter = createSelector(
  [getCenterIds, getCenter, getLabsByCenters, getLabs],
  (centerIds, centers, labsByCenters, labs) => {
    let centersInfo = {};
    if (!centerIds || !centers || !labsByCenters || !labs) {
      return centersInfo;
    }
    centerIds.forEach(centerId => {
      console.log("labsByCenter.get "+centerId);
      const center = centers.get(centerId);
      const labsByCenter = labsByCenters.get(centerId);
      if (labsByCenter) {
        let labListByCenter = [];
        labsByCenter.forEach(labId => {
          const labInfo = labs.get(labId+"");
          labListByCenter.push({id: labInfo.id, title: labInfo.location});
        });
        center["labs"] = labListByCenter;
        //console.log("build center: "+JSON.stringify(center));
        centersInfo[centerId] = center;
      }
    });
    return centersInfo;
  }
)
