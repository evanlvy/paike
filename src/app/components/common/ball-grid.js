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
  const { height, maxHeight, balls, ballSize, colCount, selectedBallIndexList, onBallClicked } = props;
  let { checkIconColor } = props;
  if (checkIconColor == null) {
    checkIconColor = DEFAULT_CHECK_ICON_COLOR;
  }
  if (!balls) return "";
  return (
    <Flex height={height == null ? "100%" : height} maxHeight={maxHeight} overflowY="scroll">
      <SimpleGrid width="100%" columns={colCount} spacing={6}>
        {
          balls.map((ball, index) => (
            <Flex justify="center" m={2} key={index}>
              <Box display="flex" position="relative" width={ballSize} height={ballSize} borderRadius="50%" justifyContent="center" alignItems="center" backgroundColor={ball.color?ball.color:"gray.500"} onClick={()=>{onBallClicked(index)}}>
                {selectedBallIndexList != null && selectedBallIndexList.indexOf(index) >= 0 &&  <Icon name="check" color={checkIconColor} position="absolute" bottom="0px" right="0px" size="2em"/>}
                <Text width="80%" color="white" textAlign="center">{ball.title}</Text>
              </Box>
            </Flex>
          ))
        }
      </SimpleGrid>
    </Flex>
  );
}

export { BallGrid };
