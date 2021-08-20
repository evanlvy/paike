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
  }

  buildInitSelectedIndexList = () => {
    const { initSelectedIndexList, initSelectIndex, enableSelectAll, enableMultiSelect } = this.props;
    let selectedIndexList = [];
    console.log(`initSelectedIndexList bef: ${initSelectedIndexList}`);
    if (initSelectedIndexList !== undefined) {
      selectedIndexList = [...initSelectedIndexList];
    } else if (initSelectIndex !== undefined) {
      selectedIndexList = [initSelectIndex];
    }
    if (enableSelectAll && enableMultiSelect) {
      selectedIndexList = selectedIndexList.map(value=>{
        return value + 1;
      });
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
    const { onSubjectClicked: onSubjectClickedCallback, selectionChanged: onSelectionChangedCallback, enableMultiSelect, enableSelect, enableSelectAll } = this.props;
    //console.log(`onSubjectClicked ${this.items[index].title}`);
    if (onSubjectClickedCallback != null) {
      onSubjectClickedCallback(index - (enableSelectAll?1:0));
    }
    let newIndexList = [];
    if (enableMultiSelect) {
      const { selectedIndexList: oldIndexList } = this.state;
      if (enableSelectAll && index === 0) {
        if (oldIndexList.includes(0)) {
          // Uncheck ALL
          newIndexList = [];
        }
        else {
          // Check ALL
          newIndexList = [...Array(this.items.length).keys()];
        }
        //console.log(`onSubjectClicked newlist: ${newIndexList}`);
      }
      else {
        // Remove clicked item
        oldIndexList.forEach(index_item => {
          if (index_item !== index) {
            if (enableSelectAll && index_item === 0) {
              return;
            }
            newIndexList.push(index_item);
          }
        });
        // Add clicked item or not
        if (newIndexList.length === oldIndexList.length) { // nothing removed, it's a checked click
          newIndexList.push(index);
        }
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
    // Construct index array returned to parent component
    if (onSelectionChangedCallback != null) {
      //console.log(`onSubjectListChanged before: ${newIndexList}`);
      let feedbackIndexList = [...newIndexList];
      if (enableSelectAll) {
        if (feedbackIndexList.includes(0)){
          feedbackIndexList.pop();
        }
        else {
          feedbackIndexList = feedbackIndexList.map(value=>{
            if (value > 0){
              return value - 1;
            }
            else {
              return 0;
            }
          });
        }
      } else if (enableSelect) {
        feedbackIndexList = [index];
      } else {
        return;
      }
      //console.log(`onSubjectListChanged toParent: ${feedbackIndexList}`);
      onSelectionChangedCallback(feedbackIndexList);
    }
  }

  onSelectAll = (isSelectAll) => {
    if (!isSelectAll) {
      this.reset();
      return;
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
    if (enableSelectAll && indexList.includes(0)){
      title_selected = subjects[0].title;
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
      if (enableSelectAll && subjects[0] && subjects[0].check_all !== 1) {
        this.items = [{title: t("common.select_all"), color: "gray.400", check_all: 1}, ...subjects];
      }
      else {
        this.items = [...subjects];
      }
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
              defaultIsChecked={false} 
              whiteSpace="nowrap" 
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
