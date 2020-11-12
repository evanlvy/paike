import React, { Component } from 'react';
import {
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import {
  Flex
} from '@chakra-ui/core';

import {
  MenuBar,
  MenuType
} from '../components';

import { actions as authActions, getLoggedUser } from '../redux/modules/auth';
import { actions as gradeActions, getGradesOfAllDegrees } from '../redux/modules/grade';
import { actions as jysActions, getJiaoyanshiOfAllCenters } from '../redux/modules/jiaoyanshi';
import { actions as labBuildingActions, getAllLabBuildingsInfo } from '../redux/modules/lab_building';

import AsyncComponent from '../utils/AsyncComponent';
import connectRoute from '../utils/connectRoute';

const AsyncLiLunKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/lilun-kebiao-screen')));
const AsyncBanJiKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/banji-kebiao-screen')));
const AsyncShiXunKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/shixun-kebiao-screen')));

class MainNavigatorWrapper extends Component {
  componentDidMount() {
    this.props.fetchAllGradeInfo();
    this.props.fetchJiaoyanshi();
    this.props.fetchLabBuildings();
  }

  onMenuSelected = (menu, menu_params) => {
    const { history } = this.props;
    console.log("onMenuSelected: "+menu+", params: "+JSON.stringify(menu_params));
    switch(menu) {
      case MenuType.LILUN:
        history.push('/kebiao/lilun', menu_params);
        break;
      case MenuType.BANJI:
        history.push('/kebiao/banji', menu_params);
        break;
      default:
        break;
    }
  }

  needLogin = () => {
    const { user } = this.props;
    const token = user.get("userToken");
    return token == null;
  }

  render() {
    if (this.needLogin()) {
      return <Redirect to="/login" />;
    }
    const { gradeTypes, centers, labBuildings } = this.props;
    return (
      <Flex px="10%" direction="column" justify="center" >
        <MenuBar gradeTypes={gradeTypes} centers={centers} labBuildings={labBuildings} onMenuSelected={this.onMenuSelected}/>
        <Switch>
          <Route path="/kebiao/lilun" component={AsyncLiLunKeBiaoScreen} />
          <Route path="/kebiao/banji" component={AsyncBanJiKeBiaoScreen} />
          <Route path="/kebiao/shixun" component={AsyncShiXunKeBiaoScreen} />
        </Switch>
      </Flex>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    user: getLoggedUser(state),
    gradeTypes: getGradesOfAllDegrees(state),
    centers: getJiaoyanshiOfAllCenters(state),
    labBuildings: getAllLabBuildingsInfo(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(authActions, dispatch),
    ...bindActionCreators(gradeActions, dispatch),
    ...bindActionCreators(jysActions, dispatch),
    ...bindActionCreators(labBuildingActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainNavigatorWrapper);
