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
  constructor(props) {
    super(props);
    this.state = {
      tabIndex: 0
    }
  }

  handleTabsChange = index => {
    console.log("handleTabsChange, index: "+index);
    this.setState({
      tabIndex: index
    });
    if (this.props.onTabChange) {
      this.props.onTabChange(index);
    }
  }

  reset = () => {
    this.setState({
      tabIndex: 0
    })
  }

  render() {
    const { titles, tabHeight, pages, color, onTabChange, defaultIndex, ...other_props } = this.props;
    const { tabIndex } = this.state;
    return (
      <Tabs variant="enclosed" index={tabIndex} defaultIndex={defaultIndex} onChange={this.handleTabsChange} {...other_props}>
        <TabList>
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
