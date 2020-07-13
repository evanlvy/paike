/* @flow */

import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';

import {
  Flex
} from '@chakra-ui/core';

import {
  SubjectBoard,
  ResultTabList,
  ResultTable,
} from '../components';

import { getEducationText } from '../models/grade';

const LILUNKEBIAO_COLOR = "orange";
class LiLunKeBiaoScreenWrapped extends Component {
  constructor(props) {
    super(props);
    this.state = {
      grade_info: ""
    };
    this.tabTitles = [
      "第一学期1-9周",
      "第一学期10-18周",
      "第二学期1-9周",
      "第二学期10-18周",
    ];
  }

  componentDidMount() {
    console.log("LiLunKeBiaoScreen componentDidMount");
    this.initUI();
  }

  componentDidUpdate(prevProps) {
    console.log("LiLunKeBiaoScreen componentDidUpdate "+prevProps.location.key+" -> "+this.props.location.key);
    if (prevProps.location.key !== this.props.location.key) {
      this.initUI();
    }
  }

  initUI = () => {
    const { t } = this.props;
    const { edu, grd } = this.props.location.state;
    const grade_info = getEducationText(t, edu) + t("grade.grade_template", {grade: grd});
    console.log("initUI grade: "+grade_info);
    this.setState({
      grade_info: grade_info
    })
  }

  render() {
    const { t } = this.props;
    const { grade_info } = this.state;
    return (
      <Flex width="100%" direction="column" justify="center" align="center">
        <SubjectBoard
          my={4}
          color={LILUNKEBIAO_COLOR}
          title={t("subjectBoard.title_template", {grade_info: grade_info})}/>
        <ResultTabList
          my={4}
          width="100%"
          tabHeight={50}
          color={LILUNKEBIAO_COLOR}
          titles={this.tabTitles}
          pages={[
            (<ResultTable height={250} titleHeight={50} title={t("lilunKebiaoScreen.title_template", {grade_info: grade_info, semester_info: this.tabTitles[0]})} color={LILUNKEBIAO_COLOR} />),
            (<ResultTable height={250} titleHeight={50} title={t("lilunKebiaoScreen.title_template", {grade_info: grade_info, semester_info: this.tabTitles[1]})} color={LILUNKEBIAO_COLOR} />) ,
            (<ResultTable height={250} titleHeight={50} title={t("lilunKebiaoScreen.title_template", {grade_info: grade_info, semester_info: this.tabTitles[2]})} color={LILUNKEBIAO_COLOR} />),
            (<ResultTable height={250} titleHeight={50} title={t("lilunKebiaoScreen.title_template", {grade_info: grade_info, semester_info: this.tabTitles[3]})} color={LILUNKEBIAO_COLOR} />)]}
        />
      </Flex>
    );
  }
}
const LiLunKeBiaoScreen = withTranslation()(LiLunKeBiaoScreenWrapped)

export { LiLunKeBiaoScreen };
