/* @flow */

import React, { Component } from 'react';
import {
  Button,
  ButtonGroup,
} from '@chakra-ui/core';

import "./table.css"
import { slotsTranslation } from "../../redux/modules/rawplan";

class ConflictsRenderer extends Component {
  buttonClicked = (event) => {
    const { onItemClicked } = this.props;
    let key_str = event.target.value;
    if (key_str) {
      //console.log("buttonClicked:true:"+key_str);
      if (onItemClicked) {
        onItemClicked(key_str.substring(0,6), parseInt(key_str.substring(7), 10));
      }
    }
  };

  render() {
    const { value, colDef, onItemClicked } = this.props;
    const conflicts = Array.isArray(value)?value:[value];
    if (conflicts.length <= 0 || !conflicts[0].hasOwnProperty('colKey')) {
      return "";
    }
    //const cellValue = conflicts[0]["colKey"];
 
    return (
      <ButtonGroup onClick={this.buttonClicked.bind(this)}>
        {conflicts.map((item, index)=>{
          let key_str = item["colKey"]+'&'+item["rowIndex"];
          return <Button size="xs" key={index} value={key_str}>{slotsTranslation[item["colKey"]]}</Button>
      })}
      </ButtonGroup>);
  }
}

export { ConflictsRenderer };
