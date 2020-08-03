/* @flow */

import React, { Component } from 'react';

import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel
} from '@chakra-ui/core';

class ResultTabList extends Component {
  render() {
    const { titles, tabHeight, pages, color, onTabChange, ...other_props } = this.props;
    return (
      <Tabs variant="enclosed"  {...other_props}>
        <TabList
          onChange={onTabChange}>
          {
            titles.map((title, index) => (
              <Tab
                key={index}
                _selected={{color: "black", bg: color+".400"}}
                _first={{ml:0.5}}
                _last={{mr:0.5}}
                roundedTop="md"
                color={color+".300"}
                height={tabHeight}
                bg={color+".100"}
                mr={3}>
                {title}
              </Tab>
            ))
          }
        </TabList>
        <TabPanels>
          {
            pages.map((page, index) => (
              <TabPanel key={index}>{page}</TabPanel>
            ))
          }
        </TabPanels>
      </Tabs>
    );
  }
}

export { ResultTabList };
