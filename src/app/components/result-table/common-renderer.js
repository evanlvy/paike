/* @flow */

import React, { Component } from 'react';
import {
  Icon,
} from '@chakra-ui/core';

import "./table.css"

class CommonRenderer extends Component {
  render() {
    const { value, colDef } = this.props;
    const { lineHeight, headerName, editable } = colDef;
    if (value == null) {
      console.error(`The value of header: ${headerName} is undefined`);
      return (
        <div className="common-cell" style={{lineHeight: lineHeight+"px"}}></div>
      );
    }
    //console.log("CommonRenderer render: value: "+JSON.stringify(value));
    return (
      <div className="common-cell" style={{lineHeight: lineHeight+"px"}}>
        { value.title == null && value.titles == null && value }
        { value.title != null && value.title }
        {
          value.titles != null &&
          value.titles.map((title, index) => (
            <div key={index+""}>{title}</div>
          ))
        }
        { editable && <Icon name="edit" marginLeft="2" />}
      </div>
    );
  }
}

export { CommonRenderer };
