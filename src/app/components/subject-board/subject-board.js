/* @flow */

import React, { Component } from 'react';
import {
  Flex,
  Box,
  SimpleGrid,
  Text,
} from '@chakra-ui/core'

class SubjectBoard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      subjects: []
    }
  }

  componentDidMount() {
    this.initUI();
  }

  initUI = () => {
    const { subjects } = this.props;
    this.setState({
      subjects: subjects
    });
  }

  onSubjectClicked = (index) => {
    const { onSubjectClicked: onSubjectClickedCallback } = this.props;
    console.log(`onSubjectClicked ${this.props.subjects[index].title}`);
    if (onSubjectClickedCallback != null) {
      onSubjectClickedCallback(index);
    }
  }

  render() {
    const { subjects } = this.state;
    const { color, title, onSubjectClicked, ...other_props } = this.props;
    return (
      <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflow="hidden" {...other_props}>
        <Box backgroundColor={color+".400"} px={5} py={2} color="white">{title}</Box>
        <SimpleGrid width="100%" columns={6} spacing={6}>
          {
            subjects.map((subject, index) => (
              <Flex justify="center" m={2} key={index}>
                <Box display="flex" width="100px" height="100px" borderRadius="50%" justifyContent="center" alignItems="center" backgroundColor={subject.color} onClick={()=>{this.onSubjectClicked(index)}}>
                  <Text width="80%" color="white" textAlign="center">{subject.title}</Text>
                </Box>
              </Flex>
            ))
          }
        </SimpleGrid>
      </Box>
    );
  }
}

export { SubjectBoard };
