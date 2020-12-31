/* @flow */

import React, { PureComponent } from 'react';
import {
  Box,
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
    const { initSelectedIndexList, initSelectIndex } = this.props;
    let selectedIndexList = [];
    if (initSelectedIndexList !== undefined) {
      selectedIndexList = [...initSelectedIndexList];
    } else if (initSelectIndex !== undefined) {
      selectedIndexList = [initSelectIndex];
    }
    return selectedIndexList;
  }

  reset = () => {
    this.setState({
      selectedIndexList: this.buildInitSelectedIndexList()
    })
  }

  onSubjectClicked = (index) => {
    const { onSubjectClicked: onSubjectClickedCallback, enableMultiSelect, enableSelect } = this.props;
    //console.log(`onSubjectClicked ${this.props.subjects[index].title}`);
    if (onSubjectClickedCallback != null) {
      onSubjectClickedCallback(index);
    }
    let newIndexList = [];
    if (enableMultiSelect) {
      const { selectedIndexList: oldIndexList } = this.state;
      oldIndexList.forEach(index_item => {
        if (index_item !== index) {
          newIndexList.push(index_item);
        }
      });
      if (newIndexList.length === oldIndexList.length) { // nothing removed, it's a checked click
        newIndexList.push(index);
      }
    } else if (enableSelect) {
      newIndexList = [index];
    } else {
      return;
    }
    this.setState({
      selectedIndexList: newIndexList
    })
  }

  render() {
    const { selectedIndexList } = this.state;
    const { subjects, color, title, initSubjectIndex, onSubjectClicked, ...other_props } = this.props;
    return (
      <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" {...other_props}>
        <Box backgroundColor={color+".400"} px={5} py={2} color="white">{title}</Box>
        <BallGrid
          colCount={6}
          balls={subjects}
          ballSize={100}
          maxHeight={250}
          selectedBallIndexList={selectedIndexList}
          onBallClicked={this.onSubjectClicked} />
      </Box>
    );
  }
}

export { SubjectBoard };
