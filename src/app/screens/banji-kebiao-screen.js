/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Flex,
} from '@chakra-ui/core';

import {
  SubjectBoard,
  ResultTabList,
  ResultTable,
} from '../components';

import { actions as authActions, getLoggedUser } from '../redux/modules/auth';
import { actions as subjectActions, getSubjectByGrade } from '../redux/modules/subject';

const BANJIKEBIAO_COLOR = "blue";
class BanJiKeBiaoScreen extends Component {
  constructor(props) {
    super(props);
    this.gradeInfo = "";
  }

  componentDidMount() {
    this.initUI();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.location.key !== this.props.location.key) {
      this.initUI();
    }
  }

  initUI = () => {
    const { edu, grd } = this.props.location.state;
    this.gradeInfo = edu.name + grd.name;

    if (this.subjectsData == null || this.subjectsData.length === 0) { // only get subjects when it's empty
      this.props.fetchSubjects(edu.id, grd.id);
    }
  }

  buildData = () => {
    this.buildSubjects();
  }

  buildSubjects = () => {
    if (this.subjectsData == null || this.subjectsData.length === 0) {
      const { subjects } = this.props;
      this.subjectsData = subjects == null ? [] : subjects;
    }
  }

  buildResultTables = () => {

  }

  onTabChanged = () => {

  }

  render() {
    const { t } = this.props;
    this.buildData();
    const { gradeInfo, subjectsData, tabTitles, pageTables,
            onTabChanged } = this;
    return (
      <Flex width="100%" direction="column" justify="center" align="center">
        <SubjectBoard
          my={4}
          color={BANJIKEBIAO_COLOR}
          title={t("subjectBoard.title_template", {grade_info: gradeInfo})}
          subjects={ subjectsData }/>
        {
          tabTitles.length > 0 &&
          <ResultTabList
            my={4}
            width="100%"
            tabHeight={50}
            color={BANJIKEBIAO_COLOR}
            titles={tabTitles}
            onChange={onTabChanged}
            pages={pageTables} />
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { edu, grd } = props.location.state;
  return {
    user: getLoggedUser(state),
    subjects: getSubjectByGrade(state, edu.id, grd.id),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(authActions, dispatch),
    ...bindActionCreators(subjectActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(BanJiKeBiaoScreen));
