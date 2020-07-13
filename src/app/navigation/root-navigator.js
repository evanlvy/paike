import React from 'react';

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import { MainNavigator } from './';

import { LoginScreen } from '../screens';

function RootNavigator() {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={LoginScreen} />
        <Route path="/" component={MainNavigator} />
      </Switch>
    </Router>
  )
}

export { RootNavigator }
