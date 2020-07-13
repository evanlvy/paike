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
    this.subjects = [
      {title: "护理", color: "red.400"},
      {title: "助产", color: "green.200"},
      {title: "临床医学", color: "blue.400"},
      {title: "临床医学\n病理", color: "orange.300"},
      {title: "全科医学", color: "cyan.500"},
      {title: "卫生信息\n管理", color: "blue.200"},
      {title: "医学影像", color: "green.100"},
      {title: "影像技术", color: "green.300"},
      {title: "放射治疗\n技术", color: "blue.400"},
      {title: "医学美容", color: "purple.500"},
    ]
  }

  render() {
    const { subjects } = this;
    const { color, title, ...other_props } = this.props;
    return (
      <Box borderWidth={1} borderColor={color+".200"} borderRadius="md" overflow="hidden" {...other_props}>
        <Box backgroundColor={color+".400"} px={5} py={2} color="white">{title}</Box>
        <SimpleGrid width="100%" columns={6} spacing={6}>
          {
            subjects.map((subject, index) => (
              <Flex justify="center" m={2} key={index}>
                <Box display="flex" width="100px" height="100px" borderRadius="50%" justifyContent="center" alignItems="center" backgroundColor={subject.color}>
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
