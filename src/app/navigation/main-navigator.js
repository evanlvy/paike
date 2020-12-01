import React, { Component } from 'react';
import {
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import {
  Flex,
  Progress,
} from '@chakra-ui/core';

import {
  MenuBar,
  MenuType
} from '../components';

import { actions as authActions, getLoggedUser } from '../redux/modules/auth';
import { actions as gradeActions, getGradesOfAllDegrees } from '../redux/modules/grade';
import { actions as jysActions, getJiaoyanshiOfAllCenters } from '../redux/modules/jiaoyanshi';
import { actions as labBuildingActions, getAllLabBuildingsInfo } from '../redux/modules/lab_building';
import { getRequestQuantity } from '../redux/modules/app';

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
      case MenuType.SHIXUN:
        history.push('/kebiao/shixun', menu_params);
        break;
      default:
        break;
    }
  }

  needLogin = () => {
    const { user } = this.props;
    return !user || !user.token;
  }

  render() {
    if (this.needLogin()) {
      return <Redirect to="/login" />;
    }
    const { gradeTypes, centers, labBuildings, requestsCount } = this.props;
    console.log("Request count: "+requestsCount);
    return (
      <Flex justify="center">
        <Flex px="10%" direction="column" justify="center" >
          <MenuBar gradeTypes={gradeTypes} centers={centers} labBuildings={labBuildings} onMenuSelected={this.onMenuSelected}/>
          <Switch>
            <Route path="/kebiao/lilun" component={AsyncLiLunKeBiaoScreen} />
            <Route path="/kebiao/banji" component={AsyncBanJiKeBiaoScreen} />
            <Route path="/kebiao/shixun" component={AsyncShiXunKeBiaoScreen} />
          </Switch>
        </Flex>
        {
          requestsCount > 0 &&
          <Flex position="absolute" w="100%" h="100%" bg="#aaaa" color="black" alignItems="center" justify="center">
            <Progress width="50%" height="20px" rounded="4px" value={100} hasStripe isAnimated />
          </Flex>
        }
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
    requestsCount: getRequestQuantity(state),
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
