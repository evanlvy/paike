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
import { actions as gradeTypeActions, getGradesOfAllGradeTypes } from '../redux/modules/grade_type';
import { actions as centerActions, getJiaoyanshiOfAllCenters } from '../redux/modules/center';
import { actions as labBuildingActions, getAllLabBuildingsInfo } from '../redux/modules/lab_building';

import AsyncComponent from '../utils/AsyncComponent';
import connectRoute from '../utils/connectRoute';

const AsyncLiLunKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/lilun-kebiao-screen')));
const AsyncBanJiKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/banji-kebiao-screen')));
const AsyncShiXunKeBiaoScreen = connectRoute(AsyncComponent(() => import('../screens/shixun-kebiao-screen')));

class MainNavigatorWrapper extends Component {
  constructor(props) {
    super(props);
    this.token = props.user.get("userToken");
    this.state = {
      needLogin: this.token == null
    }
  }

  componentDidMount() {
    this.props.fetchAllGradeTypes();
    this.props.fetchAllCenters();
    this.props.fetchLabBuildings();
  }

  onMenuSelected = (menu, menu_params) => {
    const { history } = this.props;
    console.log("onMenuSelected: "+menu+", params: "+JSON.stringify(menu_params));
    switch(menu) {
      case MenuType.LILUN:
        history.push('/kebiao/lilun', menu_params);
        break;
      default:
        break;
    }
  }

  render() {
    const { needLogin } = this.state;
    if (needLogin) {
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

const mapStateToProps = (state, props) => {
  return {
    user: getLoggedUser(state),
    gradeTypes: getGradesOfAllGradeTypes(state),
    centers: getJiaoyanshiOfAllCenters(state),
    labBuildings: getAllLabBuildingsInfo(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(authActions, dispatch),
    ...bindActionCreators(gradeTypeActions, dispatch),
    ...bindActionCreators(centerActions, dispatch),
    ...bindActionCreators(labBuildingActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainNavigatorWrapper);
