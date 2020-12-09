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
import { LabType } from '../../models/lab';

class LabsMenuListWrapped extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lab_center_value: -1,
      lab_building_value: -1,
    };
  }

  reset = () => {
    console.log("LabsMenu reset");
    this.setState({
      lab_center_value: -1,
      lab_building_value: -1,
    });
  }

  notifyLabChange = (lab_type, lab_index) => {
    const { onLabChange } = this.props;
    if (onLabChange) {
      onLabChange(this.props.menuType, lab_type, lab_index);
    }
  }

  onLabCenterChanged = (value) => {
    this.setState({
      lab_center_value: value,
      lab_building_value: -1,
    })
    this.notifyLabChange(LabType.BY_CENTER, value);
  }

  onLabBuildingChanged = (value) => {
    this.setState({
      lab_center_value: -1,
      lab_building_value: value,
    })
    this.notifyLabChange(LabType.BY_BUILDING, value);
  }

  render() {
    const { lab_center_value, lab_building_value } = this.state;
    const { t, labCenters, labBuildings } = this.props;
    return (
      <MenuList>
        <MenuOptionGroup title={t("lab.by_center")} type="radio" value={lab_center_value} onChange={this.onLabCenterChanged}>
        {
          labCenters.map((item, index) => (
            <MenuItemOption key={index} value={index}>{item.name}</MenuItemOption>
          ))
        }
        </MenuOptionGroup>
        {
          labBuildings && labBuildings.length > 0 &&
          <MenuDivider />
        }
        {
          labBuildings && labBuildings.length > 0 &&
          <MenuOptionGroup title={t("lab.by_building")} type="radio" value={lab_building_value} onChange={this.onLabBuildingChanged}>
          {
            labBuildings.map((item, index) => (
              <MenuItemOption key={index} value={index}>{item.name}</MenuItemOption>
            ))
          }
          </MenuOptionGroup>
        }
      </MenuList>
    );
  }
}

const LabsMenu = withMenu(withTranslation("translation", {withRef: true})(LabsMenuListWrapped));

export { LabsMenu };
