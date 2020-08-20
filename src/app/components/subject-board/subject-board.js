/* @flow */

import React, { Component } from 'react';
import {
  Box,
} from '@chakra-ui/core'

import { BallGrid } from '../common/ball-grid';

class SubjectBoard extends Component {
  onSubjectClicked = (index) => {
    const { onSubjectClicked: onSubjectClickedCallback } = this.props;
    console.log(`onSubjectClicked ${this.props.subjects[index].title}`);
    if (onSubjectClickedCallback != null) {
      onSubjectClickedCallback(index);
    }
  }

  render() {
    const { subjects, color, title, onSubjectClicked, ...other_props } = this.props;
    return (
      <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflow="hidden" {...other_props}>
        <Box backgroundColor={color+".400"} px={5} py={2} color="white">{title}</Box>
        <BallGrid
          colCount={6}
          balls={subjects}
          ballSize={100}
          onBallClicked={this.onSubjectClicked} />
      </Box>
    );
  }
}

export { SubjectBoard };
