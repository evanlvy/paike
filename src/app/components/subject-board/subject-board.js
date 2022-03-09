/* @flow */

import React, { Component } from 'react';
import {
  Box,
  Text,
  Checkbox
} from '@chakra-ui/core'

import { BallGrid } from '../common/ball-grid';

class SubjectBoard extends Component {
  constructor(props) {
    super (props);
    this.state = {
      selectedIndexList: SubjectBoard.getInitialSelectedIdsFromProps(props)
    }
    this.selectAllChecked = false;
    //this.autoTitle = {prefix: "", selected: ""};
    this.autoTitle = this.buildAutoTitle(props, this.state.selectedIndexList);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { subjects } = this.props;
    const { selectedIndexList } = this.state;
    console.log("LIFECYCLE: shouldComponentUpdate");
    let shouldUpdate = false;
    if (nextState.selectedIndexList !== selectedIndexList) {
      console.log("LIFECYCLE: shouldComponentUpdate, selectedIndexList diff");
      shouldUpdate = true;
    } else if (nextProps.subjects !== subjects) {
      console.log("LIFECYCLE: shouldComponentUpdate, subjects diff");
      let subjects_unchanged = true;
      if (!Array.isArray(nextProps.subjects) || !Array.isArray(subjects)) {
        subjects_unchanged = false;
      } else {
        subjects_unchanged = (JSON.stringify(nextProps.subjects) === JSON.stringify(subjects));
        console.log("LIFECYCLE: shouldComponentUpdate: subjects_unchanged="+subjects_unchanged);
      }
      shouldUpdate = !subjects_unchanged;
    }
    if (shouldUpdate) {
      this.autoTitle = this.buildAutoTitle(nextProps, nextState.selectedIndexList);
    }
    return shouldUpdate;
  }

  componentDidMount() {
    console.log("LIFECYCLE: componentDidMount");
    // Work for initial selection callback
    this.selectorCallbackInvoker(this.state.selectedIndexList);
  }

  componentDidUpdate(prevProps, prevState) {
    console.log("LIFECYCLE: componentDidUpdate");
    // Subjects items content changed!
    if (prevState.selectedIndexList !== this.state.selectedIndexList 
      && JSON.stringify(prevState.selectedIndexList) !== JSON.stringify(this.state.selectedIndexList)) {
      this.selectorCallbackInvoker(this.state.selectedIndexList);
    }
    let subjects_unchanged = true;
    if (prevProps.subjects !== this.props.subjects) {
      if (!Array.isArray(prevProps.subjects) || !Array.isArray(this.props.subjects)) {
        subjects_unchanged = false;
      } else {
        subjects_unchanged = (prevProps.subjects.toString() === this.props.subjects.toString());
        console.log("LIFECYCLE: componentDidUpdate: subjects_unchanged="+subjects_unchanged);
      }
    }
    if (!subjects_unchanged || prevProps.enableSelect !== this.props.enableSelect || 
      prevProps.initSelectAll !== this.props.initSelectAll ||
      prevProps.initSelectIds !== this.props.initSelectIds ||
      prevProps.initSelectId !== this.props.initSelectId ||
      prevProps.initSelectedIndexList !== this.props.initSelectedIndexList ||
      prevProps.initSelectIndex !== this.props.initSelectIndex) {
        let new_ids = SubjectBoard.getInitialSelectedIdsFromProps(this.props, this.selectAllChecked);
        console.log("LIFECYCLE: componentDidUpdate: initial SelectedIds:"+JSON.stringify(new_ids));
        this.setState({
          selectedIndexList: new_ids
        });
        // Tell parent the new ids when subject items changed
        this.selectorCallbackInvoker(new_ids);
    }
  }

  static getInitialSelectedIdsFromProps(props, selectAll=false) {
    // Build selection index array (not id array)
    if (props.enableSelect && Array.isArray(props.subjects) && props.subjects.length > 0 ) {
      let selections = [];
      if (props.initSelectAll || selectAll) {
        selections = [...Array(props.subjects.length).keys()];
      } else {
        if (Array.isArray(props.initSelectedIndexList)) {
          if (props.enableMultiSelect) selections = props.initSelectedIndexList;
          else selections.push(props.initSelectedIndexList[0]);
        } else if (typeof props.initSelectIndex === 'number') {
          selections.push(props.initSelectIndex);
        }
        if (Array.isArray(props.initSelectIds)) {
          let idxes = SubjectBoard.getIndexesFromIds(props.initSelectIds, props.subjects);
          if (idxes.length > 0) {
            if (props.enableMultiSelect) {
              selections = selections.concat(idxes);
            } else {
              selections.push(idxes[0]);
            }
          }
        } else if (typeof props.initSelectId === 'number') {
          let idx = SubjectBoard.getIndexesFromIds(props.initSelectId, props.subjects);
          if ( idx >= 0) {
            selections.push(idx);
          }
        }
      }
      if (selections.length < 1) {
        selections = [0];  // Select index 0 by fail-safe
      }
      console.log("getInitialSelectedIdsFromProps, ret: "+JSON.stringify(selections));
      return selections;
    }
    return [];
  }

  reset = () => {
    this.setState({
      selectedIndexList: [] //this.buildInitSelectedIndexList()
    })
  }

  onSubjectClicked = (index) => {
    const { onSubjectClicked: onSubjectClickedCallback, 
      enableMultiSelect, enableSelect, enableSelectAll, subjects } = this.props;
    console.log(`onSubjectClicked ${subjects[index].title}`);
    if (onSubjectClickedCallback != null) {
      onSubjectClickedCallback(index);
    }
    let newIndexList = [];
    if (enableMultiSelect) {
      const { selectedIndexList: oldIndexList } = this.state;
      // Remove clicked item
      oldIndexList.forEach(index_item => {
        if (index_item !== index) {
          newIndexList.push(index_item);
        }
      });
      // Add clicked item or not
      if (newIndexList.length === oldIndexList.length) { // nothing removed, it's a checked click
        newIndexList.push(index);
      }
      if (enableSelectAll) {
        this.selectAllChecked = (newIndexList.length === subjects.length);
      }
    } else if (enableSelect) {
      newIndexList = [index];
      if (enableSelectAll) {
        this.selectAllChecked = false;
      }
    } else {
      return;
    }
    //this.autoTitle = this.buildAutoTitle(newIndexList);
    this.setState({
      selectedIndexList: newIndexList
    });
    //this.selectorCallbackInvoker(newIndexList);
  }

  onSelectAll = (isSelectAll) => {
    let newIndexList = [];
    if (!isSelectAll) {
      // Uncheck ALL
      newIndexList = SubjectBoard.getInitialSelectedIdsFromProps(this.props);
    }
    else {
      // Check ALL
      newIndexList = [...Array(this.props.subjects.length).keys()];
    }
    console.log(`onSelectAll newlist: ${newIndexList}`);
    this.selectAllChecked = isSelectAll;
    //this.autoTitle = this.buildAutoTitle(newIndexList);
    this.setState({
      selectedIndexList: newIndexList
    });
    //this.selectorCallbackInvoker(newIndexList);
  }

  selectorCallbackInvoker = (indexList) => {
    //console.log("selectorCallbackInvoker:"+JSON.stringify(indexList));
    const { selectionChanged: onSelectionChangedCallback, selectedIdsChanged: onSelectedIdsChangedCallback, subjects } = this.props;
    // Construct index array returned to parent component
    indexList.sort(function(a, b) {
      return a - b;
    });
    // Get subject name string for title
    if (onSelectionChangedCallback != null) {
      onSelectionChangedCallback(indexList, this.autoTitle.selected);
    }
    if (onSelectedIdsChangedCallback != null && subjects) {
      onSelectedIdsChangedCallback(indexList.map(idx=>subjects[idx].id), this.autoTitle.selected);
    }
  }

  buildAutoTitle = (props, selectedIdx=null) => {
    const { t, enableSelectAll, enableAutoTitle, subjects } = props;
    let dest_selected = selectedIdx
    if (!Array.isArray(selectedIdx)) {
      dest_selected = this.state.selectedIndexList;
    }
    // Construct tab title
    console.log(`buildAutoTitle: ${dest_selected}`);
    // prefix: fix prefix. selected: selected subjects
    let title = {prefix: "", selected: ""};
    if (!enableAutoTitle) {
      return title;
    }
    if (!subjects || !dest_selected || dest_selected.length <= 0) {
      title.prefix = t("subjectBoard.title_prefix_unselected");
      return title;
    }
    if (enableSelectAll && this.selectAllChecked){
      title.selected = t("common.select_all");
    }
    else {
      subjects.every((item, index) => {
        if (dest_selected.includes(index)) {
          let item_title = item.title?item.title:item.name;
          if (!item_title) return false;
          title.selected += item_title + " ";
        }
        if (title.selected.length > 30){
          title.selected += "...";
          return false;
        }
        return true;
      });
    }
    title.selected = " [ "+title.selected+" ]";
    return title;
  }

  /*buildSelectedIndexById = () => {
    const { enableMultiSelect, enableSelect, initSelectIds, initSelectId, subjects } = this.props;
    if (enableSelect && subjects && subjects.length > 0) {
      let selectedIndexList = [];
      let ids = [];
      if (enableMultiSelect && initSelectIds && initSelectIds.length > 0) {
        ids = initSelectIds;
      }
      else if (initSelectId > 0) {
        ids = [initSelectId];
      }
      for (let i=0; i < subjects.length; i++) {
        if (ids.includes(subjects[i].id)) {
          selectedIndexList.push(i);
        }
      }
      this.setState({
        selectedIndexList: selectedIndexList
      })
      this.selectorCallbackInvoker(selectedIndexList);
    }
  }*/

  static getIndexesFromIds = (itemIds, items) => {
    if (!Array.isArray(items)) return [];
    let ids = itemIds;
    if (typeof itemIds === 'number') {
      ids = [itemIds+""];
    }
    let result_array = [];
    for (let i=0; i < items.length; i++) {
      if (ids.includes(items[i].id)) {
        result_array.push(i);
      }
    }
    if (result_array.length < 1) {
      return (typeof itemIds === 'number')?-1:[];
    }
    return (typeof itemIds === 'number')?result_array[0]:result_array;
  }

  render() {
    const { t, subjects, color, title, enableSelectAll, enableAutoTitle, onSubjectClicked, ...other_props } = this.props;
    let { autoTitle, selectAllChecked } = this;

    return (
      <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" {...other_props}>
        <Box display="flex" flexDirection="row" backgroundColor={color+".400"} px={5} py={2} color="white">
          <Text width="100%">{enableAutoTitle?(autoTitle.prefix+title+autoTitle.selected):title}</Text>
          {
            enableSelectAll && 
            <Checkbox 
              //defaultIsChecked={false} 
              whiteSpace="nowrap" 
              isChecked={selectAllChecked}
              onChange={(e) => this.onSelectAll(e.target.checked)}>{t("common.select_all")}</Checkbox>
          }
        </Box>
        <BallGrid
          colCount={6}
          balls={subjects}
          ballSize={100}
          ballColor={color+".600"}
          maxHeight={250}
          selectedBallIndexList={this.state.selectedIndexList}
          onBallClicked={this.onSubjectClicked} />
      </Box>
    );
  }
}

export { SubjectBoard };
