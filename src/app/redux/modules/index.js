import { combineReducers } from 'redux-immutable';

import app from './app';
import auth from './auth';
import center from './center';
import grade_type from './grade_type';
import grade from './grade';
import jiaoyanshi from './jiaoyanshi';
import lab from './lab';
import lab_building from './lab_building';
import subject from './subject';
import teacher from './teacher';

const rootReducer = combineReducers({
  app,
  auth,
  center,
  grade_type,
  grade,
  jiaoyanshi,
  lab,
  lab_building,
  subject,
  teacher,
});

export default rootReducer;
