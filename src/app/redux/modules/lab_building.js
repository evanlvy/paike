import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as labApi } from '../../services/lab';

// action types
export const types = {
  FETCH_LAB_BUILDINGS: "LAB/FETCH_LAB_BUILDINGS"
};

// actions
export const actions = {
  fetchLabBuildings: () => {
    return (dispatch, getState) => {
      try {
        if (shouldFetchLabBuildings(getState())) {
          console.log("fetchLabBuildings");
          dispatch(appActions.startRequest());
          const data = labApi.queryLabBuildings();
          dispatch(appActions.finishRequest());
          const { buildingByIds, buildingIds } = convertLabBuildingsToPlain(data);
          dispatch(fetchLabBuildingsSuccess(buildingByIds, buildingIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  }
}

const shouldFetchLabBuildings = (state) => {
  const allIds = getAllLabBuildings(state);
  return !allIds || allIds.size === 0;
}

const convertLabBuildingsToPlain = (labBuildings) => {
  let buildingByIds = {};
  let buildingIds = [];
  console.log("Got LabBuildings data: "+JSON.stringify(labBuildings));
  labBuildings.forEach(item => {
    buildingByIds[item.id] = { ...item };
    buildingIds.push(item.id);
  });
  return {
    buildingByIds,
    buildingIds
  }
}

const fetchLabBuildingsSuccess = (labBuildingByIds, allLabBuildings) => {
  return ({
    type: types.FETCH_LAB_BUILDINGS,
    labBuildingByIds,
    allLabBuildings
  })
}

// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LAB_BUILDINGS:
      return state.merge(action.labBuildingByIds);
    default:
      return state;
  }
}

const allIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LAB_BUILDINGS:
      return Immutable.List(action.allLabBuildings);
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  allIds,
});

export default reducer;

// selectors
export const getAllLabBuildings = state => state.getIn(["lab_building", "allIds"]);

export const getLabBuildings = state => state.getIn(["lab_building", "byIds"]);

export const getLabBuildingById = (state, id) => state.getIn(["lab_building", "byIds", id]);

export const getAllLabBuildingsInfo = createSelector(
  [getAllLabBuildings, getLabBuildings],
  (buildingsList, buildings) => {
    let buildingInfo = buildingsList.map(id => {
      const building = buildings.get(id);
      return building;
    });
    buildingInfo.length = buildingsList.size;
    return buildingInfo;
  }
)
