/* @flow */

import React, { Component } from 'react';
import {
  MenuList,
  MenuOptionGroup,
  MenuItemOption,
  MenuDivider,
} from '@chakra-ui/core';
import { Trans, withTranslation } from 'react-i18next';

import { withMenu } from './menubar';
import { Education } from '../../models/grade';

class GradesMenuListWrapped extends Component {
  constructor(props) {
    super(props);
    this.state = {
      college_grade_value: -1,
      vocational_grade_value: -1,
      docking_grade_value: -1,
    };
  }

  notifyGradeChange = (education, grade) => {
    const { onGradeChange } = this.props;
    if (onGradeChange) {
      onGradeChange(this.props.menuType, education, grade);
    }
  }

  onCollegeGradeChanged = (value) => {
    this.setState({
      college_grade_value: value,
      vocational_grade_value: -1,
      docking_grade_value: -1,
    })
    this.notifyGradeChange(Education.COLLAGE, this.props.collegeGrades[value]);
  }

  onVocationalGradeChanged = (value) => {
    this.setState({
      college_grade_value: -1,
      vocational_grade_value: value,
      docking_grade_value: -1,
    })
    this.notifyGradeChange(Education.VOCATIONAL, this.props.vocationalGrades[value]);
  }

  onDockingGradeChanged = (value) => {
    this.setState({
      college_grade_value: -1,
      vocational_grade_value: -1,
      docking_grade_value: value,
    })
    this.notifyGradeChange(Education.DOCKING, this.props.dockingGrades[value]);
  }

  render() {
    const { college_grade_value, vocational_grade_value, docking_grade_value } = this.state;
    const { t, collegeGrades, vocationalGrades, dockingGrades } = this.props;
    return (
      <MenuList>
        <MenuOptionGroup title={t("grade.college")} type="radio" value={college_grade_value} onChange={this.onCollegeGradeChanged}>
          {
            collegeGrades.map((item, index) => (
              <MenuItemOption key={index} value={index}><Trans values={{grade: item}}>grade.grade_template</Trans></MenuItemOption>
            ))
          }
        </MenuOptionGroup>
        <MenuDivider />
        <MenuOptionGroup title={t("grade.vocational")} type="radio" value={vocational_grade_value} onChange={this.onVocationalGradeChanged}>
          {
            vocationalGrades.map((item, index) => (
              <MenuItemOption key={index} value={index}><Trans values={{grade: item}}>grade.grade_template</Trans></MenuItemOption>
            ))
          }
        </MenuOptionGroup>
        <MenuDivider />
        <MenuOptionGroup title={t("grade.docking")} type="radio" value={docking_grade_value} onChange={this.onDockingGradeChanged}>
          {
            dockingGrades.map((item, index) => (
              <MenuItemOption key={index} value={index}><Trans values={{grade: item}}>grade.grade_template</Trans></MenuItemOption>
            ))
          }
        </MenuOptionGroup>
      </MenuList>
    );
  }
}

const GradesMenu = withMenu(withTranslation()(GradesMenuListWrapped));

export { GradesMenu };
