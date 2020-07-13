/* @flow */

import React, { Component } from 'react';
import {
  Flex,
  Button,
  Menu,
  MenuButton,
} from '@chakra-ui/core';
import {
  FiBookOpen
} from 'react-icons/fi';
import {
  FaCalendarDay,
  FaBuilding,
  FaCalculator,
  FaUserCog
} from 'react-icons/fa';
import {
  AiTwotoneExperiment
} from 'react-icons/ai';
import {
  MdCollectionsBookmark
} from 'react-icons/md';
import { Trans, withTranslation } from 'react-i18next';

import { GradesMenu } from './grades-menu';

function withMenu(WrappedMenuList) {
  return class extends Component {
    render() {
      const { title, icon, bgColor, menuType, menuListProps, ...otherProps } = this.props;
      return (
        <Menu>
          <MenuButton as={Button} leftIcon={icon} rightIcon="chevron-down" variantColor={bgColor}  {...otherProps} >
            <Trans>{title}</Trans>
          </MenuButton>
          <WrappedMenuList menuType={menuType} {...menuListProps} />
        </Menu>
      )
    }
  }
}

const MenuType = {
  LILUN: 1,
  BANJI: 2,
  SHIXUN: 3,
  SHIYANSHI: 4,
  JIAOYANSHI: 5,
  JIAOSHI: 6,
  BASIC_MAINTAIN: 7,
};

class MenuBarWrapped extends Component {
  constructor(props) {
    super(props);
    this.initMenu();
  }

  initMenu = () => {
    this.college_grades = [];
    this.vocational_grades = [];
    this.docking_grades = [];
    for (let grade = 2019, i=0; grade >= 2017; grade--, i++) {
      this.college_grades[i] = grade;
      this.vocational_grades[i] = grade;
      this.docking_grades[i] = grade;
    }
  }

  notifyMenuSelected = (menu, menu_params) => {
    const { onMenuSelected } = this.props;
    if (onMenuSelected) {
      onMenuSelected(menu, menu_params);
    }
  }

  onGradeChanged = (menu_type, education, grade) => {
    console.log("onGradeChanged, menu type: "+menu_type+", education: "+education+", grade: "+grade);
    this.notifyMenuSelected(menu_type, {edu: education, grd: grade});
  }

  render() {
    const { college_grades, vocational_grades, docking_grades } = this;
    const menus = [
      { type: MenuType.LILUN, title: "menuBar.lilunkebiao_title", icon: FiBookOpen, bgColor: "orange",
          menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { type: MenuType.BANJI, title: "menuBar.banjikebiao_title", icon: FaCalendarDay, bgColor: "cyan",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { type: MenuType.SHIXUN, title: "menuBar.shixunkebiao_title", icon: AiTwotoneExperiment, bgColor: "green",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { type: MenuType.SHIYANSHI, title: "menuBar.shiyanshi_anpai_title", icon: FaBuilding, bgColor: "blue",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { type: MenuType.JIAOYANSHI, title: "menuBar.jiaoyanshi_kebiao_title", icon: MdCollectionsBookmark, bgColor: "red",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { type: MenuType.JIAOSHI, title: "menuBar.jiaoshi_paike_title", icon: FaCalculator, bgColor: "pink",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { type: MenuType.BASIC_MAINTAIN, title: "menuBar.basic_maintain_title", icon: FaUserCog, bgColor: "purple",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
    ]
    return (
      <Flex direction="row" justify="center" mt={5}>
        {
          menus.map((item) => (
            <GradesMenu
              key={item.type}
              menuType={item.type}
              mx={1}
              width="11em"
              title={item.title}
              icon={item.icon}
              bgColor={item.bgColor}
              menuListProps={item.menuListProps} />
          ))
        }
      </Flex>
    );
  }
};
const MenuBar = withTranslation()(MenuBarWrapped);

export { withMenu, MenuBar, MenuType };
