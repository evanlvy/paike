import Immutable from 'immutable';
import { combineReducers } from 'redux-immutable';
import { createSelector } from 'reselect';

import { actions as appActions } from './app';
import { api as subjectApi } from '../../services/subject';

// action types
export const types = {
  FETCH_BANJI: "BANJI/FETCH_BANJI"
};

// actions
export const actions = {
  fetchBanji: (gradeId, subjectId) => {
    return async (dispatch, getState) => {
      try {
        const gradeSubjectId = buildGradeSubjectId(gradeId, subjectId);
        if (shouldFetchBanji(gradeSubjectId, getState())) {
          dispatch(appActions.startRequest());
          const data = await subjectApi.queryBanji(gradeId, subjectId);
          dispatch(appActions.finishRequest());
          const { banjiByIds, banjiIds } = convertBanjiToPlain(data);
          dispatch(fetchBanjiSuccess(gradeSubjectId, banjiIds, banjiByIds));
        }
      } catch (error) {
        dispatch(appActions.setError(error));
      }
    }
  }
}

export const buildGradeSubjectId = (gradeId, subjectId) => {
  return gradeId+"_"+subjectId;
}

const shouldFetchBanji = (gradeSubjectId, state) => {
  const banjiIds = state.getIn(["banji", "bySubject", gradeSubjectId]);
  return !banjiIds || banjiIds.length === 0;
}

const convertBanjiToPlain = (banjiInfo) => {
  let banjiByIds = {};
  const banjiIds = Object.keys(banjiInfo);
  console.log("Got BanJi info: "+JSON.stringify(banjiInfo));
  banjiIds.forEach(banjiId => {
    banjiByIds[banjiId] = {id: banjiId, name: banjiInfo[banjiId]};
  });
  return {
    banjiByIds,
    banjiIds
  };
}

const fetchBanjiSuccess = (gradeSubjectId, banjiIds, banjiByIds) => {
  return ({
    type: types.FETCH_BANJI,
    gradeSubjectId,
    banjiIds,
    banjiByIds
  })
}

// reducers
const byIds = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_BANJI:
      return state.merge(action.banjiByIds);
    default:
      return state;
  }
}

const bySubject = (state = Immutable.fromJS({}), action) => {
  switch (action.type) {
    case types.FETCH_BANJI:
      return state.merge({[action.gradeSubjectId]: action.banjiIds});
    default:
      return state;
  }
}

const reducer = combineReducers({
  byIds,
  bySubject,
});

export default reducer;

// selectors
export const getBanji = state => state.getIn(["banji", "byIds"]);

export const getBanjiById = (state, id) => state.getIn(["banji", "byIds", id]);

export const getBanjiByAllSubject = state => state.getIn(["banji", "bySubject"]);

export const getBanjiBySubject = createSelector(
  [getBanji, getBanjiByAllSubject],
  (banji, banjiByAllSubject) => {
    const subjectIds = Object.keys(banjiByAllSubject.toJS());
    let result = {};
    subjectIds.forEach(subjectId => {
      let banjiList = [];
      //console.log(`banjiByAllSubject.get ${subjectId}, ${JSON.stringify(banjiByAllSubject.toJS())}`);
      const banjiIds = banjiByAllSubject.get(subjectId);
      if (banjiIds && banjiIds.length > 0) {
        banjiIds.forEach(banjiId => {
          const banjiInfo = banji.get(banjiId);
          banjiList.push(banjiInfo);
        })
        result[subjectId] = banjiList;
      }
    })
    return result;
  }
);
