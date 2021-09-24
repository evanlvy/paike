/* @flow */

import React, { Component } from 'react';

import {
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  MenuDivider,
} from '@chakra-ui/core';
import { withTranslation } from 'react-i18next';

import { withMenu } from './menubar';

class GroupMenuListWrapped extends Component {
  constructor(props) {
    super(props);
    this.state = {
      group_values: this.initGroupValues()
    };
  }

  initGroupValues = () => {
    return this.updateGroupValues(0, -1);
  }

  updateGroupValues = (group_index, value) => {
    let groupValues = [];
    const { menuGroups } = this.props;
    //console.log("Group length: "+menuGroups.length);
    for (let i=0; i < menuGroups.length; i++) {
      if (i === group_index) {
        groupValues[i] = value;
      } else {
        groupValues[i] = -1;
      }
    }
    return groupValues;
  }

  reset = () => {
    this.setState({
      group_values: this.initGroupValues()
    });
  }

  notifyGroupMenuChange = (group_index, value) => {
    const { onGroupMenuSelected } = this.props;
    if (onGroupMenuSelected) {
      onGroupMenuSelected(this.props.menuType, group_index, value);
    }
  }

  onGroupValueChanged = (group_index, value) => {
    const groupValues = this.updateGroupValues(group_index, value);
    this.setState({
      group_values: groupValues
    });

    this.notifyGroupMenuChange(group_index, value);
  }

  render() {
    const { group_values } = this.state;
    const { menuGroups, height, access_level } = this.props;
    if (menuGroups == null) {
      return null;
    }
    return (
      <MenuList height={height} overflowY="auto">
        {
          menuGroups.map((group, group_index) => (
            <div key={group_index}>
            <MenuOptionGroup title={group.name} type="radio" value={group_values[group_index]} onChange={(value) => { this.onGroupValueChanged(group_index, value); }}>
              {
                group.items.map((item, index) => {
                  if (access_level > item.access_level) {
                    return null;
                  }
                  return (<MenuItemOption key={index} value={index} isDisabled={item.isDisabled}>{item.name}</MenuItemOption>);
                })
              }
            </MenuOptionGroup>
            { group_index < menuGroups.length-1 && <MenuDivider /> }
            </div>
          ))
        }
      </MenuList>
    );
  }
}

const GroupMenu = withMenu(withTranslation("translation", {withRef: true})(GroupMenuListWrapped));

export { GroupMenu };
