import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { DATA_EXPIRATION_TIME } from './common/info';
import { actions as appActions } from './app';
import { api as kebiaoApi } from '../../services/kebiao';

import { types as labTypes, buildLabSchedId, getShiXunByLabSched } from './lab';
import { types as teacherTypes, buildTeacherSchedId, getKebiaoByTeacherSched } from './teacher';

// action types
export const types = {
  FETCH_LILUN_BY_BANJI: "KEBIAO/FETCH_LILUN_BY_BANJI",
  FETCH_KEBIAO_BY_BANJI: "KEBIAO/FETCH_KEBIAO_BY_BANJI",
  FETCH_SHIXUN: "KEBIAO/FETCH_SHIXUN",
  UPDATE_KEBIAO: "KEBIAO/UPDATE_KEBIAO",
};

// actions
export const actions = {
  fetchLiLunByBanji: (banjiIds, year, weekStart, weekEnd) => {
    console.log(`fetchLiLunByBanji: ids: ${JSON.stringify(banjiIds)}, year: ${year}, weekStart: ${weekStart}, weekEnd: ${weekEnd}`);
    return async (dispatch, getState) => {
      try {
        if (shouldFetchKebiaoData("liLunByBanjiSched", banjiIds, year, weekStart, weekEnd, getState())) {
          dispatch(appActions.startRequest());
          const data = await kebiaoApi.queryLiLunByBanji(banjiIds, year, weekStart, weekEnd);
          dispatch(appActions.finishRequest());
          const { kebiaoByBanjiSched, kebiaoByIds } = convertKeBiaoByBanjiToPlain(data, year);
          dispatch(fetchLiLunByBanjiSuccess(kebiaoByBanjiSched, kebiaoByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
  fetchKeBiaoByBanji: (banjiIds, year, weekStart, weekEnd) => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchKebiaoData("kebiaoByBanjiSched", banjiIds, year, weekStart, weekEnd, getState())) {
          dispatch(appActions.startRequest());
          const data = await kebiaoApi.queryKeBiaoByBanji(banjiIds, year, weekStart, weekEnd);
          dispatch(appActions.finishRequest());
          const { kebiaoByBanjiSched, kebiaoByIds } = convertKeBiaoByBanjiToPlain(data, year);
          dispatch(fetchKeBiaoByBanjiSuccess(kebiaoByBanjiSched, kebiaoByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
  fetchShiXun: (jiaoyanshiIds, year, week) => {
    return async (dispatch, getState) => {
      try {
        if (shouldFetchShiXun(jiaoyanshiIds, year, week, getState())) {
          dispatch(appActions.startRequest());
          const data = await kebiaoApi.queryShiXunByJiaoyanshi(jiaoyanshiIds, year, week);
          dispatch(appActions.finishRequest());
          const { kebiaoByJiaoyanshiSched, kebiaoByIds } = convertShiXunByJiaoyanshiToPlain(data, year);
          dispatch(fetchShiXunByJiaoyanshiSuccess(kebiaoByJiaoyanshiSched, kebiaoByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  },
  updateKebiao: (oldKebiao, kebiao, year, oldWeek, newWeek) => {
    return async (dispatch, getState) => {
      try {
        dispatch(appActions.startRequest());
        const data = await kebiaoApi.updateKebiao(kebiao);
        dispatch(appActions.finishRequest());
        const { kebiaoByIds, shixunByJiaoyanshiSched, kebiaoByBanjiShed, kebiaoByLabSched, kebiaoByTeacherSched } = convertKebiaoToPlain(getState(), oldKebiao, data, year, oldWeek, newWeek);
        dispatch(updateKebiaoSuccess(kebiaoByIds, shixunByJiaoyanshiSched, kebiaoByBanjiShed, kebiaoByLabSched, kebiaoByTeacherSched));
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  }
}

export const buildBanjiSchedId = (banjiId, year, week) => {
  return banjiId+"_"+year+(week < 10 ? "0"+week : ""+week);
}

const shouldFetchKebiaoData = (dataName, banjiIds, year, weekStart, weekEnd, state) => {
  console.log(`shouldFetchKebiaoData, dataName:${dataName}, banjiIds: ${JSON.stringify(banjiIds)}, year: ${year}, weekStart: ${weekStart}, weekEnd: ${weekEnd}`);
  for(let i=0; i < banjiIds.length; i++) {
    const banjiId = banjiIds[i];
    for (let week=weekStart; week < weekEnd; week++) {
      const banjiSchedId = buildBanjiSchedId(banjiId, year, week);
      const kebiaoByBanjiSched = state.getIn(["kebiao", dataName, banjiSchedId])
      if (!kebiaoByBanjiSched || Date.now() - kebiaoByBanjiSched.update > DATA_EXPIRATION_TIME) {
        console.log(`shouldFetchKebiaoData, dataName:${dataName}, id: ${banjiSchedId}`);
        return true;
      }
    }
  }
  console.log("shouldFetchKebiaoData: no need fetch data");
  return false;
}

const convertKeBiaoByBanjiToPlain = (banjiInfoList, year) => {
  let kebiaoByBanjiSched = {}, kebiaoByIds = {};
  banjiInfoList.forEach(banjiInfo => {
    const banjiId = banjiInfo.class_id;
    const schedInfo = banjiInfo.schedules;
    const weekKeys = Object.keys(schedInfo);
    weekKeys.forEach(weekKey => {
      const result = weekKey.match(/第([0-9]+)周/);
      if (result && result.length === 2) {
        const week = result[1];
        const banjiSchedId = buildBanjiSchedId(banjiId, year, week);
        let kebiaoByWeek = [];
        const schedInfoWeek = schedInfo[weekKey];
        for (let i=1; i < 8; i++) {
          let kebiaoByDay = [null, null, null, null, null, null];
          const schedInfoDay = schedInfoWeek["星期"+i];
          if (schedInfoDay) {
            schedInfoDay.forEach(kebiao => {
              kebiaoByIds[kebiao.id] = {...kebiao};
              const kebiaoIndex = (kebiao.index-1)/2;
              if (kebiaoByDay[kebiaoIndex] == null) {
                kebiaoByDay[kebiaoIndex] = [];
              }
              kebiaoByDay[kebiaoIndex].push(""+kebiao.id);
            })
          }
          kebiaoByWeek.push(kebiaoByDay);
        }
        kebiaoByBanjiSched[banjiSchedId] = { schedules: kebiaoByWeek, update: Date.now() };
      }
    });
  })
  return {kebiaoByBanjiSched, kebiaoByIds};
}

const fetchLiLunByBanjiSuccess = (lilunByBanjiSchedList, lilunByIds) => {
  return {
    type: types.FETCH_LILUN_BY_BANJI,
    lilunByBanjiSchedList,
    lilunByIds,
  };
}

const fetchKeBiaoByBanjiSuccess = (kebiaoByBanjiSchedList, kebiaoByIds) => {
  return {
    type: types.FETCH_KEBIAO_BY_BANJI,
    kebiaoByBanjiSchedList,
    kebiaoByIds,
  };
}

export const buildJysSchedId = (jiaoyanshi, year, week) => {
  return jiaoyanshi+"_"+year+(week < 10 ? "0"+week : ""+week);
}

export const parseJysSchedId = (jysShedId) => {
  const parts = jysShedId.split("_");
  if (parts && parts.length === 2) {
    return {
      jysId: parts[0],
      year: parts[1].substring(0, 4),
      week: parts[1].substring(4),
    }
  }
  return {};
}

const shouldFetchShiXun = (jiaoyanshiIds, year, week, state) => {
  for(let i=0; i < jiaoyanshiIds.length; i++) {
    const jiaoyanshiId = jiaoyanshiIds[i];
    const jiaoyanshiSchedId =  buildJysSchedId(jiaoyanshiId, year, week);
    const shixunByJiaoyanshiSched = state.getIn(["kebiao", "shiXunByJiaoyanshiSched", jiaoyanshiSchedId])
    if (!shixunByJiaoyanshiSched || Date.now() - shixunByJiaoyanshiSched.update > DATA_EXPIRATION_TIME) {
      console.log(`shouldFetchShiXun, id: ${jiaoyanshiSchedId}`);
      return true;
    }
  }
  console.log("shouldFetchShiXun: no need fetch data");
  return false;
}

const convertShiXunByJiaoyanshiToPlain = (jiaoyanshiInfoList, year) => {
  let kebiaoByJiaoyanshiSched = {}, kebiaoByIds = {};
  jiaoyanshiInfoList.forEach(jiaoyanshiInfo => {
    const jiaoyanshiId = jiaoyanshiInfo.dep_id;
    const schedInfo = jiaoyanshiInfo.schedules;
    const weekKeys = Object.keys(schedInfo);
    weekKeys.forEach(weekKey => {
      const result = weekKey.match(/第([0-9]+)周/);
      if (result && result.length === 2) {
        const week = result[1];
        const jiaoyanshiSchedId = buildJysSchedId(jiaoyanshiId, year, week);
        let kebiaoByWeek = [];
        const schedInfoWeek = schedInfo[weekKey];
        for (let i=1; i < 8; i++) {
          let kebiaoByDay = [null, null, null, null, null, null];
          const schedInfoDay = schedInfoWeek["星期"+i];
          if (schedInfoDay) {
            schedInfoDay.forEach(kebiao => {
              kebiaoByIds[kebiao.id] = {...kebiao};
              const kebiaoIndex = (kebiao.index-1)/2
              if (kebiaoByDay[kebiaoIndex] == null) {
                kebiaoByDay[kebiaoIndex] = [];
              }
              kebiaoByDay[kebiaoIndex].push(""+kebiao.id);
            })
          }
          kebiaoByWeek.push(kebiaoByDay);
        }
        kebiaoByJiaoyanshiSched[jiaoyanshiSchedId] = { schedules: kebiaoByWeek, update: Date.now() };
      }
    });
  });
  return {
    kebiaoByJiaoyanshiSched,
    kebiaoByIds
  }
}

const fetchShiXunByJiaoyanshiSuccess = (shixunByJiaoyanshiSched, shixunByIds) => {
  return {
    type: types.FETCH_SHIXUN,
    shixunByJiaoyanshiSched,
    shixunByIds,
  };
}

const clearSchedWeek = (schedWeek, dayIndex, hourIndex, kebiaoId) => {
  if (schedWeek && schedWeek.schedules && schedWeek.schedules.length > 0) {
    let schedDay = schedWeek.schedules[dayIndex];
    if (!schedDay) {
      return schedWeek;
    }
    let schedHours = schedDay[hourIndex];
    if (!schedHours) {
      return schedWeek;
    }
    schedDay[hourIndex] = schedHours.filter(id => id !== kebiaoId+"");
  }
  return schedWeek;
}

const updateSchedWeek = (schedWeek, dayIndex, hourIndex, kebiaoId) => {
  if (!schedWeek) {
    let kebiaoByWeek = [];
    for (let i=1; i < 8; i++) {
      kebiaoByWeek.push([null, null, null, null, null, null]);
    }
    schedWeek = { schedules: kebiaoByWeek, update: Date.now() };
  }
  let schedDay = schedWeek.schedules[dayIndex];
  if (!schedDay) {
    schedWeek.schedules[dayIndex] = [null, null, null, null, null, null];
    schedDay = schedWeek.schedules[dayIndex];
  }
  if (schedDay[hourIndex] == null) {
    schedDay[hourIndex] = [];
  }
  schedDay[hourIndex].push(""+kebiaoId);
  return schedWeek;
}

const updateKebiaoSched = (state, oldKebiao, newKebiao, year, oldWeek, newWeek) => {
  const oldDayIndex = oldKebiao.day_in_week-1;
  const oldHourIndex = (oldKebiao.index-1)/2;

  const newDayIndex = newKebiao.day_in_week-1;
  const newHourIndex = (newKebiao.index-1)/2;

  let shixunByJiaoyanshiSched = {};
  if (oldKebiao.jys) {
    let jysSchedId = buildJysSchedId(oldKebiao.jys.id, year, oldWeek);
    let jysSchedWeek = getShiXunByJysSched(state).get(jysSchedId);
    if (jysSchedWeek) {
      jysSchedWeek = clearSchedWeek(jysSchedWeek, oldDayIndex, oldHourIndex, oldKebiao.id);
      shixunByJiaoyanshiSched[jysSchedId] = jysSchedWeek;
    }
    jysSchedId = buildJysSchedId(oldKebiao.jys.id, year, newWeek);
    jysSchedWeek = shixunByJiaoyanshiSched[jysSchedId] != null ? shixunByJiaoyanshiSched[jysSchedId] : getShiXunByJysSched(state).get(jysSchedId);
    jysSchedWeek = updateSchedWeek(jysSchedWeek, newDayIndex, newHourIndex, newKebiao.id);
    shixunByJiaoyanshiSched[jysSchedId] = jysSchedWeek;
  }

  let kebiaoByBanjiShed = {};
  if (oldKebiao.class_id > 0) {
    const banjiSchedId = buildBanjiSchedId(oldKebiao.class_id, year, oldWeek);
    let banjiSchedWeek = getKebiaoByBanjiSched(state).get(banjiSchedId);
    if (banjiSchedWeek) {
      banjiSchedWeek = clearSchedWeek(banjiSchedWeek, oldDayIndex, oldHourIndex, oldKebiao.id);
      kebiaoByBanjiShed[banjiSchedId] = banjiSchedWeek;
    }
  }
  if (newKebiao.class_id > 0) {
    const banjiSchedId = buildBanjiSchedId(newKebiao.class_id, year, newWeek);
    let banjiSchedWeek = kebiaoByBanjiShed[banjiSchedId] != null ? kebiaoByBanjiShed[banjiSchedId] : getKebiaoByBanjiSched(state).get(banjiSchedId);
    banjiSchedWeek = updateSchedWeek(banjiSchedWeek, newDayIndex, newHourIndex, newKebiao.id);
    kebiaoByBanjiShed[banjiSchedId] = banjiSchedWeek;
  }

  let kebiaoByLabSched = {};
  if (oldKebiao.lab_id > 0) {
    const labSchedId = buildLabSchedId(oldKebiao.lab_id, year, oldWeek);
    let labSchedWeek = getShiXunByLabSched(state).get(labSchedId);
    if (labSchedWeek) {
      labSchedWeek = clearSchedWeek(labSchedWeek, oldDayIndex, oldHourIndex, oldKebiao.id);
      kebiaoByLabSched[labSchedId] = labSchedWeek;
    }
  }
  if (newKebiao.lab_id > 0) {
    const labSchedId = buildLabSchedId(newKebiao.lab_id, year, newWeek);
    let labSchedWeek = kebiaoByLabSched[labSchedId] != null ? kebiaoByLabSched[labSchedId] : getShiXunByLabSched(state).get(labSchedId);
    labSchedWeek = updateSchedWeek(labSchedWeek, newDayIndex, newHourIndex, newKebiao.id);
    kebiaoByLabSched[labSchedId] = labSchedWeek;
  }

  let kebiaoByTeacherSched = {};
  if (oldKebiao.lab_teacher_id > 0) {
    const teacherSchedId = buildTeacherSchedId(oldKebiao.lab_teacher_id, year, oldWeek);
    let teacherSchedWeek = getKebiaoByTeacherSched(state).get(teacherSchedId);
    if (teacherSchedWeek) {
      teacherSchedWeek = clearSchedWeek(teacherSchedWeek, oldDayIndex, oldHourIndex, oldKebiao.id);
      kebiaoByTeacherSched[teacherSchedId] = teacherSchedWeek;
    }
  }
  if (newKebiao.lab_teacher_id > 0) {
    const teacherSchedId = buildTeacherSchedId(newKebiao.lab_teacher_id, year, newWeek);
    let teacherSchedWeek = kebiaoByTeacherSched[teacherSchedId] != null ? kebiaoByTeacherSched[teacherSchedId] : getKebiaoByTeacherSched(state).get(teacherSchedId);
    teacherSchedWeek = updateSchedWeek(teacherSchedWeek, newDayIndex, newHourIndex, newKebiao.id);
    kebiaoByTeacherSched[teacherSchedId] = teacherSchedWeek;
  }

  return {
    shixunByJiaoyanshiSched,
    kebiaoByBanjiShed,
    kebiaoByLabSched,
    kebiaoByTeacherSched
  };
}

const convertKebiaoToPlain = (state, oldKebiao, modifiedKebiaoList, year, oldWeek, newWeek) => {
  let kebiaoByIds = {};
  // clear old data
  let updateSchedules = {};
  modifiedKebiaoList.forEach(kebiao => {
    kebiaoByIds[kebiao.id] = {...kebiao};
    if (kebiao.id === oldKebiao.id) {
      updateSchedules = updateKebiaoSched(state, oldKebiao, kebiao, year, oldWeek, newWeek);
    }
  });
  const ret = {
    kebiaoByIds,
    ...updateSchedules,
  };
  console.log("convertKebiaoToPlain, ret: "+JSON.stringify(ret));
  return ret;
}

const updateKebiaoSuccess = (kebiaoByIds, shixunByJiaoyanshiSched, kebiaoByBanjiShed, kebiaoByLabSched, kebiaoByTeacherSched) => {
  return {
    type: types.UPDATE_KEBIAO,
    kebiaoByIds,
    shixunByJiaoyanshiSched,
    kebiaoByBanjiShed,
    kebiaoByLabSched,
    kebiaoByTeacherSched
  };
}

// reducers
const kebiaoByIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LILUN_BY_BANJI:
      return state.merge(action.lilunByIds);
    case types.FETCH_KEBIAO_BY_BANJI:
    case teacherTypes.FETCH_TEACHERS:
      return state.merge(action.kebiaoByIds);
    case types.UPDATE_KEBIAO:
      return state.merge(action.kebiaoByIds);
    case types.FETCH_SHIXUN:
    case labTypes.FETCH_LABS:
    case labTypes.FETCH_LABS_BY_ITEM:
      return state.merge(action.shixunByIds);
    default:
      return state;
  }
}

const liLunByBanjiSched = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_LILUN_BY_BANJI:
      return state.merge(action.lilunByBanjiSchedList);
    default:
      return state;
  }
}

const kebiaoByBanjiSched = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_KEBIAO_BY_BANJI:
      return state.merge(action.kebiaoByBanjiSchedList);
    case types.UPDATE_KEBIAO:
      return state.merge(action.kebiaoByBanjiShed);
    default:
      return state;
  }
}

const shiXunByJiaoyanshiSched = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_SHIXUN:
      return state.merge(action.shixunByJiaoyanshiSched);
    case types.UPDATE_KEBIAO:
      return state.merge(action.shixunByJiaoyanshiSched);
    default:
      return state;
  }
}

const reducer = combineReducers({
  kebiaoByIds,
  liLunByBanjiSched,
  kebiaoByBanjiSched,
  shiXunByJiaoyanshiSched
});

export default reducer;

// selectors
export const getKebiao = state => state.getIn(["kebiao", "kebiaoByIds"]);

export const getLiLunByBanjiSched = state => state.getIn(["kebiao", "liLunByBanjiSched"]);
export const getLiLunByAllBanjiSched = createSelector(
  [getKebiao, getLiLunByBanjiSched],
  (lilun, lilunByBanjiSched) => {
    //console.log("getLiLunByAllBanjiSched: "+JSON.stringify(lilun)+", "+JSON.stringify(lilunByBanjiSched));
    const banjiSchedIds = Object.keys(lilunByBanjiSched.toJS());
    let result = {};
    banjiSchedIds.forEach(banjiSchedId => {
      const lilunByBanjiSchedId = lilunByBanjiSched.get(banjiSchedId);
      const kebiaoInWeek = lilunByBanjiSchedId ? lilunByBanjiSchedId.schedules : null;
      let lilunInWeek = [];
      if (kebiaoInWeek && kebiaoInWeek.length > 0) {
        kebiaoInWeek.forEach(kebiaoInDay => {
          let lilunInDay = [];
          kebiaoInDay.forEach(lilunIds => {
            let lilunInfo = null;
            if (lilunIds && lilunIds.length > 0) {
              lilunInfo = lilun.get(lilunIds[0]);
            }
            //console.log(`Get lilun[${lilunId}] info: ${JSON.stringify(lilunInfo)}`);
            if (lilunInfo) {
              lilunInDay.push({...lilunInfo});
            } else {
              lilunInDay.push(null);
            }
          });
          lilunInWeek.push(lilunInDay);
        });
      }
      result[banjiSchedId] = lilunInWeek;
    });
    return result;
  }
);

export const getKebiaoByBanjiSched = state => state.getIn(["kebiao", "kebiaoByBanjiSched"]);
export const getKeBiaoByAllBanjiSched = createSelector(
  [getKebiao, getKebiaoByBanjiSched],
  (kebiao, kebiaoByBanjiSched) => {
    const banjiSchedIds = Object.keys(kebiaoByBanjiSched.toJS());
    let result = {};
    banjiSchedIds.forEach(banjiSchedId => {
      const kebiaoByBanjiSchedId = kebiaoByBanjiSched.get(banjiSchedId);
      const kebiaoInWeek = kebiaoByBanjiSchedId ? kebiaoByBanjiSchedId.schedules : null;
      let inWeek = [];
      if (kebiaoInWeek && kebiaoInWeek.length > 0) {
        kebiaoInWeek.forEach(kebiaoInDay => {
          let inDay = [];
          kebiaoInDay.forEach(kebiaoIds => {
            let inHour = [];
            if (kebiaoIds) {
              kebiaoIds.forEach(kebiaoId => {
                const kebiaoInfo = kebiao.get(kebiaoId);
                if (kebiaoInfo) {
                  inHour.push({...kebiaoInfo});
                }
              });
            }
            if (inHour.length > 0) {
              inDay.push(inHour)
            } else {
              inDay.push(null);
            }
          });
          inWeek.push(inDay);
        });
      }
      result[banjiSchedId] = inWeek;
    });
    return result;
  }
);

export const getShiXunByJysSched = state => state.getIn(["kebiao", "shiXunByJiaoyanshiSched"]);
export const getShiXunByJiaoyanshiSched = createSelector(
  [getKebiao, getShiXunByJysSched],
  (shixun, shixunByJysSched) => {
    const jysSchedIds = Object.keys(shixunByJysSched.toJS());
    let result = {};
    jysSchedIds.forEach(jysSchedId => {
      const shixunByJysSchedId = shixunByJysSched.get(jysSchedId);
      const kebiaoInWeek = shixunByJysSchedId.schedules;
      let inWeek = [];
      for (let i=0; i < 7; i++) {
        const kebiaoInDay = kebiaoInWeek[i];
        if (kebiaoInDay == null || kebiaoInDay.length === 0) {
          inWeek[i] = null;
          continue;
        }
        let inDay = [];
        for (let j=0; j < 6; j++) {
          let kebiaoInHour = kebiaoInDay[j];
          if (kebiaoInHour == null || kebiaoInHour.length === 0) {
            inDay[j] = null;
            continue;
          }
          let inHour = [];
          kebiaoInHour.forEach(kebiaoId => {
            let shixunInfo = {...shixun.get(kebiaoId)};
            inHour.push(shixunInfo);
          });
          inDay[j] = inHour;
        }
        inWeek[i] = inDay;
      }
      result[jysSchedId] = inWeek;
    });
    //console.log("getShiXunByJiaoyanshiSched: "+JSON.stringify(result));
    return result;
  }
);
