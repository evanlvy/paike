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

import { LabType } from '../../models/lab';
import { LabsMenu, GroupMenu } from './';

function withMenu(WrappedMenuList) {
  class withMenuComponent extends Component {
    render() {
      const { title, icon, bgColor, menuType, menuListProps, forwardedRef, ...otherProps } = this.props;
      return (
        <Menu>
          <MenuButton as={Button} leftIcon={icon} rightIcon="chevron-down" variantColor={bgColor}  {...otherProps} >
            <Trans>{title}</Trans>
          </MenuButton>
          <WrappedMenuList ref={forwardedRef} menuType={menuType} {...menuListProps} />
        </Menu>
      )
    }
  }
  const forwardRef = (props, ref) => {
    return React.createElement(withMenuComponent, Object.assign({}, props, { forwardedRef: ref }));
  }
  return React.forwardRef(forwardRef);
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
  LAB: 1,
  GROUP: 2,
}

class MenuBarWrapped extends Component {
  constructor(props) {
    super(props);

    this.lilunMenuRef = React.createRef();
    this.banjiMenuRef = React.createRef();
    this.shixunMenuRef = React.createRef();
    this.labMenuRef = React.createRef();
  }

  initMenu = () => {
    this.initGrades();
    this.initLabs();
    this.initJiaoYanShi();
    this.initMaintainMenu();
  }

  initGrades = () => {
    const { gradeTypes } = this.props;
    let grade_info = [];
    gradeTypes.forEach((type) => {
      let grades = [];
      type.grades.forEach((grade) => {
        let grade_item = { name: grade.name };
        grades.push(grade_item);
      });
      let grade_type = {
        name: type.name,
        items: grades
      };
      grade_info.push(grade_type);
    })
    //console.log("initGrades, grade_info: "+JSON.stringify(grade_info));
    this.grade_info = grade_info;
  }

  initLabs = () => {
    const { centers, labBuildings } = this.props;
    let center_info = [];
    centers.forEach((center) => {
      let center_item = { name: center.name };
      center_info.push(center_item);
    });
    this.lab_centers = center_info;
    let building_info = [];
    if (labBuildings) {
      labBuildings.forEach((building) => {
        let building_item = { name: building.name };
        building_info.push(building_item);
      });
      this.lab_buildings = building_info;
    }
  }

  initJiaoYanShi = () => {
    const { centers } = this.props;
    let jys_info = [];
    centers.forEach((center) => {
      let jysList = [];
      center.jiaoyanshi.forEach((jys) => {
        let jys_item = { name: jys.name };
        jysList.push(jys_item);
      });
      let center_item = {
        name: center.name,
        items: jysList
      };
      jys_info.push(center_item);
    })
    //console.log("initJiaoYanShi, jys_info: "+JSON.stringify(jys_info));
    this.jiaoyanshi_centers = jys_info;
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

  onGradeGroupChanged = (menu_type, grade_type_index, grade_index) => {
    const { gradeTypes } = this.props;
    const grade_info = gradeTypes;
    const grade_type = grade_info[grade_type_index];
    const grade = grade_type.grades[grade_index];
    console.log("onGradeChanged, menu type: "+menu_type+", education: "+grade_type.name+", grade: "+grade.name);
    switch(menu_type) {
      case MenuType.LILUN:
        if (this.banjiMenuRef.current) {
          this.banjiMenuRef.current.reset();
        }
        if (this.shixunMenuRef.current) {
          this.shixunMenuRef.current.reset();
        }
        if (this.labMenuRef.current) {
          this.labMenuRef.current.reset();
        }
        break;
      case MenuType.BANJI:
        if (this.lilunMenuRef.current) {
          this.lilunMenuRef.current.reset();
        }
        if (this.shixunMenuRef.current) {
          this.shixunMenuRef.current.reset();
        }
        if (this.labMenuRef.current) {
          this.labMenuRef.current.reset();
        }
        break;
      case MenuType.SHIXUN:
        if (this.lilunMenuRef.current) {
          this.lilunMenuRef.current.reset();
        }
        if (this.banjiMenuRef.current) {
          this.banjiMenuRef.current.reset();
        }
        if (this.labMenuRef.current) {
          this.labMenuRef.current.reset();
        }
        break;
      default:
        break;
    }
    this.notifyMenuSelected(menu_type, {edu: grade_type, grd: grade});
  }

  onLabChanged = (menu_type, by_type, lab_index) => {
    const { centers, labBuildings } = this.props;
    console.log("onLabChanged, menu type: "+menu_type+", by type: "+by_type+", index: "+lab_index);
    // reset other menus
    if (this.banjiMenuRef.current) {
      this.banjiMenuRef.current.reset();
    }
    if (this.shixunMenuRef.current) {
      this.shixunMenuRef.current.reset();
    }
    if (this.lilunMenuRef.current) {
      this.lilunMenuRef.current.reset();
    }
    
    if (by_type === LabType.BY_CENTER) {
      const center = centers[lab_index];
      this.notifyMenuSelected(menu_type, {center: {id: center.id, name: center.name}});
    } else if (by_type === LabType.BY_BUILDING) {
      this.notifyMenuSelected(menu_type, {building: labBuildings[lab_index]});
    }
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
    this.initMenu();
    const { grade_info, lab_centers, lab_buildings, jiaoyanshi_centers, maintain_menus } = this;
    const menus = [
      { list_type: MenuListType.GROUP, type: MenuType.LILUN, title: "menuBar.lilunkebiao_title", icon: FiBookOpen, bgColor: "orange",
              menuListProps: {menuGroups: grade_info, onGroupMenuSelected: this.onGradeGroupChanged }, menu_ref: this.lilunMenuRef },
      { list_type: MenuListType.GROUP, type: MenuType.BANJI, title: "menuBar.banjikebiao_title", icon: FaCalendarDay, bgColor: "cyan",
              menuListProps: {menuGroups: grade_info, onGroupMenuSelected: this.onGradeGroupChanged }, menu_ref: this.banjiMenuRef },
      { list_type: MenuListType.GROUP, type: MenuType.SHIXUN, title: "menuBar.shixunkebiao_title", icon: AiTwotoneExperiment, bgColor: "green",
              menuListProps: {menuGroups: grade_info, onGroupMenuSelected: this.onGradeGroupChanged}, menu_ref: this.shixunMenuRef },
      { list_type: MenuListType.LAB, type: MenuType.SHIYANSHI, title: "menuBar.shiyanshi_anpai_title", icon: FaBuilding, bgColor: "blue",
              menuListProps: {labCenters: lab_centers ,labBuildings: lab_buildings, onLabChange: this.onLabChanged}, menu_ref: this.labMenuRef },
      { list_type: MenuListType.GROUP, type: MenuType.JIAOYANSHI, title: "menuBar.jiaoyanshi_kebiao_title", icon: MdCollectionsBookmark, bgColor: "red",
              menuListProps: {menuGroups: jiaoyanshi_centers, onGroupMenuSelected: this.onJiaoYanShiChange, height: 500} },
      { type: MenuType.JIAOSHI, title: "menuBar.jiaoshi_paike_title", icon: FaCalculator, bgColor: "pink", onClick: this.onJiaoShiPaiKeClicked},
      { list_type: MenuListType.GROUP, type: MenuType.BASIC_MAINTAIN, title: "menuBar.basic_maintain_title", icon: FaUserCog, bgColor: "purple",
              menuListProps: {menuGroups: maintain_menus, onGroupMenuSelected: this.onMaintainMenuSelected, height: 500} },
    ]
    return (
      <Flex direction="row" justify="center" mt={5}>
        {
          menus.map((item) => {
            switch(item.list_type){
              case MenuListType.LAB:
                return <LabsMenu
                  key={item.type}
                  ref={item.menu_ref}
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
                  ref={item.menu_ref}
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
