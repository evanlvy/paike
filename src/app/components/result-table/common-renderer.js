/* @flow */

import React, { Component } from 'react';

import "./result-table.css"

class CommonRenderer extends Component {
  render() {
    const { value, colDef } = this.props;
    const { lineHeight } = colDef;
    return (
      <div className="cell-wrap-text" style={{lineHeight: lineHeight+"px", marginTop: "5px", marginBottom: "5px"}}>
        {value.title == null ? value : value.title}
      </div>
    );
  }
}

export { CommonRenderer };
