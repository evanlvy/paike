/* @flow */

import React, { Component } from 'react';
import { bindActionCreators } from "redux";
import { connect, useSelector } from "react-redux";
import { withTranslation } from 'react-i18next';
import {
  Flex,
  Text,
  Box,
  Select,
  Icon,
} from '@chakra-ui/core';
import {
  MdTune,
} from 'react-icons/md';

import {
  SubjectBoard,
  ResultTable,
} from '../components';

import { actions as gradeActions, getSchoolYear, getStageList } from '../redux/modules/grade';
import { actions as jysActions, getAllJiaoyanshiMap } from '../redux/modules/jiaoyanshi';
import { actions as progressdocActions, getDocList, getSearchedDocList } from '../redux/modules/progressdoc';
import PromptDrawer from '../components/overlays/prompt-drawer';
import ProgressdocDialog from '../components/overlays/progressdoc-dialog';

const DEFAULT_COLOR = "purple";
const CANCEL_COLOR = "gray";
const SEMESTER_FIRST_HALF_MAX_WEEK = 9;
const SEMESTER_HALF_BIAS_WEEK = 6;
class CurriculumsScreen extends Component {
  constructor(props) {
    super(props);
    const { t, color, schoolYear } = props;
    this.state = {
      selectStage: schoolYear,
      selectedJysIdList: [],
      selectedDocId: 0,
    };
    this.color = color ? color : DEFAULT_COLOR;

    this.defaultselectedJysIdList = [0];
    this.semesterPages = [];

    this.docListHeaders = [
      {name: t("progressdocScreen.list_header_name"), field: "course_name"},
      {name: t("progressdocScreen.list_header_short"), field: "short_name"},
      {name: t("progressdocScreen.list_header_description"), field: "description"},
      {name: t("progressdocScreen.list_header_hours_total"), field: "total_hours", width: 80},
      {name: t("progressdocScreen.list_header_hours_theory"), field: "theory_hours", width: 80},
      {name: t("progressdocScreen.list_header_hours_lab"), field: "lab_hours", width: 80},
      {name: t("progressdocScreen.list_header_hours_flex"), field: "flex_hours", width: 80},
      {name: t("progressdocScreen.list_header_textbook"), field: "textbook"},
      {name: t("progressdocScreen.list_header_exam"), field: "exam_type", width: 120},
      {name: t("progressdocScreen.list_header_comments"), field: "comments"},
      {name: t("progressdocScreen.list_header_classes"), field: "classes", renderer: "class_name_renderer"},
      {name: t("progressdocScreen.list_header_created"), field: "created_at"},
      {name: t("progressdocScreen.list_header_updated"), field: "updated_at"},
      {name: t("progressdocScreen.list_header_id"), field: "id", width: 80},
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

    this.buildData();
  }

  componentDidMount() {
    this.loadData();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { schoolYear, jysMap, stageList, docList, docDetails } = this.props;
    const { selectedJysIdList, selectedDocId } = this.state;
    if (nextProps.schoolYear !== schoolYear || nextProps.jysMap !== jysMap || nextProps.docList !== docList) {
      console.log("shouldComponentUpdate, props diff");
      return true;
    } else if (nextProps.stageList !== stageList ) {
      console.log("shouldComponentUpdate, stageList diff");
      this.buildSemester();
      return true;
    } else if (nextState.selectedJysIdList !== selectedJysIdList) {
      console.log("shouldComponentUpdate, selected_jys diff");
      return true;
    } else if (nextState.selectedDocId != selectedDocId) {
      console.log("shouldComponentUpdate, selectedDocId diff");
      return true;
    }
    return false;
  }

  loadData = () => {
    if (!this.semesterPages || this.semesterPages.length === 0) {
      this.props.fetchStageList();
    }
    if (!this.jysData || this.jysData.length === 0) { // only get jys list when it's empty
      this.loadjysData();
    }
    if (this.state.selectedJysIdList && !this.hasFetchKebiao) {
      this.loadDocList(this.state.selectedJysIdList);
    }
  }

  buildData = () => {
    this.buildSemester();
    this.buildjysData();
  }

  
  buildSemester = () => {
    if (Object.keys(this.semesterPages).length <= 0) {
      this.semesterPages = {...this.props.stageList};
      console.log("buildSemester: stages: "+JSON.stringify(this.semesterPages));
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
      }
    }
    this.updateTitles();
  }

  updateTitles = () => {
    const { t, jysMap } = this.props;
    const { selectedJysIdList } = this.state;
    let jysName = t("subjectBoard.title_no_jys_template");
    if (selectedJysIdList && selectedJysIdList.length > 0) {
      jysName =  jysMap.get(""+selectedJysIdList[0]).name;
    }
    this.tableTitle = t("progressdocScreen.doclist_table_title_template", {jys_name: jysName});    
  }
  
  loadDocList = (jysIdList, stage_id=0) => {
    if (!jysIdList || jysIdList.length < 1) {
      console.error("JYS not selected yet");
      return;
    }
    let stage = stage_id;
    if (stage < 1) {
      stage = this.state.selectStage;
    }
    console.log("loadDocList, year: "+stage+" jysId:"+jysIdList[0]);
    this.props.fetchDocList(jysIdList[0], stage);
    this.hasFetchKebiao = true;
  }

  onJysIdsChanged = (jysIdList) => {
    console.log(`onJysIdsChanged ${jysIdList}`);
    this.setState({
      selectedJysIdList: jysIdList
    });
    this.loadDocList(jysIdList);
  }

  onRowSelected = (rowId, docId) => {
    console.log(`onRowSelected: rowId=${rowId} docId=${docId}`);
    this.setState({
      selectedDocId: docId
    });
  }

  onSemesterPageChanged = (index) => {
    const { semesterPages } = this;
    console.log("onSemesterPageChanged: "+semesterPages[index].name);
    if (index < 0 || index >= semesterPages.length) {
      return;
    }
    let stageId = Object.keys(this.props.stageList)[index];
    this.loadDocList(this.state.selectedJysIdList, stageId);
  }

  onStageChanged = (event) => {
    let target_stage = event.target.value;
    this.setState({
      selectStage: target_stage
    });
    this.loadDocList(this.state.selectedJysIdList, target_stage);
  }

  render() {
    const { t, docList } = this.props;
    const { selectStage, selectedDocId } = this.state;
    const { color, jysData, jysTitle, tableTitle, docListHeaders, semesterPages, onStageChanged, onJysIdsChanged, onRowSelected, loadDocDetails} = this;
    
    return (
      <Flex width="100%" minHeight={750} direction="column" align="center" mb={5}>
        <SubjectBoard t={t} my={4} color={color}
          title={jysTitle}
          subjects={jysData}
          initSelectedIndexList={this.defaultselectedJysIdList}
          selectedIdsChanged={onJysIdsChanged}
          enableAutoTitle={true}
          enableSelect />
        <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" minW={833} mb={4}>
          <Flex direction="row" alignItems="center" px={5} py={2}>
            <Icon as={MdTune} color={color+".200"} size={12} />
            <Text mx={5} whiteSpace="break-spaces" flexWrap="true">{t("editRawplanScreen.hint_stageselector")}</Text>
            {
              (semesterPages && Object.keys(semesterPages).length > 0) &&
              <Select width="100%" variant="filled" value={selectStage} onChange={onStageChanged}>
              {
                Object.keys(semesterPages).map((stage_id) => (
                  <option key={stage_id} value={stage_id} >{semesterPages[stage_id]}</option>
                ))
              }
              </Select>
            }
            <PromptDrawer t={t} promptText={t("editRawplanScreen.prompt_text")}/>
          </Flex>
        </Box>
        {
          docList && 
          <ResultTable
            minHeight={docList.length>3?800:180}
            titleHeight={50}
            colLineHeight={20}
            defaultColWidth={180}
            title={tableTitle}
            color={color}
            headers={docListHeaders}
            data={docList}
            rowSelection="single"
            onRowSelected={onRowSelected}
            //pageNames={semesterPages}
            //pagePrevCaption={t("common.previous")}
            //pageNextCaption={t("common.next")}
            //onResultPageIndexChanged={onSemesterPageChanged}
            //initPageIndex={initSemesterPageIdx}
          />
        }
        <ProgressdocDialog docId={selectedDocId} title={t("progressdocScreen.doc_detail_title")} btnText={t("common.open")} t={t} color={color} isSaveable/>
      </Flex>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    schoolYear: getSchoolYear(state),
    stageList: getStageList(state),
    jysMap: getAllJiaoyanshiMap(state),
    docList: getDocList(state),
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    ...bindActionCreators(jysActions, dispatch),
    ...bindActionCreators(gradeActions, dispatch),
    ...bindActionCreators(progressdocActions, dispatch),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(CurriculumsScreen));
