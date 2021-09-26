/* @flow */

import React, { Component } from 'react';
import {
  Flex,
  Button,
  Menu,
  MenuButton,
  Box,
  Avatar,
  AvatarBadge,
  Text,
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
  PAIKE: 6,
  BASIC_MAINTAIN: 7,
  JIAOWUCHU: 8,
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
    this.jysMenuRef = React.createRef();
    this.jwcMenuRef = React.createRef();

    this.menuRefs = [this.lilunMenuRef, this.banjiMenuRef, this.shixunMenuRef, this.labMenuRef, this.jysMenuRef, null, null];
  }

  initMenu = () => {
    this.initGrades();
    this.initLabs();
    this.initJiaoYanShi();
    this.initMaintainMenu();
  }

  resetMenu = (withoutIndex) => {
    for (let i=0; i < this.menuRefs.length; i++) {
      if (i === withoutIndex) {
        continue;
      }
      const menuRef = this.menuRefs[i];
      if (menuRef && menuRef.current) {
        menuRef.current.reset();
      }
    }
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
        let jys_item = { id: jys.id, name: jys.name };
        jysList.push(jys_item);
      });
      let center_item = {
        name: center.name,
        items: jysList
      };
      jys_info.push(center_item);
    })
    // console.log("initJiaoYanShi, jys_info: "+JSON.stringify(jys_info));
    this.jiaoyanshi_centers = jys_info;
  }

  initMaintainMenu = () => {
    const { t } = this.props;
    this.maintain_menus = [
      {name: t("maintainMenu.audit"), items: [{name: t("maintainMenu.audit_planChange"), isDisabled:true}, {name: t("maintainMenu.audit_teacherAbsence"), isDisabled:true}, {name: t("maintainMenu.audit_stuAbsence"), isDisabled:true}]},
      {name: t("maintainMenu.statistics"), items: [{name: t("maintainMenu.statistics_laborHour"), isDisabled:true}, {name: t("maintainMenu.statistics_wechat"), isDisabled:true}]},
      {name: t("maintainMenu.holiday"), items: [{name: t("maintainMenu.holiday_adjust"), isDisabled:true}]},
      {name: t("maintainMenu.annualData"), items: [{name: t("maintainMenu.annualData_rawplans")}, {name: t("maintainMenu.annualData_progressdoc")}, {name: t("maintainMenu.annualData_curriculums")}, {name: t("maintainMenu.annualData_classes"), isDisabled:true}]},
      {name: t("maintainMenu.basicData"), items: [{name: t("maintainMenu.basicData_department"), isDisabled:true}, {name: t("maintainMenu.basicData_labInfo"), isDisabled:true}, {name: t("maintainMenu.basicData_labCenter"), isDisabled:true}, {name: t("maintainMenu.basicData_teachers"), isDisabled:true}, {name: t("maintainMenu.basicData_courses"), isDisabled:true}, {name: t("maintainMenu.basicData_colleges"), isDisabled:true}, {name: t("maintainMenu.basicData_majors"), isDisabled:true}]},
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
      case MenuType.BANJI:
      case MenuType.SHIXUN:
        this.resetMenu(menu_type-1);
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
    this.resetMenu(MenuType.SHIYANSHI-1);

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
    // reset other menus
    this.resetMenu(MenuType.JIAOYANSHI-1);
    this.notifyMenuSelected(menu_type, {jys: {id: item.id, name: item.name}});
  }

  onJiaoShiPaiKeClicked = () => {
    console.log("onJiaoShiPaiKeClicked");
    // reset other menus
    this.resetMenu(MenuType.PAIKE-1);
    this.notifyMenuSelected(MenuType.PAIKE, null);
  }

  onDepartmentLabsSummaryClicked = () => {
    console.log("onDepartmentLabsSummaryClicked");
    // reset other menus
    this.resetMenu(MenuType.SHIXUN-1);
    this.notifyMenuSelected(MenuType.SHIXUN, null);
  }

  onJwcKebiaoClicked = () => {
    console.log("onJwcKebiaoBtnClicked");
    // reset other menus
    this.resetMenu(MenuType.JIAOWUCHU-1);
    this.notifyMenuSelected(MenuType.JIAOWUCHU, null);
  }

  onMaintainMenuSelected = (menu_type, main_index, sub_index) => {
    const { maintain_menus } = this;
    const main_menu = maintain_menus[main_index];
    const sub_menu = main_menu.items[sub_index];
    console.log("onMaintainMenuSelected, main menu: "+main_menu.name+", sub menu: "+sub_menu.name);
    // reset other menus
    this.resetMenu(MenuType.BASIC_MAINTAIN-1);
    this.notifyMenuSelected(menu_type, {main: main_menu, sub: sub_menu});
  }

  render() {
    this.initMenu();
    const { grade_info, lab_centers, lab_buildings, jiaoyanshi_centers, maintain_menus } = this;
    const menus = [
      { type: MenuType.JIAOWUCHU, title: "menuBar.jiaowuchu_kebiao_title", icon: AiTwotoneExperiment, bgColor: "green", onClick: this.onJwcKebiaoClicked,
              menu_ref: this.jwcMenuRef, access_level: "NONE" },
      { list_type: MenuListType.GROUP, type: MenuType.LILUN, title: "menuBar.lilunkebiao_title", icon: FiBookOpen, bgColor: "orange",
              menuListProps: {menuGroups: grade_info, onGroupMenuSelected: this.onGradeGroupChanged }, menu_ref: this.lilunMenuRef, access_level: "NONE" },
      { list_type: MenuListType.GROUP, type: MenuType.BANJI, title: "menuBar.banjikebiao_title", icon: FaCalendarDay, bgColor: "cyan",
              menuListProps: {menuGroups: grade_info, onGroupMenuSelected: this.onGradeGroupChanged }, menu_ref: this.banjiMenuRef, access_level: "NONE" },
      { type: MenuType.SHIXUN, title: "menuBar.shixunkebiao_title", icon: AiTwotoneExperiment, bgColor: "green", onClick: this.onDepartmentLabsSummaryClicked,
              menu_ref: this.shixunMenuRef, access_level: "NONE" },
      { list_type: MenuListType.LAB, type: MenuType.SHIYANSHI, title: "menuBar.shiyanshi_anpai_title", icon: FaBuilding, bgColor: "blue",
              menuListProps: {labCenters: lab_centers, labBuildings: lab_buildings, onLabChange: this.onLabChanged}, menu_ref: this.labMenuRef, access_level: "PROFESSOR" },
      { list_type: MenuListType.GROUP, type: MenuType.JIAOYANSHI, title: "menuBar.jiaoyanshi_kebiao_title", icon: MdCollectionsBookmark, bgColor: "red",
              menuListProps: {menuGroups: jiaoyanshi_centers, onGroupMenuSelected: this.onJiaoYanShiChange, height: 500}, menu_ref: this.jysMenuRef, access_level: "PROFESSOR" },
      { type: MenuType.PAIKE, title: "menuBar.jiaoshi_paike_title", icon: FaCalculator, bgColor: "pink", onClick: this.onJiaoShiPaiKeClicked, access_level: "PROFESSOR"},
      { list_type: MenuListType.GROUP, type: MenuType.BASIC_MAINTAIN, title: "menuBar.basic_maintain_title", icon: FaUserCog, bgColor: "purple",
              menuListProps: {menuGroups: maintain_menus, onGroupMenuSelected: this.onMaintainMenuSelected, height: 500}, access_level: "PROFESSOR"},
    ];
    const { t, accessLevel, userInfo, stuInfo } = this.props;
    const { name, departmentName, labdivisionName } = userInfo;
    const { grade_name, major_name, class_seq} = stuInfo;
    console.log("renderer, access level: "+accessLevel);
    return (
      <Flex direction="column" justify="center" basis="100%" mt={5}>
        <Flex direction="row" justify="center" flexWrap="wrap" mt={5}>
          {
            menus.map((item) => {
              if (accessLevel < item.access_level) {
                return null;
              }
              switch(item.list_type) {
                case MenuListType.LAB:
                  return <LabsMenu
                    key={item.type}
                    ref={item.menu_ref}
                    menuType={item.type}
                    m={1}
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
                    m={1}
                    width="11em"
                    title={item.title}
                    icon={item.icon}
                    bgColor={item.bgColor}
                    menuListProps={item.menuListProps} />
                default:
                  return <Button
                    key={item.type}
                    m={1}
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
        <Box p="20px" color="white" mt="4" bg="blue.600" rounded="md" shadow="md">
          <Flex direction="row" justify="center" flexWrap="wrap" mt={5}>
            <Avatar>
              <AvatarBadge boxSize="1.25em" bg="green.500" />
            </Avatar>
            <Text fontSize="xl">{stuInfo.major_name?
              t("menuBar.student_profile_template",{grade_name: grade_name, major_name: major_name, class_seq: class_seq})
              :t("menuBar.teacher_profile_template",{teacherName: name, 
              departmentName: ((typeof(departmentName)=='string' && departmentName != "")?departmentName:labdivisionName)})}
            </Text>
          </Flex>
        </Box>
      </Flex>
    );
  }
};
const MenuBar = withTranslation()(MenuBarWrapped);

export { withMenu, MenuBar, MenuType };
