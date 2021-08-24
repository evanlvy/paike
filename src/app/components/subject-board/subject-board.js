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
      selectAllChecked: false,
    }
  }

  buildInitSelectedIndexList = () => {
    const { initSelectedIndexList, initSelectIndex } = this.props;
    let selectedIndexList = [];
    console.log(`initSelectedIndexList bef: ${initSelectedIndexList}`);
    if (initSelectedIndexList !== undefined) {
      selectedIndexList = [...initSelectedIndexList];
    } else if (initSelectIndex !== undefined) {
      selectedIndexList = [initSelectIndex];
    }
    console.log(`initSelectedIndexList after: ${selectedIndexList}`);
    return selectedIndexList;
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
      if (enableSelectAll) {
        this.state.selectAllChecked = (newIndexList.length === this.items.length);
      }
    } else if (enableSelect) {
      newIndexList = [index];
    } else {
      return;
    }
    this.setState({
      selectedIndexList: newIndexList
    });
    let auto_title = this.buildAutoTitle(this.items, newIndexList);
    this.title_prefix = auto_title.prefix;
    this.title_details = auto_title.details;
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
      selectAllChecked: isSelectAll,
      selectedIndexList: newIndexList
    });
    this.selectorCallbackInvoker(newIndexList);
  }

  selectorCallbackInvoker = (newIndexList) => {
    const { selectionChanged: onSelectionChangedCallback, selectedIdsChanged: onSelectedIdsChangedCallback } = this.props;
    // Construct index array returned to parent component
    if (onSelectionChangedCallback != null) {
      onSelectionChangedCallback(newIndexList);
    }
    if (onSelectedIdsChangedCallback != null) {
      let idArray = [];
      newIndexList.forEach(idx => {
        idArray.push(this.items[idx].id);
      });
      console.log(`onSelectedIds: ${idArray}`);
      onSelectedIdsChangedCallback(idArray);
    }
  }

  buildAutoTitle = (subjects, indexList) => {
    const { t, enableSelectAll } = this.props;
    // Construct tab title
    console.log(`buildAutoTitle: ${indexList}`);
    let title_selected = "";
    let title_prefix = "";
    if (!subjects || !indexList || indexList.length <= 0) {
      title_prefix = t("subjectBoard.title_prefix_unselected");
      return {prefix: title_prefix, details: title_selected};
    }
    if (enableSelectAll && (this.state.selectAllChecked === true)){
      title_selected = t("common.select_all");
    }
    else {
      subjects.every((item, index) => {
        if (!item.title) return false;
        if (indexList.includes(index)) {
          title_selected += item.title + " ";
        }
        if (title_selected.length > 30){
          title_selected += "...";
          return false;
        }
        return true;
      });
    }
    return {prefix: title_prefix, details: title_selected};
  }

  render() {
    const { t, subjects, color, title, enableSelectAll, autoTitle, ...other_props } = this.props;
    if (!this.items || this.items.length <= 0) {
      this.items = subjects; //[...subjects];
      //console.log("Render: Groups Data items: "+JSON.stringify(this.items));
      let auto_title = this.buildAutoTitle(this.items, this.state.selectedIndexList);
      this.title_prefix = auto_title.prefix;
      this.title_details = auto_title.details;
    }
    const { title_prefix, title_details } = this;
    return (
      <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" {...other_props}>
        <Box display="flex" flexDirection="row" backgroundColor={color+".400"} px={5} py={2} color="white">
          <Text width="100%">{autoTitle?(title_prefix+title+" [ "+title_details)+" ]":title}</Text>
          {
            enableSelectAll && 
            <Checkbox 
              //defaultIsChecked={false} 
              whiteSpace="nowrap" 
              isChecked={this.state.selectAllChecked}
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
