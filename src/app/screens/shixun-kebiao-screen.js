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
import { actions as jysActions, getColoredJysList } from '../redux/modules/jiaoyanshi';
import { actions as kebiaoActions, buildJysSchedId, getShiXunByJiaoyanshiSched } from '../redux/modules/kebiao';

import { SEMESTER_WEEK_COUNT } from './common/info';

const SHIXUNKEBIAO_COLOR = "green";
class ShiXunKeBiaoScreen extends Component {
  constructor(props) {
    super(props);
    const { t, schoolWeek } = props;
    this.state = {
      selectedJysIdList: [],
      selectWeek: schoolWeek ? schoolWeek : 1,
    };
    this.defaultselectedJysIdxList = [0];
    this.semesterPages = [];

    this.tableHeaders = [
      {name: t("kebiao.shixun_sched_title"), field: "sched_name"},
      {name: t("kebiao.jys"), field: "jys"},
      {name: t("kebiao.banji"), field: "banji"},
      //{name: t("kebiao.student_count"), field: "student_count"},
      {name: t("kebiao.shixun_content"), field: "shixun_name"},
      {name: t("kebiao.teacher"), field: "teacher"},
      {name: t("kebiao.shixun_teacher"), field: "shixun_teacher"},
      {name: t("kebiao.lab"), field: "lab"},
      {name: t("kebiao.note"), field: "note"},
    ];

    this.weekdayNames = [
      t("kebiao.sched_monday"), t("kebiao.sched_tuesday"), t("kebiao.sched_wednesday"),
      t("kebiao.sched_thursday"), t("kebiao.sched_friday"), t("kebiao.sched_saturday"), t("kebiao.sched_sunday")
    ];
    this.hourNames = [
      t("kebiao.sched_12"), t("kebiao.sched_34"), t("kebiao.sched_67"),
      t("kebiao.sched_89"), t("kebiao.sched_1011"), t("kebiao.sched_1213")
    ];
    this.tableData = null;
    this.tabsListRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, schoolWeek, jysList, kebiaoByJysSched/*, location*/ } = this.props;
    const { selectedJysIdList, selectWeek } = this.state;
    if (nextProps.schoolYear !== schoolYear) {
      this.loadKebiao(nextProps);
      return false;
    } else if (nextProps.schoolWeek !== schoolWeek
    || nextProps.jysList !== jysList || nextProps.kebiaoByJysSched !== kebiaoByJysSched) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedJysIdList !== selectedJysIdList || nextState.selectWeek !== selectWeek ) {
      console.log("shouldComponentUpdate, state diff");
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData = () => {
    const { jysList } = this.props;
    if (!jysList || jysList.length === 0) { // only get jys list when it's empty
      this.loadjysData();
    }
    if (this.state.selectedJysIdList && !this.hasFetchKebiao) {
      const { schoolWeek } = this.props;
      console.log("loadKebiao: schoolWeek: "+schoolWeek);
      this.loadKebiao(this.props, schoolWeek);
    }
  }

  buildData = () => {
    this.buildSemester();
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

  loadjysData = () => {
    console.log("loadjysData");
    this.props.fetchJiaoyanshi();
  }

  buildKebiao = () => {
    const { kebiaoByJysSched, schoolYear, schoolWeek } = this.props;
    const { selectedJysIdList } = this.state;
    if (!selectedJysIdList || selectedJysIdList.length === 0 || !schoolYear || !schoolWeek) {
      return;
    }

    let kebiaoBySched = this.buildKebiaoBySched(selectedJysIdList, kebiaoByJysSched);
    if (kebiaoBySched) {
      this.tableData = this.buildKebiaoTableSched(kebiaoBySched);
    } else {
      this.tableData = [];
    }
    //console.log("kebiaoTable: "+JSON.stringify(this.tableData));
  }

  buildKebiaoBySched = (selectedJys, kebiaoByJysSched) => {
    const { schoolYear, jysList } = this.props;
    const { weekdayNames, hourNames } = this;
    //console.log("buildKebiaoBySched: jysMap: "+JSON.stringify(jysMap));
    let result = {}
    jysList.forEach(jys => {
      if (selectedJys.includes(jys.id)){
        const jysSchedId = buildJysSchedId(jys.id, schoolYear, this.state.selectWeek);
        console.log("Get kebiaoInfo of "+jysSchedId);
        const kebiaoInWeek = kebiaoByJysSched[jysSchedId];
        if (kebiaoInWeek) {
          for (let i=0; i < weekdayNames.length; i++) {
            const kebiaoInDay = kebiaoInWeek[i];
            if (!kebiaoInDay) {
              continue;
            }
            for (let j=0; j < hourNames.length; j++) {
              const kebiaoHourList = kebiaoInDay[j];
              if (!kebiaoHourList || kebiaoHourList.length === 0) {
                continue;
              }
              const key = `${i}_${j}`;
              if (!result[key]) {
                result[key] = [];
              }
              kebiaoHourList.forEach(kebiaoHour => {
                kebiaoHour["jys_name"] = (jys.name) ? jys.name:jys.title;//{...jys};
                result[key].push(kebiaoHour);
              });
            }
          }
        }
      }
    });
    //console.log("buildKebiaoBySched: "+JSON.stringify(result));
    return result;
  }

  buildKebiaoTableSched = (kebiaoBySched) => {
    /*const fields_names = [
      "sched_name", "jys", "banji", "student_count", "shixun_name", "teacher", "shixun_teacher", "lab", "note"
    ];*/
    const { weekdayNames, hourNames } = this;
    let resultList = [];
    for (let i=0; i < weekdayNames.length; i++) {
      let weekday_name = weekdayNames[i];
      for (let j=0; j < hourNames.length; j++) {
        let sched_name = null;
        let hour_name = hourNames[j];
        const key = `${i}_${j}`;
        const kebiaoHourList = kebiaoBySched[key];
        if (kebiaoHourList && kebiaoHourList.length > 0) {
          kebiaoHourList.forEach(kebiaoHour => {
            let resultItem = {};
            if (!sched_name) {
              sched_name = weekday_name+hour_name;
              resultItem["sched_name"] = sched_name;
            } else {
              resultItem["sched_name"] = "";
            }
            resultItem["jys"] = kebiaoHour.jys_name;
            resultItem["banji"] = kebiaoHour.class_name;
            resultItem["shixun_name"] = kebiaoHour.labitem_name;
            let teacherInfo = "";
            kebiaoHour.theory_teachers.forEach(teacher => {
              teacherInfo += teacher.name+" ";
            });
            resultItem["teacher"] = teacherInfo.trim();
            resultItem["shixun_teacher"] = kebiaoHour.lab_teacher;
            resultItem["lab"] = kebiaoHour.lab_location;
            resultItem["note"] = kebiaoHour.comments;
            resultItem["data"] = kebiaoHour;
            resultList.push(resultItem);
          });
        }
      }
    }
    return resultList;
  }

  loadKebiao = (props, selectWeek=-1, jysIdList=[]) => {
    let selectedIds = jysIdList;
    if (!jysIdList || jysIdList.length < 1) {
      const { selectedJysIdList } = this.state;
      if (!selectedJysIdList || selectedJysIdList.length < 1) {
        console.error("JYS data not selected yet");
        return;
      }
      selectedIds = selectedJysIdList;
    }
    const { schoolYear } = props;
    console.log("loadShiXunKebiao, year: "+schoolYear+" week: "+selectWeek+" selected:"+selectedIds);
    props.fetchShiXun(selectedIds, schoolYear, selectWeek>0?selectWeek:this.state.selectWeek);
    this.hasFetchKebiao = true;
  }

  onJysIdsChanged = (jysIdList, namesSelected="") => {
    console.log(`onJysIdsChanged ${jysIdList}`);
    this.titleSelected = namesSelected;
    this.setState({
      selectedJysIdList: jysIdList
    });
    this.loadKebiao(this.props, this.state.selectWeek, jysIdList);
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    let shixunSelectWeek = index+1;
    this.setState({
      selectWeek : shixunSelectWeek
    });
    this.loadKebiao(this.props, shixunSelectWeek);
  }

  render() {
    const { t, jysList } = this.props;
    const { selectWeek, selectedJysIdList } = this.state;
    const { titleSelected, tableHeaders, tableData, semesterPages,
      onJysIdsChanged, onTabChanged, onSemesterPageChanged } = this;

    this.buildData();
    const pageTables = [];
    const tabTitles = [t("shixunKebiaoScreen.tab_title_prefix") + titleSelected]
    const tableTitle = t("shixunKebiaoScreen.table_title_template", {jys_count: selectedJysIdList.length});
    if (tableData) {
      pageTables[0] = (<ResultTable
        maxHeight={950}
        //height={450/*window.innerHeight*/}
        titleHeight={50}
        colLineHeight={20}
        defaultColWidth={180}
        title={tableTitle}
        color={SHIXUNKEBIAO_COLOR}
        headers={tableHeaders}
        data={tableData}
        pageNames={semesterPages}
        pagePrevCaption={t("kebiao.prev_semester_week")}
        pageNextCaption={t("kebiao.next_semester_week")}
        onResultPageIndexChanged={onSemesterPageChanged}
        initPageIndex={selectWeek-1}
        pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]} />);
    } else {
      pageTables[0] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
    }
    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        <SubjectBoard
          my={4}
          color={SHIXUNKEBIAO_COLOR}
          title={t("subjectBoard.selector_jys")}
          subjects={jysList}
          initSelectedIndexList={this.defaultselectedJysIdxList}
          //onSubjectClicked={onJysClicked}
          //selectionChanged={onJysChanged}
          selectedIdsChanged={onJysIdsChanged}
          t={t}
          enableSelect
          enableMultiSelect
          enableSelectAll
          enableAutoTitle />
        {
          tabTitles && tabTitles.length > 0 &&
          <ResultTabList
            ref={this.tabsListRef}
            my={4}
            width="100%"
            tabHeight={50}
            color={SHIXUNKEBIAO_COLOR}
            titles={tabTitles}
            onTabChange={onTabChanged}
            pages={pageTables} />
        }
      </Flex>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    schoolYear: getSchoolYear(state),
    schoolWeek: getSchoolWeek(state),
    jysList: getColoredJysList(state),
    kebiaoByJysSched: getShiXunByJiaoyanshiSched(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(jysActions, dispatch),
    ...bindActionCreators(kebiaoActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ShiXunKeBiaoScreen));
