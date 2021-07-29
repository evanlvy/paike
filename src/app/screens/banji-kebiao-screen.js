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
  ResultTable,
} from '../components';

import { getSchoolYear, getSchoolWeek } from '../redux/modules/grade';
import { actions as subjectActions, getSubjectByGrade } from '../redux/modules/subject';
import { actions as banjiActions, buildGradeSubjectId, getBanjiBySubject } from '../redux/modules/banji';
import { actions as kebiaoActions, buildBanjiSchedId, getKeBiaoByAllBanjiSched } from '../redux/modules/kebiao';

import { SEMESTER_WEEK_COUNT } from './common/info';

const BANJIKEBIAO_COLOR = "blue";
class BanJiKeBiaoScreen extends Component {
  constructor(props) {
    super(props);
    const { t, schoolWeek } = props;
    this.state = {
      selectedSubjectIndex: 0,
      selectedBanjiIndex: 0,
      selectWeek: schoolWeek ? schoolWeek : 1,
      hasFetchKebiao: true,
    };

    this.semesterPages = [];
    this.tabTitles = [];
    this.tableHeaders = [
      {name: t("kebiao.sched_title"), field: "sched_name"},
      {name: t("kebiao.sched_monday"), field: "monday"},
      {name: t("kebiao.sched_tuesday"), field: "tuesday"},
      {name: t("kebiao.sched_wednesday"), field: "wednesday"},
      {name: t("kebiao.sched_thursday"), field: "thursday"},
      {name: t("kebiao.sched_friday"), field: "friday"},
      {name: t("kebiao.sched_saturday"), field: "saturday"},
      {name: t("kebiao.sched_sunday"), field: "sunday"},
    ];
    this.tableDataList = [];
    this.banjiSelectWeeks = [];
    this.curDataIndex = 0;

    this.tabsListRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, schoolWeek, subjects, banjiBySubject, kebiaoByBanjiSched, location } = this.props;
    const { selectedSubjectIndex, selectedBanjiIndex, selectWeek, hasFetchKebiao } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    if (nextProps.location.state.grd !== location.state.grd || nextProps.location.state.edu !== location.state.edu) {
      this.resetData();
      console.log("shouldComponentUpdate, location state diff");
      return true;
    } else if (nextProps.schoolYear !== schoolYear || nextProps.schoolWeek !== schoolWeek
    || nextProps.subjects !== subjects || nextProps.banjiBySubject !== banjiBySubject || nextProps.kebiaoByBanjiSched !== kebiaoByBanjiSched) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedSubjectIndex !== selectedSubjectIndex || nextState.selectedBanjiIndex !== selectedBanjiIndex
    || nextState.selectWeek !== selectWeek || nextState.hasFetchKebiao !== hasFetchKebiao) {
      console.log("shouldComponentUpdate, state diff");
      return true;
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
    if (this.selectedBanji && !this.state.hasFetchKebiao) {
      const { schoolWeek } = this.props;
      console.log("loadBanjiKebiao: schoolWeek: "+schoolWeek);
      this.banjiSelectWeek = schoolWeek;
      this.loadKebiao(this.banjiSelectWeek);
    }
  }

  resetData = () => {
    console.log("reset kebiao data");
    this.resetSubjectData();
    this.resetBanjiData();
  }

  resetSubjectData = () => {
    this.subjectsData = null;
    this.selectedSubject = null;
    this.hasFetchBanji = false;
    this.setState({
      selectedSubjectIndex: 0,
    });
  }

  resetBanjiData = () => {
    const { schoolWeek } = this.props;
    this.banjiData = null;
    this.selectedBanji = null;
    this.banjiSelectWeeks = [];
    this.banjiSelectWeek = schoolWeek ? schoolWeek : 1;
    this.tableDataList = [];
    this.curDataIndex = 0;
    if (this.tabsListRef.current) {
      this.tabsListRef.current.reset();
    }
    this.setState({
      selectedBanjiIndex: 0,
      selectWeek: schoolWeek ? schoolWeek : 1,
      hasFetchKebiao: false
    });
  }

  buildData = () => {
    this.buildSemester();
    this.buildGradeInfo();
    this.buildSubjects();
    this.buildBanji();
    this.buildKebiao();
  }

  buildSemester = () => {
    const { t } = this.props;
    const { semesterPages } = this;
    if (semesterPages.length === 0) {
      for (let i=0; i < SEMESTER_WEEK_COUNT; i++) {
        semesterPages.push({ name: t("kebiao.semester_week_template", {index: i+1}) });
      }
    }
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
    if (!this.banjiData || this.banjiData.length === 0) {
      this.banjiData = banjiBySubject[gradeSubjectId];
      console.log("BanjiData: "+JSON.stringify(this.banjiData));
      this.setBanjiSelectedIndex(0);
    }
    // update Tab Titles
    this.updateTabTitles();
  }

  updateTabTitles = () => {
    this.tabTitles = [];
    if (!this.banjiData) {
      return;
    }
    this.banjiData.forEach(banjiInfo => {
      this.tabTitles.push(banjiInfo.name);
    });
    console.log(`updateTabTitles: ${JSON.stringify(this.tabTitles)}`);
  }

  setBanjiSelectedIndex = (index) => {
    if (this.banjiData && index < this.banjiData.length) {
      this.selectedBanji = this.banjiData[index];
      let selectWeek = this.banjiSelectWeeks[index];
      if (selectWeek == null) { // not set week index of this banji, reset it
        this.banjiSelectWeeks[index] = this.banjiSelectWeek;
      }
      this.banjiSelectWeek = this.banjiSelectWeeks[index];
    } else {
      this.selectedBanji = null;
    }
  }

  loadBanji = () => {
    if (!this.selectedSubject) {
      console.error("No selected subject defined");
      return;
    }
    console.log("loadBanji");
    const { grd } = this.props.location.state;
    this.props.fetchBanji(grd.id, this.selectedSubject.id);
    this.hasFetchBanji = true;
    this.resetBanjiData();
  }

  buildKebiao = () => {
    const { kebiaoByBanjiSched, schoolYear, schoolWeek } = this.props;
    const { banjiSelectWeek } = this;
    if (!this.selectedBanji || !schoolYear || !schoolWeek) {
      return;
    }

    const banjiSchedId = buildBanjiSchedId(this.selectedBanji.id, schoolYear, banjiSelectWeek);
    console.log("Get kebiaoInfo of "+banjiSchedId);
    const kebiaoInfo = kebiaoByBanjiSched[banjiSchedId];
    if (kebiaoInfo) {
      console.log("KebiaoInfo: "+JSON.stringify(kebiaoInfo));
      this.tableDataList[this.curDataIndex] = this.buildKebiaoTableSched(kebiaoInfo);
    } else {
      this.tableDataList[this.curDataIndex] = [];
    }
    console.log("kebiaoTable: "+JSON.stringify(this.tableDataList[this.curDataIndex]));
  }

  buildLiLunName = (kebiaoHour) => {
    let curName = kebiaoHour.curriculum;
    if (kebiaoHour.theory_teachers && kebiaoHour.theory_teachers.length > 0) {
      curName += " ("
      kebiaoHour.theory_teachers.forEach(teacher => {
        curName += teacher.name+" ";
      });
      curName.trim();
      curName +=")"
    }
    return curName;
  }

  buildShiXunName = (kebiaoHour) => {
    return kebiaoHour.labitem_name+" ("+kebiaoHour.lab_location+")";
  }

  buildKebiaoTableSched = (kebiaoInfo) => {
    const { t } = this.props;
    const fields_names = [
      "sched_name", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
    ];
    const row_names = [
      t("kebiao.sched_12")+t("kebiao.sched_unit"),
      t("kebiao.sched_34")+t("kebiao.sched_unit"),
      t("kebiao.sched_5")+t("kebiao.sched_unit"),
      t("kebiao.sched_67")+t("kebiao.sched_unit"),
      t("kebiao.sched_89")+t("kebiao.sched_unit"),
      t("kebiao.sched_1011")+t("kebiao.sched_unit"),
      t("kebiao.sched_1213")+t("kebiao.sched_unit"),
    ];
    let resultList = [];
    for (let i=1; i < fields_names.length; i++) {
      const kebiaoDay = kebiaoInfo[i-1];
      const defaultName = i < 6 ? t("kebiao.zixi") : ""; // Before Friday, we treat space time as zixi. Other days, we just let it be empty.
      const shizhengName = i < 6 ? t("kebiao.shizheng") : "";
      for (let j=0; j < row_names.length; j++) {
        if (!resultList[j]) {
          resultList[j] = {};
          resultList[j][fields_names[0]] = row_names[j];
        }
        let names = [defaultName];
        let hourIndex = j;
        if (j === 2) { // all 5 are course "shizheng"
          resultList[j][fields_names[i]] = shizhengName;
          continue;
        } else if (j > 2) {
          hourIndex = j-1;
        }
        const kebiaoHourList = kebiaoDay ? kebiaoDay[hourIndex] : null;
        if (kebiaoHourList && kebiaoHourList.length > 0) {
          names = []; // reset name list
          kebiaoHourList.forEach(kebiaoHour => {
            let name;
            if (kebiaoHour.is_lab === 1) {
              name = this.buildShiXunName(kebiaoHour);
            } else {
              name = this.buildLiLunName(kebiaoHour);
            }
            if (name) {
              names.push(name);
            }
          });
        }
        resultList[j][fields_names[i]] = { titles: names, data: kebiaoHourList };
      }
    }
    return resultList;
  }

  loadKebiao = (selectWeek) => {
    if (!this.selectedBanji) {
      console.error("BanjiData not selected yet");
      return;
    }
    const { schoolYear } = this.props;
    console.log("loadBanjiKebiao, year: "+schoolYear+" week: "+selectWeek);
    const banjiIds = [this.selectedBanji.id];
    this.props.fetchKeBiaoByBanji(banjiIds, schoolYear, selectWeek, selectWeek+1);
    this.setState({
      hasFetchKebiao: true
    });
  }

  onSubjectClicked = (index) => {
    console.log(`onSubjectClicked ${this.subjectsData[index].title}`);
    this.setState({
      selectedSubjectIndex: index,
    });
    this.setSubjectSelectedIndex(index);
    this.loadBanji();
  }

  onTabChanged = (index) => {
    console.log(`onTabChanged ${this.banjiData[index].name}`);
    this.curDataIndex = index;
    this.setBanjiSelectedIndex(index);
    this.loadKebiao(this.banjiSelectWeek);
    this.setState({
      selectedBanjiIndex: index,
      selectWeek: this.banjiSelectWeek
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    this.banjiSelectWeek = index+1;
    this.banjiSelectWeeks[this.state.selectedBanjiIndex] = this.banjiSelectWeek;
    this.setState({
      selectWeek : this.banjiSelectWeek
    });
    this.loadKebiao(this.banjiSelectWeek);
  }

  render() {
    const { t } = this.props;
    const { selectedSubjectIndex } = this.state;
    this.buildData();
    const { subjectsData, subjectTitle, banjiName, banjiSelectWeek,
      tabTitles, tableHeaders, tableDataList, semesterPages,
      onSubjectClicked, onTabChanged, onSemesterPageChanged } = this;
    const pageTables = [];
    console.log("render: banjiSelectWeek: "+banjiSelectWeek);
    for (let i=0; i < tabTitles.length; i++) {
      if (tableDataList[i]) {
        pageTables[i] = (<ResultTable
          height={450}
          titleHeight={50}
          colLineHeight={20}
          defaultColWidth={180}
          title={banjiName}
          color={BANJIKEBIAO_COLOR}
          headers={tableHeaders}
          data={tableDataList[i]}
          pageNames={semesterPages}
          pagePrevCaption={t("kebiao.prev_semester_week")}
          pageNextCaption={t("kebiao.next_semester_week")}
          onResultPageIndexChanged={onSemesterPageChanged}
          initPageIndex={banjiSelectWeek-1}
          pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]} />);
      } else {
        pageTables[i] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
      }
    }
    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        <SubjectBoard
          my={4}
          color={BANJIKEBIAO_COLOR}
          title={subjectTitle}
          subjects={subjectsData}
          initSelectIndex={selectedSubjectIndex}
          onSubjectClicked={onSubjectClicked}
          enableSelect />
        {
          tabTitles && tabTitles.length > 0 &&
          <ResultTabList
            ref={this.tabsListRef}
            my={4}
            width="100%"
            maxWidth={1444}
            tabHeight={50}
            color={BANJIKEBIAO_COLOR}
            titles={tabTitles}
            onTabChange={onTabChanged}
            pages={pageTables} />
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state, props) => {
  const { edu, grd } = props.location.state;
  return {
    schoolYear: getSchoolYear(state),
    schoolWeek: getSchoolWeek(state),
    subjects: getSubjectByGrade(state, edu.id, grd.id),
    banjiBySubject: getBanjiBySubject(state),
    kebiaoByBanjiSched: getKeBiaoByAllBanjiSched(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(subjectActions, dispatch),
    ...bindActionCreators(banjiActions, dispatch),
    ...bindActionCreators(kebiaoActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(BanJiKeBiaoScreen));
