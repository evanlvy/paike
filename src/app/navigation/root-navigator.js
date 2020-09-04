import React from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import AsyncComponent from '../utils/AsyncComponent';
import connectRoute from '../utils/connectRoute';

const AsyncMainNavigator = connectRoute(AsyncComponent(() => import('./main-navigator')));
const AsyncLoginScreen = connectRoute(AsyncComponent(() => import('../screens/login-screen')));

function RootNavigator() {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={AsyncLoginScreen} />
        <Route path="/" component={AsyncMainNavigator} />
      </Switch>
    </Router>
  )
}

export { RootNavigator }
