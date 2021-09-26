/* @flow */

import React, { PureComponent } from 'react';
import {
  Box,
  Text,
  Checkbox
} from '@chakra-ui/core'

import { BallGrid } from '../common/ball-grid';

class SubjectBoard extends PureComponent {
  constructor(props) {
    super (props);
    this.state = {
      selectedIndexList: this.buildInitSelectedIndexList(),
    }
    this.autoTitle = {prefix: "", selected: ""};
    this.selectAllChecked = false;
  }

  buildInitSelectedIndexList = () => {
    const { initSelectedIndexList, initSelectIndex } = this.props;
    let selectedIndexList = [];
    if (initSelectedIndexList !== undefined) {
      selectedIndexList = [...initSelectedIndexList];
    } else if (initSelectIndex !== undefined) {
      selectedIndexList = [initSelectIndex];
    }
    console.log(`buildSelectedIndexList: ${selectedIndexList}`);
    return selectedIndexList;
  }

  componentDidMount() {
    // Work for initial selection callback
    const {onSubjectClicked: onSubjectClickedCallback, initSelectIndex, initSelectedIndexList } = this.props;
    if (initSelectedIndexList && initSelectedIndexList.length > 0) {
      this.autoTitle = this.buildAutoTitle(this.items, initSelectedIndexList);
      this.selectorCallbackInvoker(initSelectedIndexList);
    }
    else if (initSelectIndex >= 0) {
      if (onSubjectClickedCallback != null) {
        onSubjectClickedCallback(initSelectIndex);
      }
      this.autoTitle = this.buildAutoTitle(this.items, [initSelectIndex]);
      this.selectorCallbackInvoker([initSelectIndex]);
    }
  }

  reset = () => {
    this.setState({
      selectedIndexList: this.buildInitSelectedIndexList()
    })
  }

  onSubjectClicked = (index) => {
    const { onSubjectClicked: onSubjectClickedCallback, 
      enableMultiSelect, enableSelect, enableSelectAll } = this.props;
    console.log(`onSubjectClicked ${this.items[index].title}`);
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
      if (enableSelectAll === true) {
        this.selectAllChecked = (newIndexList.length === this.items.length);
      }
    } else if (enableSelect) {
      newIndexList = [index];
    } else {
      return;
    }
    this.setState({
      selectedIndexList: newIndexList
    });
    this.autoTitle = this.buildAutoTitle(this.items, newIndexList);
    this.selectorCallbackInvoker(newIndexList);
  }

  onSelectAll = (isSelectAll) => {
    let newIndexList = [];
    if (!isSelectAll) {
      // Uncheck ALL
      newIndexList = [];
    }
    else {
      // Check ALL
      newIndexList = [...Array(this.items.length).keys()];
    }
    console.log(`onSelectAll newlist: ${newIndexList}`);
    this.setState({
      selectedIndexList: newIndexList
    });
    this.selectAllChecked = isSelectAll;
    this.autoTitle = this.buildAutoTitle(this.items, newIndexList);
    this.selectorCallbackInvoker(newIndexList);
  }

  selectorCallbackInvoker = (indexList) => {
    const { selectionChanged: onSelectionChangedCallback, selectedIdsChanged: onSelectedIdsChangedCallback } = this.props;
    // Construct index array returned to parent component
    indexList.sort(function(a, b) {
      return a - b;
    });
    if (onSelectionChangedCallback != null) {
      onSelectionChangedCallback(indexList);
    }
    if (onSelectedIdsChangedCallback != null && this.items) {
      let idArray = [];
      indexList.forEach(idx => {
        idArray.push(this.items[idx].id);
      });
      console.log(`onSelectedIds: ${idArray}`);
      onSelectedIdsChangedCallback(idArray);
    }
  }

  buildAutoTitle = (subjects, indexList) => {
    const { t, enableSelectAll, enableAutoTitle } = this.props;
    // Construct tab title
    console.log(`buildAutoTitle: ${indexList}`);
    // prefix: fix prefix. selected: selected subjects
    let title = {prefix: "", selected: ""};
    if (!enableAutoTitle || enableAutoTitle === false) {
      return title;
    }
    if (!subjects || !indexList || indexList.length <= 0) {
      title.prefix = t("subjectBoard.title_prefix_unselected");
      return title;
    }
    if (enableSelectAll === true && (this.selectAllChecked === true)){
      title.selected = t("common.select_all");
    }
    else {
      subjects.every((item, index) => {
        if (!item.title) return false;
        if (indexList.includes(index)) {
          title.selected += item.title + " ";
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

  buildSelectedIndexById = () => {
    const { enableMultiSelect, enableSelect, initSelectIds, initSelectId } = this.props;
    if (enableSelect && this.items && this.items.length > 0) {
      let selectedIndexList = [];
      let ids = [];
      if (enableMultiSelect && initSelectIds && initSelectIds.length > 0) {
        ids = initSelectIds;
      }
      else if (initSelectId > 0) {
        ids = [initSelectId];
      }
      for (let i=0; i < this.items.length; i++) {
        if (ids.includes(this.items[i].id)) {
          selectedIndexList.push(i);
        }
      }
      this.setState({
        selectedIndexList: selectedIndexList
      })
      this.selectorCallbackInvoker(selectedIndexList);
    }
  }

  render() {
    const { t, subjects, color, title, enableSelectAll, enableAutoTitle, onSubjectClicked, ...other_props } = this.props;
    let { autoTitle, selectAllChecked } = this;
    if (!this.items || this.items.length <= 0) {
      if (subjects.length > 0){
        this.items = subjects; //[...subjects];
        //console.log("Render: Groups Data items: "+JSON.stringify(this.items));
        autoTitle = this.buildAutoTitle(this.items, this.state.selectedIndexList);
        this.buildSelectedIndexById();
      }
    }
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
          balls={this.items}
          ballSize={100}
          maxHeight={250}
          selectedBallIndexList={this.state.selectedIndexList}
          onBallClicked={this.onSubjectClicked} />
      </Box>
    );
  }
}

export { SubjectBoard };
