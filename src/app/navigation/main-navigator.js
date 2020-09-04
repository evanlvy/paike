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
    return (
      <Flex px="10%" direction="column" justify="center" >
        <MenuBar onMenuSelected={this.onMenuSelected}/>
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
    user: getLoggedUser(state)
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(authActions, dispatch)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MainNavigatorWrapper);
