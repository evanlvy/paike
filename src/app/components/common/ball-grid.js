import React from 'react';
import {
  Flex,
  Box,
  SimpleGrid,
  Text,
  Icon,
} from '@chakra-ui/core'

const DEFAULT_CHECK_ICON_COLOR = "blue.500";
function BallGrid(props) {
  const { height, maxHeight, balls, ballSize, selectedBallIndexList, onBallClicked, ballColor } = props;
  let { checkIconColor } = props;
  if (checkIconColor == null) {
    checkIconColor = DEFAULT_CHECK_ICON_COLOR;
  }
  let default_ballcolor = ballColor?ballColor:"gray.700";
  if (!balls) return "";
  return (
    <Flex height={height == null ? "100%" : height} maxHeight={maxHeight} overflowY="scroll" wrap="wrap" justify="center">
      {
        balls.map((ball, index) => (
          <Flex justify="center" m={2} key={index}>
            <Box cursor="pointer" display="flex" position="relative" width={ballSize} height={ballSize} borderRadius="50%" justifyContent="center" alignItems="center" backgroundColor={ball.color?ball.color:default_ballcolor} onClick={()=>{onBallClicked(index)}}>
              {selectedBallIndexList != null && selectedBallIndexList.indexOf(index) >= 0 &&  <Icon name="check" color={checkIconColor} position="absolute" bottom="0px" right="0px" size="2em"/>}
              <Text width="80%" color="white" textAlign="center">{ball.title?ball.title:ball.name}</Text>
            </Box>
          </Flex>
        ))
      }
    </Flex>
  );
}

export { BallGrid };
