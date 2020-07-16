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

import { GradesMenu, LabsMenu, GroupMenu } from './';

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
  GROUP: 3,
}

class MenuBarWrapped extends Component {
  constructor(props) {
    super(props);
    this.initMenu();
  }

  initMenu = () => {
    this.initGrades();
    this.initLabs();
    this.initJiaoYanShi();
    this.initMaintainMenu();
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

  initJiaoYanShi = () => {
    this.jiaoyanshi_centers = [
      {name: "基础分中心", items: [{name: "解剖"}, {name: "病理"}, {name: "生化"}, {name: "生理"}, {name: "微寄"}, {name: "组胚"}, {name: "生物遗传"}, {name: "计算机"}]},
      {name: "护理分中心", items: [{name: "基础护理"}, {name: "内科护理"}, {name: "外科护理"}]},
      {name: "影像分中心", items: [{name: "影像诊断"}, {name: "影像技术"}]},
      {name: "临床分中心", items: [{name: "内科"}, {name: "外科"}, {name: "妇科"}, {name: "儿科"}, {name: "五官"}, {name: "眼视光"}, {name: "康复"}, {name: "中医"}, {name: "预防"}]},
      {name: "药学分中心", items: [{name: "药理"}, {name: "化学"}, {name: "药剂"}, {name: "生药"}]},
      {name: "医疗技术分中心", items: [{name: "检验"}, {name: "美容"}]},
      {name: "社科部", items: [{name: "概论"}, {name: "基础"}]},
    ];
  }

  initMaintainMenu = () => {
    this.maintain_menus = [
      {name: "审核批准", items: [{name: "课表变更"}, {name: "教师请假"}, {name: "学生请假"}]},
      {name: "统计", items: [{name: "课时统计"}, {name: "微信关联学生统计"}]},
      {name: "公共假期", items: [{name: "假期调整/重新排课"}]},
      {name: "年度数据录入", items: [{name: "教务处总课表"}, {name: "班级(及分组)"}]},
      {name: "基础数据维护", items: [{name: "教研室"}, {name: "实验室"}, {name: "实训分中心"}, {name: "教师"}, {name: "课程"}, {name: "学院"}, {name: "专业"}]},
    ];
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

  onJiaoYanShiChange = (menu_type, center_index, item_index) => {
    const { jiaoyanshi_centers } = this;
    const center = jiaoyanshi_centers[center_index];
    const item = center.items[item_index];
    console.log("onJiaoYanShiChange, center: "+center.name+", item: "+item.name);
    this.notifyMenuSelected(menu_type, {center: center, item: item});
  }

  onJiaoShiPaiKeClicked = () => {
    console.log("onJiaoShiPaiKeClicked");
  }

  onMaintainMenuSelected = (menu_type, main_index, sub_index) => {
    const { maintain_menus } = this;
    const main_menu = maintain_menus[main_index];
    const sub_menu = main_menu.items[sub_index];
    console.log("onMaintainMenuSelected, main menu: "+main_menu.name+", sub menu: "+sub_menu.name);
    this.notifyMenuSelected(menu_type, {main: main_menu, sub: sub_menu});
  }

  render() {
    const { college_grades, vocational_grades, docking_grades, lab_centers, lab_buildings, jiaoyanshi_centers, maintain_menus } = this;
    const menus = [
      { list_type: MenuListType.GRADE, type: MenuType.LILUN, title: "menuBar.lilunkebiao_title", icon: FiBookOpen, bgColor: "orange",
          menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { list_type: MenuListType.GRADE, type: MenuType.BANJI, title: "menuBar.banjikebiao_title", icon: FaCalendarDay, bgColor: "cyan",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { list_type: MenuListType.GRADE, type: MenuType.SHIXUN, title: "menuBar.shixunkebiao_title", icon: AiTwotoneExperiment, bgColor: "green",
              menuListProps: {collegeGrades: college_grades ,vocationalGrades: vocational_grades, dockingGrades: docking_grades, onGradeChange: this.onGradeChanged} },
      { list_type: MenuListType.LAB, type: MenuType.SHIYANSHI, title: "menuBar.shiyanshi_anpai_title", icon: FaBuilding, bgColor: "blue",
              menuListProps: {labCenters: lab_centers ,labBuildings: lab_buildings, onLabChange: this.onLabChanged} },
      { list_type: MenuListType.GROUP, type: MenuType.JIAOYANSHI, title: "menuBar.jiaoyanshi_kebiao_title", icon: MdCollectionsBookmark, bgColor: "red",
              menuListProps: {menuGroups: jiaoyanshi_centers, onGroupMenuSelected: this.onJiaoYanShiChange} },
      { type: MenuType.JIAOSHI, title: "menuBar.jiaoshi_paike_title", icon: FaCalculator, bgColor: "pink", onClick: this.onJiaoShiPaiKeClicked},
      { list_type: MenuListType.GROUP, type: MenuType.BASIC_MAINTAIN, title: "menuBar.basic_maintain_title", icon: FaUserCog, bgColor: "purple",
              menuListProps: {menuGroups: maintain_menus, onGroupMenuSelected: this.onMaintainMenuSelected} },
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
              case MenuListType.GROUP:
                return <GroupMenu
                  key={item.type}
                  menuType={item.type}
                  mx={1}
                  width="11em"
                  title={item.title}
                  icon={item.icon}
                  bgColor={item.bgColor}
                  menuListProps={item.menuListProps} />
              case MenuListType.GRADE:
                return <GradesMenu
                  key={item.type}
                  menuType={item.type}
                  mx={1}
                  width="11em"
                  title={item.title}
                  icon={item.icon}
                  bgColor={item.bgColor}
                  menuListProps={item.menuListProps} />
              default:
                return <Button
                  key={item.type}
                  mx={1}
                  width="11em"
                  leftIcon={item.icon}
                  variantColor={item.bgColor}
                  onClick={() => item.onClick(item.menu_type)}>
                    <Trans>{item.title}</Trans>
                  </Button>
            }
          })
        }
      </Flex>
    );
  }
};
const MenuBar = withTranslation()(MenuBarWrapped);

export { withMenu, MenuBar, MenuType };
