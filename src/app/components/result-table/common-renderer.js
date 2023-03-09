/* @flow */

import React, { Component } from 'react';
import { DEFAULT_TABLE_ROW_HEIGHT } from "../../redux/modules/common/info"
import "./table.css"

class CommonRenderer extends Component {
  render() {
    const { value, data, colDef, lineHeight, valueFormatted, fn_disable } = this.props;
    const { editable } = colDef;
    let line_height = lineHeight?lineHeight:DEFAULT_TABLE_ROW_HEIGHT;
    let value_array = [];
    if (value) {
      let value_obj = value;
      if (valueFormatted) {
        value_array = [valueFormatted];
      }
      else if (typeof value_obj === 'string' || typeof value_obj === 'number') {
        value_array = [value_obj];
      }
      else if (value_obj.title) {
        value_array = [value_obj.title];
      }
      else if (value_obj.name) {
        value_array = [value_obj.name];
      }
      else if (Array.isArray(value_obj)) {
        value_array = value_obj;
      }
      else if (value_obj.titles && Array.isArray(value_obj.titles)) {
        value_array = value_obj.titles;
      }
    }
    let should_disable = fn_disable && fn_disable(data);
    if (editable && value_array.length <= 0) {
      // Empty editable will show special icon
      value_array = [should_disable?'\u26D4':'\u2795']
    }
    //console.log("CommonRenderer render: value: "+JSON.stringify(value_array));
    //{ editable && '\u26A1'}
    // backgroundColor:should_disable?"#999aaa":"transparent"
    return (
      <div className="common-cell" style={{lineHeight:line_height+"px",color:editable?"#015bf1":"black"}}>
        {
          value_array.map((item_obj, index) => {
            let title = "";
            let key_id = index;
            if (typeof item_obj === 'object') {
              if (item_obj.name) {
                title = item_obj.name;
              }
              else if (item_obj.title) {
                title = item_obj.title;
              }
              if (item_obj.id) {
                key_id = item_obj.id;
              }
            } else {
              title = item_obj;
            }
            return <div key={key_id+""}>{title}</div>
          })
        }
      </div>
    );
  }
}

export { CommonRenderer };
