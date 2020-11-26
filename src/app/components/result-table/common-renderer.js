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
    return (
      <div className="common-cell" style={{lineHeight: lineHeight+"px"}}>
        { !value.title && !value.titles && value }
        { value.title && value.title }
        {
          value.titles &&
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
