/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Flex,
  Text,
} from '@chakra-ui/core';

import {
  SubjectBoard,
  ResultTable,
} from '../components';

import { getSchoolYear, getSchoolWeek } from '../redux/modules/grade';
import { getStudentInfo, isStudent } from '../redux/modules/auth';
import { actions as rawplanActions, getRawplanGroups, getSelectedGroup, getPlansByGroup} from '../redux/modules/rawplan';

import JwcKebiaoScreen from './jwc-kebiao-screen';

class FrontpageScreen extends Component {
  constructor(props) {
    super (props);
  }


  render() {
    const { t } = this.props;

    return (
      <JwcKebiaoScreen t={t}></JwcKebiaoScreen>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { groupStageWeekId, groupList } = props;
  console.log("mapStateToProps: "+groupStageWeekId + groupList);
  return {
    schoolYear: getSchoolYear(state),
    schoolWeek: getSchoolWeek(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(rawplanActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(FrontpageScreen));
