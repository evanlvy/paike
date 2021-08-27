/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect, useSelector } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Flex,
  Button,
  Text,
} from '@chakra-ui/core';

import {
  SubjectBoard,
  ResultTable,
} from '../components';

import { getSchoolYear, getSchoolWeek } from '../redux/modules/grade';
import { actions as rawplanActions, getRawplanGroups, getSelectedGroup, getPlansByGroup, countRowChanged, getChangedRowIds} from '../redux/modules/rawplan';
import { EditableTable } from '../components/result-table/editable-table';
import { SEMESTER_WEEK_COUNT } from './common/info';

const JYS_KEBIAO_COLOR = "red";
const CANCEL_COLOR = "gray";
const SEMESTER_FIRST_HALF_MAX_WEEK = 9;
const SEMESTER_HALF_BIAS_WEEK = 6;
class ProgressdocScreen extends Component {
  constructor(props) {
    super(props);
    const { t, schoolWeek } = props;
    this.state = {
      selectedJysIdList: [],
      selectWeek: schoolWeek ? schoolWeek : 1,
    };
    this.defaultselectedJysIdList = [0];
    this.semesterPages = [];

    this.tabTitles = [];
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
    this.jysTitle = t("kebiao.jys");
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, schoolWeek, jysMap, kebiaoByJysSched/*, location*/ } = this.props;
    const { selectedJysIdList, selectWeek } = this.state;
    // console.log("shouldComponentUpdate, origin grd: "+JSON.stringify(location.state.grd)+", origin edu: "+JSON.stringify(location.state.edu));
    // console.log("shouldComponentUpdate, grd: "+JSON.stringify(nextProps.location.state.grd)+", edu: "+JSON.stringify(nextProps.location.state.edu));
    /*if (nextProps.location.state.grd !== location.state.grd || nextProps.location.state.edu !== location.state.edu) {
      //this.resetData();
      console.log("shouldComponentUpdate, location state diff");
      return true;
    } else */
    if (nextProps.schoolYear !== schoolYear || nextProps.schoolWeek !== schoolWeek
    || nextProps.jysMap !== jysMap || nextProps.kebiaoByJysSched !== kebiaoByJysSched) {
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
    if (!this.jysData || this.jysData.length === 0) { // only get jys list when it's empty
      this.loadjysData();
    }
    if (this.state.selectedJysIdList && !this.hasFetchKebiao) {
      const { schoolWeek } = this.props;
      let shixunSelectWeek = schoolWeek;
      console.log("loadKebiao: schoolWeek: "+shixunSelectWeek);
      this.loadKebiao(shixunSelectWeek);
    }
  }

  buildData = () => {
    this.buildSemester();
    this.buildjysData();
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

  buildjysData = () => {
    if (this.jysData == null || this.jysData.length === 0) {
      const { jysMap } = this.props;
      this.jysData = !jysMap ? [] : [...jysMap.values()]; // Must copy from prop otherwize references of this.jysData below will be empty object {}
      // console.log("JYS Data: "+JSON.stringify(this.jysData));
      if (this.jysData.length > 0) {
        // Change default index list to jysId list
        let idList = [];
        this.defaultselectedJysIdList.forEach(index => {
          if (index < this.jysData.length) {
            idList.push(this.jysData[index].id);
          }
        });
        // setState will trigger react renderer. So change the value directly.
        this.state.selectedJysIdList = idList;
        //this.setState({ selectedJysIdList: idList });
      }
      //this.setJysSelectedIndexList(this.state.selectedJysIdList);
    }
    this.updateTitles();
  }

  updateTitles = () => {
    const { t } = this.props;
    const { selectedJysIdList } = this.state;
    this.tabTitles = [];
    if (!selectedJysIdList || selectedJysIdList.length === 0) {
      this.tabTitles = [];
      //this.jysTitle = t("subjectBoard.title_no_jys_template");
      return;
    }
    let jys_info = "";
    selectedJysIdList.every((item, index) => {
      if (item.title != null) {
        jys_info += item.title + " ";
      }
      if (jys_info.length > 30){
        jys_info += "...";
        return false;
      }
      return true;
    });
    //this.jysTitle = t("subjectBoard.title_jys_template", {jys_info: jys_info.trim()});
    this.tabTitles = [jys_info];
    console.log(`updateTabTitles: ${JSON.stringify(this.tabTitles)}`);
    this.tableTitle = t("shixunKebiaoScreen.table_title_template", {jys_count: selectedJysIdList.length});
    console.log(`updateTableTitle: ${this.tableTitle}`);
    
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

  buildKebiaoBySched = (jysList, kebiaoByJysSched) => {
    const { schoolYear, jysMap } = this.props;
    const { weekdayNames, hourNames } = this;
    //console.log("buildKebiaoBySched: jysMap: "+JSON.stringify(jysMap));
    let result = {}
    jysList.forEach(jys => {
      const jysSchedId = buildJysSchedId(!jys.id?jys:jys.id, schoolYear, this.state.selectWeek);
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
              kebiaoHour["jys_name"] = (!jys.name) ? jysMap.get(""+jys).name : jys.name;//{...jys};
              result[key].push(kebiaoHour);
            });
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

  loadKebiao = (selectWeek, jysIdList=[]) => {
    let selectedIds = jysIdList;
    if (!jysIdList || jysIdList.length < 1) {
      const { selectedJysIdList } = this.state;
      if (!selectedJysIdList || selectedJysIdList.length < 1) {
        console.error("JYS data not selected yet");
        return;
      }
      selectedIds = selectedJysIdList;
    }
    const { schoolYear } = this.props;
    console.log("loadShiXunKebiao, year: "+schoolYear+" week: "+selectWeek+" selected:"+selectedIds);
    this.props.fetchShiXun(selectedIds, schoolYear, selectWeek);
    this.hasFetchKebiao = true;
  }

  onJysIdsChanged = (jysIdList) => {
    console.log(`onJysIdsChanged ${jysIdList}`);
    this.setState({
      selectedJysIdList: jysIdList
    });
    this.loadKebiao(this.state.selectWeek, jysIdList);
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    let shixunSelectWeek = index+1;
    this.setState({
      selectWeek : shixunSelectWeek
    });
    this.loadKebiao(shixunSelectWeek);
  }

  render() {
    const { t } = this.props;
    const { selectWeek } = this.state;
    this.buildData();
    const { jysData, jysTitle, 
      tabTitles, tableTitle, tableHeaders, tableData, semesterPages,
      onJysIdsChanged, onTabChanged, onSemesterPageChanged } = this;
    const pageTables = [];
    if (tableData) {
      pageTables[0] = (<ResultTable
        height={450/*window.innerHeight*/}
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
          title={jysTitle}
          subjects={jysData}
          initSelectedIndexList={this.defaultselectedJysIdList}
          //onSubjectClicked={onJysClicked}
          //selectionChanged={onJysChanged}
          selectedIdsChanged={onJysIdsChanged}
          t={t}
          enableMultiSelect={true}
          enableSelectAll={true}
          enableAutoTitle={true} />
        {
          tabTitles && tabTitles.length > 0 &&
          <ResultTabList
            ref={this.tabsListRef}
            my={4}
            width="100%"
            maxWidth={1444}
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
    jysMap: getAllJiaoyanshiMap(state),
    kebiaoByJysSched: getShiXunByJiaoyanshiSched(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(jysActions, dispatch),
    ...bindActionCreators(kebiaoActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(ProgressdocScreen));
