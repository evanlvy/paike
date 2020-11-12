/* @flow */

import React, { PureComponent } from 'react';
import {
  Box,
} from '@chakra-ui/core'

import { BallGrid } from '../common/ball-grid';

class SubjectBoard extends PureComponent {
  constructor(props) {
    super (props)
    this.state = {
      selectedIndex: props.initSubjectIndex,
    }
  }
  onSubjectClicked = (index) => {
    const { onSubjectClicked: onSubjectClickedCallback, enableSelect } = this.props;
    //console.log(`onSubjectClicked ${this.props.subjects[index].title}`);
    if (onSubjectClickedCallback != null) {
      onSubjectClickedCallback(index);
    }

    if (enableSelect) {
      this.setState({
        selectedIndex: index
      })
    }
  }

  reset = () => {
    this.setState({
      selectedIndex: this.props.initSubjectIndex
    })
  }

  render() {
    const { selectedIndex } = this.state;
    const { subjects, color, title, initSubjectIndex, onSubjectClicked, ...other_props } = this.props;
    return (
      <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflowY="hidden" {...other_props}>
        <Box backgroundColor={color+".400"} px={5} py={2} color="white">{title}</Box>
        <BallGrid
          colCount={6}
          balls={subjects}
          ballSize={100}
          height={250}
          selectedBallIndex={selectedIndex}
          onBallClicked={this.onSubjectClicked} />
      </Box>
    );
  }
}

export { SubjectBoard };
