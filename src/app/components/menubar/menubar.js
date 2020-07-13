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

import { GradesMenu, LabsMenu } from './';

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

const MenuListType = {
  GRADE: 1,
  LAB: 2,
}

class MenuBarWrapped extends Component {
  constructor(props) {
    super(props);
    this.initMenu();
  }

  initMenu = () => {
    this.initGrades();
    this.initLabs();
  }

  initGrades = () => {
    this.college_grades = [];
    this.vocational_grades = [];
    this.docking_grades = [];
    for (let grade = 2019, i=0; grade >= 2017; grade--, i++) {
      this.college_grades[i] = grade;
      this.vocational_grades[i] = grade;
      this.docking_grades[i] = grade;
    }
  }

  initLabs = () => {
    this.lab_centers = [
      "基础", "护理", "影像", "临床", "药学", "医疗技术"
    ];
    this.lab_buildings = [
      "A栋","B栋","C栋","D栋","E栋","F栋","L栋"
    ]
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

  onLabChanged = (menu_type, by_type, lab_index) => {
    console.log("onLabChanged, menu type: "+menu_type+", by type: "+by_type+", index: "+lab_index);
    this.notifyMenuSelected(menu_type, {by: by_type, idx: lab_index});
  }

  render() {
    const { college_grades, vocational_grades, docking_grades, lab_centers, lab_buildings } = this;
    const menus = [
      { list_type: MenuListType.GRADE, type: MenuType.LILUN, title: "menuBar.lilunkebiao_title", icon: FiBookOpen, bgColor: "orange",
          menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { list_type: MenuListType.GRADE, type: MenuType.BANJI, title: "menuBar.banjikebiao_title", icon: FaCalendarDay, bgColor: "cyan",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { list_type: MenuListType.GRADE, type: MenuType.SHIXUN, title: "menuBar.shixunkebiao_title", icon: AiTwotoneExperiment, bgColor: "green",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { list_type: MenuListType.LAB, type: MenuType.SHIYANSHI, title: "menuBar.shiyanshi_anpai_title", icon: FaBuilding, bgColor: "blue",
              menuListProps: {labCenters: lab_centers ,labBuildings: lab_buildings, onLabChange: this.onLabChanged} },
      { list_type: MenuListType.GRADE, type: MenuType.JIAOYANSHI, title: "menuBar.jiaoyanshi_kebiao_title", icon: MdCollectionsBookmark, bgColor: "red",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { list_type: MenuListType.GRADE, type: MenuType.JIAOSHI, title: "menuBar.jiaoshi_paike_title", icon: FaCalculator, bgColor: "pink",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { list_type: MenuListType.GRADE, type: MenuType.BASIC_MAINTAIN, title: "menuBar.basic_maintain_title", icon: FaUserCog, bgColor: "purple",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
    ]
    return (
      <Flex direction="row" justify="center" mt={5}>
        {
          menus.map((item) => {
            switch(item.list_type){
              case MenuListType.LAB:
                return <LabsMenu
                  key={item.type}
                  menuType={item.type}
                  mx={1}
                  width="11em"
                  title={item.title}
                  icon={item.icon}
                  bgColor={item.bgColor}
                  menuListProps={item.menuListProps} />
              case MenuListType.GRADE:
              default:
                return <GradesMenu
                  key={item.type}
                  menuType={item.type}
                  mx={1}
                  width="11em"
                  title={item.title}
                  icon={item.icon}
                  bgColor={item.bgColor}
                  menuListProps={item.menuListProps} />
            }
          })
        }
      </Flex>
    );
  }
};
const MenuBar = withTranslation()(MenuBarWrapped);

export { withMenu, MenuBar, MenuType };
