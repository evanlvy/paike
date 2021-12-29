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
import { actions as banjiActions, getBanjiBySelectedSubject } from '../redux/modules/banji';
import { actions as kebiaoActions, buildBanjiSchedId, getKeBiaoByAllBanjiSched } from '../redux/modules/kebiao';

import { SEMESTER_WEEK_COUNT } from './common/info';

const DEFAULT_COLOR = "blue";
class BanJiKeBiaoScreen extends Component {
  constructor(props) {
    super(props);
    const { t, schoolWeek, color } = props;
    this.state = {
      selectedBanjiIndex: 0,
      selectedMajorId: 0,
      initMajorId: props.location.state.major?props.location.state.major.id:-1,
      initBanjiIndex: props.location.state.clas?props.location.state.clas.idx:0,
      selectWeek: schoolWeek ? schoolWeek : 1,
      refreshFlag: false,
    };
    this.color = color ? color : DEFAULT_COLOR;
    this.semesterPages = [];
    this.pageTables = [];
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
    this.curDataIndex = 0;

    this.tabsListRef = React.createRef();
    this.buildSemester();
  }

  static getDerivedStateFromProps(props) {
    let result = {};
    const { banjiBySubject, subjects } = props;
    const { edu, grd, major, clas } = props.location.state;
    if (!Array.isArray(subjects) && edu && edu.id && grd && grd.id) {
      console.log("LIFECYCLE: getDerivedStateFromProps:call fetchSubjects");
      props.fetchSubjects(edu.id, grd.id);
    }
    if ((!Array.isArray(banjiBySubject) || banjiBySubject.length < 1) && major && major.id && grd && grd.id) {
      // This was called when student login with student number only!
      result = {...result, ...{initMajorId: major.id}};
      console.log("LIFECYCLE: getDerivedStateFromProps:call fetchBanji");
      //props.fetchBanji(grd.id, major.id);
    }
    if (clas && clas.idx) {
      result = {...result, ...{initBanjiIndex: clas.idx}};
    }
    console.log("LIFECYCLE: getDerivedStateFromProps:"+JSON.stringify(result));
    return result;
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, schoolWeek, subjects, banjiBySubject, kebiaoByBanjiSched } = this.props;
    const { selectedMajorId, selectedBanjiIndex, selectWeek, refreshFlag, initBanjiIndex, initMajorId } = this.state;
    console.log("LIFECYCLE: shouldComponentUpdate++ Refresh="+(nextState.refreshFlag !== refreshFlag));
    if (nextProps.kebiaoByBanjiSched !== kebiaoByBanjiSched) {
      // Load kebiao done. Build the view table.
      console.log("LIFECYCLE: shouldComponentUpdate: buildKebiao");
      this.buildKebiao(nextProps, nextState);
      return true;
    } else if (nextProps.banjiBySubject !== banjiBySubject) {
      if (JSON.stringify(nextProps.banjiBySubject) !== JSON.stringify(banjiBySubject)) {
        console.log("LIFECYCLE: shouldComponentUpdate: buildClasses");
        this.buildClasses(nextProps.banjiBySubject, nextProps, nextState);
        return true;
      }
    } else if (nextState.initBanjiIndex !== initBanjiIndex || nextState.initMajorId !== initMajorId) {
      this.resetData();
      console.log("LIFECYCLE: shouldComponentUpdate, location state diff");
      return true;
    } else if (nextProps.schoolYear !== schoolYear || nextProps.schoolWeek !== schoolWeek
    || nextProps.subjects !== subjects || nextProps.kebiaoByBanjiSched !== kebiaoByBanjiSched) {
      console.log("LIFECYCLE: shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedMajorId !== selectedMajorId || nextState.selectedBanjiIndex !== selectedBanjiIndex
    || nextState.selectWeek !== selectWeek || nextState.refreshFlag !== refreshFlag) {
      console.log("LIFECYCLE: shouldComponentUpdate, state diff");
      return true;
    }
    console.log("LIFECYCLE: shouldComponentUpdate return false!");
    return false;
  }

  /*componentDidMount() {
  }*/

  componentDidUpdate(prevProps, prevState) {
    console.log("LIFECYCLE: componentDidUpdate");
    const { edu, grd, major, clas } = prevProps.location.state;
    const { edu: edu2, grd: grd2, major: major2, clas: clas2 } = this.props.location.state;
    if (edu !== edu2 || grd !== grd2) {
      this.resetData();
      //this.buildGradeInfo();
      console.log("LIFECYCLE: componentDidUpdate: call fetchSubjects");
      this.props.fetchSubjects(edu2.id, grd2.id);
    }
    if (grd !== grd2) {
      console.log("LIFECYCLE: componentDidUpdate: call fetchBanji");
      let major_id = this.state.selectedMajorId;
      if (major2 && major !== major2) {
        major_id = major2.id;
      }
      this.props.fetchBanji(grd2.id, major_id);
      //this.updateSubjectTitle();
    }
    if (/*prevState.selectWeek !== this.state.selectWeek 
       || */prevProps.schoolYear !== this.props.schoolYear
       || prevProps.banjiBySubject !== this.props.banjiBySubject
       || prevState.selectedBanjiIndex !== this.state.selectedBanjiIndex
       || prevState.selectedMajorId !== this.state.selectedMajorId) {
      if (prevState.selectedMajorId !== this.state.selectedMajorId) {
        this.tabTitles = [];
        this.pageTables = [];
      }
      // LoadKebiao API call required once week changed-->get teacher job for new week-->kebiaoByTeacherSched
      console.log("LIFECYCLE: componentDidUpdate: loadKebiao");
      this.loadKebiao(this.state.selectWeek);
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
      selectedMajorId: 0,
    });
  }

  resetBanjiData = () => {
    this.tableDataList = [];
    this.tabTitles = [];
    this.pageTables = [];
    this.curDataIndex = 0;
    if (this.tabsListRef.current) {
      this.tabsListRef.current.reset();
    }
    this.setState({
      selectedBanjiIndex: 0,
      //selectWeek: schoolWeek ? schoolWeek : 1,
    });
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

  buildClasses = (class_array=null, props=this.props, state=this.state) => {
    const { banjiBySubject } = props;
    const { initBanjiIndex } = state;
    this.tabTitles = [];
    this.defaultClassIdx = 1;
    if (class_array === null) {
      if (!Array.isArray(banjiBySubject) || banjiBySubject.length < 1) {
        return;
      }
      class_array = banjiBySubject;
    }
    if (Array.isArray(class_array) && class_array.length > 0) {
      class_array.forEach(classInfo => {
        this.tabTitles.push(classInfo.name);
      });
    }
    if (initBanjiIndex > 0 && initBanjiIndex <= banjiBySubject.length) {
      this.defaultClassIdx = initBanjiIndex;
    }
    console.log(`updateTabTitles: ${JSON.stringify(this.tabTitles)}`);
  }

  loadBanji = (majorId=0) => {
    if (majorId <= 0) {
      const { selectedMajorId } = this.state;
      if (selectedMajorId < 1) {
        console.error("No selected subject defined");
        return;
      }
      majorId = selectedMajorId;
    }
    console.log("loadBanji for major:" + majorId);
    const { grd } = this.props.location.state;
    this.props.fetchBanji(grd.id, majorId);
    this.hasFetchBanji = true;
    this.resetBanjiData();
  }

  getBanjiId = (class_idx, props=this.props, state=this.state) => {
    const { banjiBySubject } = props;
    if ( state.selectedMajorId < 1) {
      return -1;
    }
    if (!Array.isArray(banjiBySubject) || banjiBySubject.length <= class_idx) {
      return -1;
    }
    return banjiBySubject[class_idx].id;
  }

  buildKebiao = (props, state) => {
    const { kebiaoByBanjiSched, schoolYear, banjiBySubject } = props;
    const { selectedBanjiIndex, selectWeek } = state;

    if ( !schoolYear || selectWeek <= 0 ||
      JSON.stringify(kebiaoByBanjiSched)==='{}' || !Array.isArray(banjiBySubject) || banjiBySubject.length < 1) {
      return;
    }
    const banjiId = this.getBanjiId(selectedBanjiIndex, props, state);
    const banjiSchedId = buildBanjiSchedId(banjiId, schoolYear, selectWeek);
    console.log("buildKebiao: Get kebiaoInfo of "+banjiSchedId);
    const kebiaoInfo = kebiaoByBanjiSched[banjiSchedId];
    if (kebiaoInfo) {
      //console.log("KebiaoInfo: "+JSON.stringify(kebiaoInfo));
      this.tableDataList[this.curDataIndex] = this.buildKebiaoTableSched(kebiaoInfo);
    } else {
      this.tableDataList[this.curDataIndex] = [];
    }
    //console.log("kebiaoTable: "+JSON.stringify(this.tableDataList[this.curDataIndex]));
    this.pageTables = this.generateTabTables(props, state);
    //console.log("buildKebiao: pageTables: "+JSON.stringify(this.pageTables));
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

  loadKebiao = (selectWeek=0) => {
    const { selectedBanjiIndex, selectWeek: weekProp } = this.state;
    const { schoolYear, banjiBySubject, kebiaoByBanjiSched } = this.props;
    if (selectWeek <= 0) {
      selectWeek = weekProp;
    }
    if (selectedBanjiIndex < 0) {
      console.error("BanjiData not selected yet");
      return;
    }
    if (!Array.isArray(banjiBySubject) || banjiBySubject.length < 1) {
      console.error("banjiBySubject not fetched yet");
      return;
    }
    console.log("loadBanjiKebiao, year: "+schoolYear+" week: "+selectWeek);
    let banjiId = this.getBanjiId(selectedBanjiIndex);
    const banjiSchedId = buildBanjiSchedId(banjiId, schoolYear, selectWeek);
    console.log("loadKebiao: Get kebiaoInfo of "+banjiSchedId);
    const kebiaoInfo = kebiaoByBanjiSched[banjiSchedId];
    if (kebiaoInfo && JSON.stringify(kebiaoInfo) !== '{}') {
      console.log("loadBanjiKebiao: call buildKebiao table directly!");
      this.buildKebiao(this.props, this.state);
    }
    else {
      let banjiIds = [banjiId];
      this.props.fetchKeBiaoByBanji(banjiIds, schoolYear, selectWeek, selectWeek+1);
    }
    this.setState({
      refreshFlag: !this.state.refreshFlag
    });
  }

  selectedIdsChanged = (majorId) => {
    console.log(`selectedMajorIdChanged ${majorId}`);
    this.setState({
      selectedMajorId: majorId
    });
    this.loadBanji(majorId);
  }

  onTabChanged = (index) => {
    console.log(`onTabChanged ${this.props.banjiBySubject[index].name}`);
    this.curDataIndex = index;
    this.loadKebiao(this.state.selectWeek);
    this.setState({
      selectedBanjiIndex: index,
      //selectWeek: this.banjiSelectWeek
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    let banjiSelectWeek = index+1;
    this.setState({
      selectWeek : banjiSelectWeek
    });
    this.loadKebiao(banjiSelectWeek);
  }


  generateTabTables = (props, state) => {
    const { t } = props;
    const { selectWeek } = state;
    const { color, tableHeaders, tableDataList, semesterPages, onSemesterPageChanged } = this;
    console.log("render: selectWeek: "+selectWeek);
    const pageTables = [];
    for (let i=0; i < tableDataList.length; i++) {
      if (tableDataList[i]) {
        pageTables[i] = (<ResultTable
          height={450}
          titleHeight={50}
          colLineHeight={20}
          defaultColWidth={180}
          title={t("menuBar.banjikebiao_title")}
          color={color}
          headers={tableHeaders}
          data={tableDataList[i]}
          pageNames={semesterPages}
          pagePrevCaption={t("kebiao.prev_semester_week")}
          pageNextCaption={t("kebiao.next_semester_week")}
          onResultPageIndexChanged={onSemesterPageChanged}
          initPageIndex={selectWeek-1}
          pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]} />);
      } else {
        pageTables[i] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
      }
    }
    return pageTables;
  }

  render() {
    const { t, subjects, banjiBySubject } = this.props;
    const { edu, grd } = this.props.location.state;
    const { initMajorId } = this.state;
    const { color, defaultClassIdx, tabTitles, pageTables,
      selectedIdsChanged, onTabChanged } = this;
    //console.log("render: pageTables: "+JSON.stringify(pageTables));
    let no_class = (!Array.isArray(banjiBySubject) || banjiBySubject.length < 1);
    let no_table = (!Array.isArray(pageTables) || pageTables.length < 1);
    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        <SubjectBoard
          t={t}
          my={4}
          color={color}
          title={t("subjectBoard.selector_stu_major")}
          subjects={subjects}
          initSelectId={initMajorId}
          selectedIdsChanged={selectedIdsChanged}
          enableAutoTitle
          enableSelect />
        {
          (tabTitles && tabTitles.length > 0) &&
          <ResultTabList
            ref={this.tabsListRef}
            my={4}
            width="100%"
            maxWidth={1444}
            tabHeight={50}
            color={color}
            titles={tabTitles}
            onTabChange={onTabChanged}
            pages={pageTables}
            defaultIndex={defaultClassIdx-1} />
        }
        {
          no_class && 
          <blockquote>{edu.name+grd.name+t("banjiKebiaoScreen.warning_major_without_class")}</blockquote>
        }
        {
          no_table && !no_class &&
          <blockquote>{edu.name+grd.name+t("banjiKebiaoScreen.warning_class_without_schedule")}</blockquote>
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
    banjiBySubject: getBanjiBySelectedSubject(state),
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
