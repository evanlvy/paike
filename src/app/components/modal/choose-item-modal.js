import React, { PureComponent } from 'react';
import { Trans, withTranslation } from 'react-i18next';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Flex,
  Button,
  Text,
  Select,
} from "@chakra-ui/core";

import { BallGrid } from '../common/ball-grid';

const DEFAULT_EMPTY_COLOR = "blue.500";
const DEFAULT_OCCUPIED_COLOR = "gray.500";
class ChooseItemModalWrapped extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false,
      curCenterIndex: 0,
      curTimeSegIndex: 0,
      selectedItemIndex: -1,
    }
  }

  componentDidMount() {
    this.initUI();
  }

  initUI = () => {
    const { initCenterIndex = 0, initTimeSegIndex = 0} = this.props;

    this.setState({
      curCenterIndex: initCenterIndex,
      curTimeSegIndex: initTimeSegIndex,
    });
  }

  buildItemsData = () => {
    const { items } = this.props;
    let { occupiedColor, occupiedSuffix, emptyColor } = this.props;
    if (occupiedColor == null) {
      occupiedColor = DEFAULT_OCCUPIED_COLOR;
    }
    if (occupiedSuffix == null) {
      occupiedSuffix = "";
    }
    if (emptyColor == null) {
      emptyColor = DEFAULT_EMPTY_COLOR;
    }
    let itemsData = [];
    for (let i=0; i < items.length; i++) {
      let item = items[i];
      let title = item.title;
      let color = emptyColor
      if (item.occupied != null) {
        title += "\n"+item.occupied+occupiedSuffix;
        color = occupiedColor;
      }
      itemsData[i] = {title: title, color: color};
    }
    //console.log("Items: "+JSON.stringify(itemsData));
    return itemsData;
  }

  show = (timeSegIndex = 0) => {
    this.setState({
      isOpen: true,
      curTimeSegIndex: timeSegIndex,
      selectedItemIndex: -1,
    })
  }

  dismiss = () => {
    this.setState({
      isOpen: false,
    })
  }

  onItemSelected = (index) => {
    const { items } = this.props;
    console.log("onItemSelected: "+JSON.stringify(items[index]));
    this.setState({
      selectedItemIndex: index
    })
  }

  onSelectedCenterChanged = (event) => {
    this.setState({
      curCenterIndex: event.target.value,
      selectedItemIndex: -1,
    });
    const { onCenterChanged } = this.props;
    if (onCenterChanged != null) {
      onCenterChanged(event.target.value);
    }
  }

  onTimeSegChanged = (offset) => {
    const { curTimeSegIndex } = this.state;
    const { timeSegments } = this.props;
    if (curTimeSegIndex + offset < 0) {
      return;
    } else if (curTimeSegIndex + offset > timeSegments.length-1) {
      return;
    }
    this.setState({
      curTimeSegIndex: curTimeSegIndex+offset,
      selectedItemIndex: -1,
    })
    const { onTimeSegChanged } = this.props;
    if (onTimeSegChanged) {
      onTimeSegChanged(curTimeSegIndex+offset);
    }
  }

  onCancelBtnClicked = () => {
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(false, -1)) {
        return;
      }
    }
    this.dismiss();
  }

  onOKBtnClicked = () => {
    const { selectedItemIndex } = this.state;
    const { onResult } = this.props;
    if (onResult != null) {
      if (!onResult(true, selectedItemIndex)) {
        return;
      }
    }
    this.dismiss();
  }

  render() {
    const { isOpen, curCenterIndex, curTimeSegIndex, selectedItemIndex } = this.state;
    const { t, items, centers, timeSegments, checkIconColor, ...other_props } = this.props;
    let curCenter = null;
    if (centers != null) {
      curCenter = centers[curCenterIndex];
    }
    let curTimeSeg = null;
    if (timeSegments != null) {
      curTimeSeg = timeSegments[curTimeSegIndex];
    }
    const itemsData = this.buildItemsData(items);
    return (
      <Modal isOpen={isOpen} onClose={this.onCancelBtnClicked} {...other_props}>
        <ModalOverlay />
        <ModalContent minWidth={1024}>
          <ModalHeader display="flex" flexDirection="row" alignItems="center" backgroundColor="blue.500">
          {
            curCenter != null &&
            <Text width="100%" whiteSpace="nowrap">{t("chooseLabModal.title_template", {center_name: curCenter.name})}</Text>
          }
          {
            curTimeSeg != null &&
            <Flex flexDirection="row" alignItems="center" marginRight="10">
                <Button onClick={()=>{this.onTimeSegChanged(-1);}} disabled={curTimeSegIndex <= 0}><Trans>chooseLabModal.previous_time</Trans></Button>
                <Text marginX="2" whiteSpace="nowrap">{curTimeSeg.name}</Text>
                <Button onClick={()=>{this.onTimeSegChanged(1);}} disabled={curTimeSegIndex >= timeSegments.length-1}><Trans>chooseLabModal.next_time</Trans></Button>
            </Flex>
          }
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody padding={0}>
            <BallGrid
              height={280}
              colCount={6}
              ballSize={100}
              balls={itemsData}
              checkIconColor={checkIconColor}
              selectedBallIndex={selectedItemIndex}
              onBallClicked={this.onItemSelected} />
            <Flex margin="2" padding="3" alignItems="center" borderTop="solid 1px" borderTopColor="gray.200">
              <Flex flex="1">
              {
                centers != null &&
                <Select width="30%" value={curCenterIndex} onChange={this.onSelectedCenterChanged}>
                  {
                    centers.map((center, index) => (
                      <option key={index} value={index} >{center.name}</option>
                    ))
                  }
                </Select>
              }
              </Flex>
              <Button onClick={this.onCancelBtnClicked} mr="5" variantColor="gray" width="100px" height="44px"><Trans>common.cancel</Trans></Button>
              <Button onClick={this.onOKBtnClicked} variantColor="green" width="100px" height="44px" disabled={selectedItemIndex < 0}><Trans>common.ok</Trans></Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }
}

const ChooseItemModal = withTranslation("translation", {withRef: true})(ChooseItemModalWrapped);
export { ChooseItemModal };
