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
  SolveConflictModal,
} from '../components';

import { actions as jysActions, getJiaoyanshiOfAllCenters } from '../redux/modules/jiaoyanshi';
import { actions as labActions, getLabsByAllLabItem, getShiXunByLabSched } from '../redux/modules/lab';
import { actions as kebiaoActions, buildJysSchedId, getShiXunByJiaoyanshiSched, getKeBiaoByAllBanjiSched } from '../redux/modules/kebiao';
import { getShiXun } from '../redux/modules/kebiao';

import { SEMESTER_WEEK_COUNT } from './common/info';

const PAIKESCREEN_COLOR = "pink";
class PaikeScreen extends Component {
  constructor(props) {
    super(props);
    const { t } = props;
    this.state = {
      selectedCenterIndex: 0,
      selectWeek: 1,
      selectConflict: null,
    };

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
    this.conflictModalRef = React.createRef();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { centerList, labsByLabItem, shixunByLabSched, kebiaoByJysSched, kebiaoByBanjiSched } = this.props;
    const { selectedCenterIndex, selectWeek, selectConflict } = this.state;

    if (nextProps.centerList !== centerList || nextProps.labsByLabItem !== labsByLabItem || nextProps.shixunByLabSched !== shixunByLabSched
    || nextProps.kebiaoByJysSched !== kebiaoByJysSched || nextProps.kebiaoByBanjiSched !== kebiaoByBanjiSched) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextState.selectedCenterIndex !== selectedCenterIndex || nextState.selectWeek !== selectWeek || nextState.selectConflict !== selectConflict) {
      console.log("shouldComponentUpdate, state diff");
      return true;
    }
    return false;
  }

  componentDidUpdate() {
    this.loadData();
  }

  loadData = () => {
    if (!this.centerData || this.centerData.length === 0) { // only get jys list when it's empty
      this.loadCenterList();
    }
    if (this.centerData && !this.hasFetchKebiao) {
      const { selectWeek } = this.state;
      this.loadKebiao(selectWeek);
    }
  }

  buildData = () => {
    this.buildSemester();
    this.buildCenterList();
    this.buildKebiao();
    this.buildLabList();
  }

  buildSemester = () => {
    const { t } = this.props;
    const { semesterPages } = this;
    if (semesterPages.length === 0) {
      for (let i=0; i < SEMESTER_WEEK_COUNT; i++) {
        semesterPages.push({ name: t("kebiao.semester_week_template", {week_index: i+1}) });
      }
    }
  }
  // Center
  loadCenterList = () => {
    console.log("loadCenterList");
    this.props.fetchJiaoyanshi();
  }

  buildCenterList = () => {
    if (this.centerData == null || this.centerData.length === 0) {
      const { centerList } = this.props;
      this.centerData = !centerList ? [] : centerList;
      console.log("Center Data: "+JSON.stringify(this.centerData));
      this.setSelectedCenterIndex(this.state.selectedCenterIndex);
    }
    this.updateTitles();
  }

  setSelectedCenterIndex = (index) => {
    this.selectedJysList = [];
    if (this.centerData && index >= 0 && index < this.centerData.length) {
      this.selectedCenter = this.centerData[index];
      const jysList = this.selectedCenter.jiaoyanshi;
      jysList.forEach(jys => {
        this.selectedJysList.push(jys);
      });
      console.log("Selected JYS List: "+JSON.stringify(this.selectedJysList))
    }
  }

  updateTitles = () => {
    const { t } = this.props;
    this.tabTitles = [];
    if (!this.selectedCenter) {
      this.tabTitles = [];
      this.centerTitle = t("subjectBoard.title_no_center_template");
      return;
    }
    this.centerTitle = this.selectedCenter.name;
    this.tabTitles = [this.selectedCenter.name];
    console.log(`updateTabTitles: ${JSON.stringify(this.tabTitles)}`);
    this.tableTitle = t("paikeScreen.table_title_template", {center_info: this.selectedCenter.name});
    console.log(`updateTableTitle: ${this.tableTitle}`);
  }
  // Labs
  loadLabSched = (selectWeek) => {
    const { selectConflict } = this.state;
    if (!selectConflict) {
      console.error("Conflict not selected yet");
      return;
    }
    this.props.fetchLabsByLabItem(selectConflict.data.labitem_id, 3, selectWeek);
    this.hasFetchLab = true;
  }

  buildLabList = () => {
    const { labsByLabItem } = this.props;
    const { selectConflict } = this.state;
    console.log("buildLabList");
    if (!selectConflict) {
      return;
    }
    console.log("Get Labs of LabItem "+selectConflict.data.labitem_id);
    const labInfoList = labsByLabItem[selectConflict.data.labitem_id];
    if (!labInfoList) {
      return;
    }
    this.labList = labInfoList;
    this.labList.sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
  }

  // Kebiao
  loadKebiao = (selectWeek) => {
    if (!this.selectedJysList) {
      console.error("JYS data not selected yet");
      return;
    }
    console.log("loadKebiao");
    const jysIds = [];
    this.selectedJysList.forEach(jys => {
      jysIds.push(jys.id);
    });
    this.props.fetchShiXun(jysIds, 3, selectWeek);
    this.hasFetchKebiao = true;
  }

  buildKebiao = () => {
    const { kebiaoByJysSched } = this.props;
    if (!this.selectedJysList || this.selectedJysList.length === 0) {
      return;
    }

    let kebiaoBySched = this.buildKebiaoBySched(this.selectedJysList, kebiaoByJysSched);
    if (kebiaoBySched) {
      this.tableData = this.buildKebiaoTableSched(kebiaoBySched);
    } else {
      this.tableData = [];
    }
    //console.log("kebiaoTable: "+JSON.stringify(this.tableData));
  }

  buildKebiaoBySched = (jysList, kebiaoByJysSched) => {
    const { selectWeek } = this.state;
    const { weekdayNames, hourNames } = this;
    let result = {}
    jysList.forEach(jys => {
      const jysSchedId = buildJysSchedId(jys.id, 3, selectWeek);
      console.log("Get kebiaoInfo of "+jysSchedId);
      const kebiaoInWeek = kebiaoByJysSched[jysSchedId];
      console.log("kebiao: "+JSON.stringify(kebiaoInWeek));
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
              kebiaoHour["jys"] = {...jys};
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
    const { t } = this.props;
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
            resultItem["date"] = weekday_name;
            resultItem["time"] = hour_name+t("kebiao.sched_unit");
            resultItem["jys"] = kebiaoHour.jys.name;
            resultItem["banji"] = kebiaoHour.class_name;
            resultItem["shixun_name"] = kebiaoHour.labitem_name;
            let teacherInfo = "";
            kebiaoHour.theory_teachers.forEach(teacher => {
              teacherInfo += teacher.name+" ";
            });
            resultItem["teacher"] = teacherInfo.trim();
            resultItem["shixun_teacher"] = kebiaoHour.lab_teacher;
            resultItem["lab"] = kebiaoHour.lab_location;
            resultItem["note"] = "";
            resultItem["data"] = {...kebiaoHour, week_day_index: i, hour_index: j};
            resultItem["is_conflict"] = (kebiaoHour.lab_location === "B108");
            resultList.push(resultItem);
          });
        }
      }
    }
    return resultList;
  }

  // Event Callbacks
  onCenterClicked = (index) => {
    console.log(`onCenterClicked ${this.centerData[index].title}`);
    this.setState({
      selectedCenterIndex: index
    });
    this.setSelectedCenterIndex(index);
    this.loadKebiao(this.state.selectWeek);
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    const weekIndex = index+1;
    this.setState({
      selectWeek : weekIndex
    });
    this.loadKebiao(weekIndex);
  }

  onKebiaoRowClicked = (index) => {
    console.log("onKebiaoRowClicked, index: "+index);
    const rowData = {...this.tableData[index]};
    if (rowData.is_conflict) {
      const { selectWeek } = this.state;
      const conflictList = [];
      this.tableData.forEach(row => {
        if (row.is_conflict) {
          conflictList.push({...row});
        }
      });
      this.setState({
        selectConflict : rowData
      });
      this.loadLabSched(selectWeek);
      this.conflictModalRef.current.showConflict(selectWeek, rowData, conflictList);
    }
  }

  onSolveConflictResult = (confirm, result) => {
    if (confirm) {
      console.log("onSolveConflictResult, result: "+JSON.stringify(result));
    }
    return true;
  }

  render() {
    const { t, shixunByIds, shixunByLabSched, kebiaoByBanjiSched } = this.props;
    const { selectedCenterIndex } = this.state;
    this.buildData();
    const { centerData, centerTitle, selectedCenter, semesterPages, labList,
      tabTitles, tableTitle, tableHeaders, tableData,
      onCenterClicked, onTabChanged, onSemesterPageChanged,
      onKebiaoRowClicked, onSolveConflictResult } = this;
    const pageTables = [];
    if (tableData) {
      pageTables[0] = (<ResultTable
        height={450}
        titleHeight={50}
        colLineHeight={20}
        defaultColWidth={180}
        title={tableTitle}
        color={PAIKESCREEN_COLOR}
        headers={tableHeaders}
        data={tableData}
        pageNames={semesterPages}
        pagePrevCaption={t("kebiao.prev_semester_week")}
        pageNextCaption={t("kebiao.next_semester_week")}
        onResultPageIndexChanged={onSemesterPageChanged}
        pageInputCaption={[t("kebiao.input_semester_week_prefix"), t("kebiao.input_semester_week_suffix")]}
        onRowClicked={onKebiaoRowClicked} />);
    } else {
      pageTables[0] = (<Flex alignItems='center' justifyContent='center'><Text>{t("common.no_data")}</Text></Flex>);
    }
    return (
      <Flex width="100%" minHeight={750} direction="column" align="center">
        <SubjectBoard
          my={4}
          color={PAIKESCREEN_COLOR}
          title={centerTitle}
          subjects={centerData}
          initSelectIndex={selectedCenterIndex}
          onSubjectClicked={onCenterClicked}
          enableSelect />
        {
          tabTitles && tabTitles.length > 0 &&
          <ResultTabList
            ref={this.tabsListRef}
            my={4}
            width="100%"
            maxWidth={1444}
            tabHeight={50}
            color={PAIKESCREEN_COLOR}
            titles={tabTitles}
            onTabChange={onTabChanged}
            pages={pageTables} />
        }
        <SolveConflictModal
          ref={this.conflictModalRef}
          isCentered
          curCenter={selectedCenter}
          labs={labList}
          labSched={shixunByLabSched}
          banjiSched={kebiaoByBanjiSched}
          shixunByIds={shixunByIds}
          onResult={onSolveConflictResult} />
      </Flex>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    centerList: getJiaoyanshiOfAllCenters(state),
    labsByLabItem: getLabsByAllLabItem(state),
    shixunByIds: getShiXun(state),
    shixunByLabSched: getShiXunByLabSched(state),
    kebiaoByJysSched: getShiXunByJiaoyanshiSched(state),
    kebiaoByBanjiSched: getKeBiaoByAllBanjiSched(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(jysActions, dispatch),
    ...bindActionCreators(labActions, dispatch),
    ...bindActionCreators(kebiaoActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(PaikeScreen));
