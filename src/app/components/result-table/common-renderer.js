/* @flow */

import React, { Component } from 'react';
import {
  Icon,
} from '@chakra-ui/core';

import "./table.css"

class CommonRenderer extends Component {
  render() {
    const { value, colDef } = this.props;
    const { lineHeight, editable } = colDef;
    return (
      <div className="common-cell" style={{lineHeight: lineHeight+"px"}}>
        { value.title == null ? value : value.title }
        { editable && <Icon name="edit" marginLeft="2" />}
      </div>
    );
  }
}

export { CommonRenderer };
