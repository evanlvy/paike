import { combineReducers } from 'redux-immutable';

import app from './app';
import auth from './auth';
import grade from './grade';
import jiaoyanshi from './jiaoyanshi';
import lab from './lab';
import lab_building from './lab_building';
import subject from './subject';
import teacher from './teacher';
import banji from './banji';
import kebiao from './kebiao';
import history from './history';
import rawplan from './rawplan';
import progressdoc from './progressdoc';
import curriculums from './curriculums';

const rootReducer = combineReducers({
  app,
  auth,
  grade,
  jiaoyanshi,
  lab,
  lab_building,
  subject,
  teacher,
  banji,
  kebiao,
  history,
  rawplan,
  progressdoc,
  curriculums,
});

export default rootReducer;
