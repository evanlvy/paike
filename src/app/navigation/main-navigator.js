import React, {Component} from 'react';
import {
  Switch,
  Route,
} from 'react-router-dom';
import {
  Flex
} from '@chakra-ui/core';

import {
  MenuBar,
  MenuType
} from '../components';
import {
  LiLunKeBiaoScreen,
  BanJiKeBiaoScreen,
  ShiXunKeBiaoScreen,
} from '../screens';

import { hasLogin } from '../models/user';

class MainNavigator extends Component {
  constructor(props) {
    super(props);
    if (!hasLogin()) {
      const { history } = props;
      history.replace('/login');
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
    return (
      <Flex px="10%" direction="column" justify="center" >
        <MenuBar onMenuSelected={this.onMenuSelected}/>
        <Switch>
          <Route path="/kebiao/lilun" component={LiLunKeBiaoScreen} />
          <Route path="/kebiao/banji" component={BanJiKeBiaoScreen} />
          <Route path="/kebiao/shixun" component={ShiXunKeBiaoScreen} />
        </Switch>
      </Flex>
    )
  }
}

export { MainNavigator };
