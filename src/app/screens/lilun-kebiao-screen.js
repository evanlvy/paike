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
  ResultTabList,
  ResultTable
} from '../components';

import { actions as subjectActions, getSubjectByGrade } from '../redux/modules/subject';
import { actions as banjiActions, buildGradeSubjectId, getBanjiBySubject } from '../redux/modules/banji';
import { actions as kebiaoActions, buildBanjiSchedId, getLiLunByAllBanjiSched } from '../redux/modules/kebiao';

const LILUNKEBIAO_COLOR = "orange";
class LiLunKeBiaoScreenWrapped extends Component {
  constructor(props) {
    super(props);
    const { t } = props;
    this.state = {
      selectedSubjectIndex: 0,
      selectWeek: 5,
      labs: []
    };

    this.tabTitles = [
      t("kebiao.semester_one_first"),
      t("kebiao.semester_one_second"),
      t("kebiao.semester_two_first"),
      t("kebiao.semester_two_second"),
    ];
    this.tableHeaders = [
      {name: t("kebiao.banji_sched_title"), field: "class_name"},
      {name: t("kebiao.sched_monday")+" "+t("kebiao.sched_12"), field: "monday_12"},
      {name: t("kebiao.sched_34"), field: "monday_34"},
      {name: t("kebiao.sched_67"), field: "monday_67"},
      {name: t("kebiao.sched_89"), field: "monday_89"},
      {name: t("kebiao.sched_tuesday")+" "+t("kebiao.sched_12"), field: "tuesday_12"},
      {name: t("kebiao.sched_34"), field: "tuesday_34"},
      {name: t("kebiao.sched_67"), field: "tuesday_67"},
      {name: t("kebiao.sched_89"), field: "tuesday_89"},
      {name: t("kebiao.sched_wednesday")+" "+t("kebiao.sched_12"), field: "wednesday_12"},
      {name: t("kebiao.sched_34"), field: "wednesday_34"},
      {name: t("kebiao.sched_67"), field: "wednesday_67"},
      {name: t("kebiao.sched_89"), field: "wednesday_89"},
      {name: t("kebiao.sched_thursday")+" "+t("kebiao.sched_12"), field: "thursday_12"},
      {name: t("kebiao.sched_34"), field: "thursday_34"},
      {name: t("kebiao.sched_67"), field: "thursday_67"},
      {name: t("kebiao.sched_89"), field: "thursday_89"},
      {name: t("kebiao.sched_friday")+" "+t("kebiao.sched_12"), field: "friday_12"},
      {name: t("kebiao.sched_34"), field: "friday_34"},
      {name: t("kebiao.sched_67"), field: "friday_67"},
      {name: t("kebiao.sched_89"), field: "friday_89"},
    ];
    this.yearPages = [
      {name: t("lilunKebiaoScreen.year_template", {year: 2019})},
      {name: t("lilunKebiaoScreen.year_template", {year: 2020})}
    ];
    this.kebiaoDataList = [];
    this.tableDataList = [];
    this.curDataIndex = 0;

    this.tabsListRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { subjects, banjiBySubject, kebiaoByBanjiSched, location } = this.props;
    const { selectedSubjectIndex, selectWeek } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    if (nextProps.location.state.grd !== location.state.grd || nextProps.location.state.edu !== location.state.edu) {
      this.resetData();
      console.log("shouldComponentUpdate, location state diff");
      return true;
    } else if (nextProps.subjects !== subjects || nextProps.banjiBySubject !== banjiBySubject || nextProps.kebiaoByBanjiSched !== kebiaoByBanjiSched) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedSubjectIndex !== selectedSubjectIndex || nextState.selectWeek !== selectWeek ) {
      console.log("shouldComponentUpdate, state diff");
      return true
    }
    return false;
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData = () => {
    if (!this.subjectsData || this.subjectsData.length === 0) { // only get subjects when it's empty
      this.loadSubjects();
    }
    if (this.selectedSubject && !this.hasFetchBanji) {
      this.loadBanji();
    }
    if (this.banjiData && !this.hasFetchKebiao) {
      const { selectWeek } = this.state;
      this.loadKebiao(selectWeek);
    }
  }

  resetData = () => {
    console.log("reset kebiao data");
    this.tabsListRef.current.reset();
    this.subjectsData = null;
    this.selectedSubject = null;
    this.hasFetchBanji = false;
    this.banjiData = null;
    this.hasFetchKebiao = false;
    this.curDataIndex = 0;
    this.setState({
      selectWeek: 5,
    });
  }

  buildData = () => {
    this.buildGradeInfo();
    this.buildSubjects();
    this.buildBanji();
    this.buildKebiao();
  }

  buildGradeInfo = () => {
    const { edu, grd } = this.props.location.state;
    this.gradeInfo = edu.name + grd.name;
  }

  buildSubjects = () => {
    if (this.subjectsData == null || this.subjectsData.length === 0) {
      const { subjects } = this.props;
      this.subjectsData = !subjects ? [] : subjects;
      this.setSubjectSelectedIndex(this.state.selectedSubjectIndex);
    }
    this.updateSubjectTitle();
  }

  updateSubjectTitle = () => {
    const { t } = this.props;
    const { selectedSubject, gradeInfo } = this;
    if (selectedSubject) {
      this.subjectTitle = t("subjectBoard.title_template", {subject_name: selectedSubject.title, grade_info: gradeInfo})
    } else {
      this.subjectTitle = t("subjectBoard.title_no_subject_template", {grade_info: gradeInfo})
    }
  }

  setSubjectSelectedIndex = (index) => {
    if (this.subjectsData && index < this.subjectsData.length) {
      this.selectedSubject = this.subjectsData[index];
    } else {
      this.selectedSubject = null;
    }
  }

  loadSubjects = () => {
    console.log("loadSubjects");
    const { edu, grd } = this.props.location.state;
    this.props.fetchSubjects(edu.id, grd.id);
  }

  buildBanji = () => {
    const { grd } = this.props.location.state;
    const { banjiBySubject } = this.props;
    if (!this.selectedSubject) {
      this.banjiData = null;
      return;
    }
    const gradeSubjectId = buildGradeSubjectId(grd.id, this.selectedSubject.id);
    this.banjiData = banjiBySubject[gradeSubjectId];
    console.log("BanjiData: "+JSON.stringify(this.banjiData));
  }

  loadBanji = () => {
    if (!this.selectedSubject) {
      console.error("No selected subject defined");
      return;
    }
    console.log("loadBanji");
    const { grd } = this.props.location.state;
    this.props.fetchBanji(grd.id, this.selectedSubject.id);
    this.tableDataList = [];
    this.kebiaoDataList = [];
    this.hasFetchBanji = true;
    this.hasFetchKebiao = false;
  }

  buildKebiao = () => {
    const { kebiaoByBanjiSched } = this.props;
    const { selectWeek } = this.state;
    if (!this.banjiData) {
      this.kebiaoData = null;
      return;
    }

    const kebiaoData = [];
    const tableData = []
    this.banjiData.forEach(banjiInfo => {
      const banjiSchedId = buildBanjiSchedId(banjiInfo.id, 3, selectWeek);
      console.log("Get kebiaoInfo of "+banjiSchedId);
      const kebiaoInfo = kebiaoByBanjiSched[banjiSchedId];
      if (kebiaoInfo) {
        kebiaoData.push(kebiaoInfo);
        let tableItem = {class_name: {title: banjiInfo.name}, ...this.buildKebiaoTableSched(kebiaoInfo)};
        tableData.push(tableItem);
      }
    });
    if (!this.kebiaoDataList[this.curDataIndex] || this.kebiaoDataList[this.curDataIndex].length !== kebiaoData.length) {
      this.kebiaoDataList[this.curDataIndex] = kebiaoData;
      this.tableDataList[this.curDataIndex] = tableData;
    }
    //console.log("KebiaoData: "+JSON.stringify(this.kebiaoData));
    console.log("kebiaoTable: "+JSON.stringify(this.tableDataList[this.curDataIndex]));
  }

  buildKebiaoTableSched = (kebiaoInfo) => {
    const { t } = this.props;
    let kebiaoNames = [];
    kebiaoInfo.forEach(kebiaoDay => {
      for (let i=0; i < 4; i++) {
        const kebiaoHour = kebiaoDay[i];
        let name = t("kebiao.zixi");
        if (kebiaoHour && kebiaoHour.curriculum) {
          name = kebiaoHour.curriculum;
          if (kebiaoHour.theory_teachers && kebiaoHour.theory_teachers.length > 0) {
            kebiaoHour.theory_teachers.forEach(teacher => {
              name += " "+teacher.name;
            });
          }
        }
        kebiaoNames.push(name);
      }
    })

    return {
      monday_12: kebiaoNames[0], monday_34: kebiaoNames[1], monday_67: kebiaoNames[2], monday_89: kebiaoNames[3],
      tuesday_12: kebiaoNames[4], tuesday_34: kebiaoNames[5], tuesday_67: kebiaoNames[6], tuesday_89: kebiaoNames[7],
      wednesday_12: kebiaoNames[8], wednesday_34: kebiaoNames[9], wednesday_67: kebiaoNames[10], wednesday_89: kebiaoNames[11],
      thursday_12: kebiaoNames[12], thursday_34: kebiaoNames[13], thursday_67: kebiaoNames[14], thursday_89: kebiaoNames[15],
      friday_12: kebiaoNames[16], friday_34: kebiaoNames[17], friday_67: kebiaoNames[18], friday_89: kebiaoNames[19]
    };
  }

  loadKebiao = (selectWeek) => {
    if (!this.banjiData) {
      console.error("BanjiData not got yet");
      return;
    }
    console.log("loadKebiao");
    let banjiIds = [];
    this.banjiData.forEach(banjiInfo => {
      banjiIds.push(banjiInfo.id);
    })
    this.props.fetchLiLunByBanji(banjiIds, 3, selectWeek, selectWeek+1);
    this.hasFetchKebiao = true;
  }

  onSubjectClicked = (index) => {
    console.log(`onSubjectClicked ${this.subjectsData[index].title}`)
    this.setState({
      selectedSubjectIndex: index
    });
    this.setSubjectSelectedIndex(index);
    this.loadBanji();
  }

  onTabChanged = (index) => {
    const { tabTitles } = this;
    console.log("onTabChanged: "+tabTitles[index]);
    this.curDataIndex = index;
    const weekIndex = 5+9*index;
    this.setState({
      selectWeek : weekIndex
    });
    this.loadKebiao(weekIndex);
  }

  onYearPageChanged = (index) => {
    console.log("onYearPageChange: "+JSON.stringify(this.yearPages[index]));
  }

  render() {
    const { t } = this.props;
    const { selectedSubjectIndex } = this.state;
    this.buildData();
    const { gradeInfo, subjectsData, subjectTitle,
      tabTitles, tableHeaders, tableDataList, yearPages,
      onSubjectClicked, onTabChanged, onYearPageChanged} = this;
    const pageTables = [];
    for (let i=0; i < tabTitles.length; i++) {
      if (tableDataList[i]) {
        pageTables[i] = (<ResultTable
          height={400}
          titleHeight={50}
          colLineHeight={20}
          defaultColWidth={100}
          title={t("lilunKebiaoScreen.title_template", {grade_info: gradeInfo, semester_info: tabTitles[i]})}
          color={LILUNKEBIAO_COLOR}
          headers={tableHeaders}
          data={tableDataList[i]}
          pageNames={yearPages}
          initPageIndex={1}
          pagePrevCaption={t("lilunKebiaoScreen.prev_year")}
          pageNextCaption={t("lilunKebiaoScreen.next_year")}
          onResultPageIndexChanged={onYearPageChanged} />);
      } else {
        pageTables[i] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
      }
    }
    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        <SubjectBoard
          my={4}
          color={LILUNKEBIAO_COLOR}
          title={subjectTitle}
          subjects={subjectsData}
          initSelectIndex={selectedSubjectIndex}
          onSubjectClicked={onSubjectClicked}
          enableSelect />
        <ResultTabList
          ref={this.tabsListRef}
          my={4}
          width="100%"
          maxWidth={1444}
          tabHeight={50}
          color={LILUNKEBIAO_COLOR}
          titles={tabTitles}
          onTabChange={onTabChanged}
          pages={pageTables} />
      </Flex>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { edu, grd } = props.location.state;
  return {
    subjects: getSubjectByGrade(state, edu.id, grd.id),
    banjiBySubject: getBanjiBySubject(state),
    kebiaoByBanjiSched: getLiLunByAllBanjiSched(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(subjectActions, dispatch),
    ...bindActionCreators(banjiActions, dispatch),
    ...bindActionCreators(kebiaoActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(LiLunKeBiaoScreenWrapped));
