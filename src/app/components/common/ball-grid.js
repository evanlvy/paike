import React from 'react';
import {
  Flex,
  Box,
  SimpleGrid,
  Text,
  Icon,
} from '@chakra-ui/core'

function BallGrid(props) {
  const { height, balls, ballSize, colCount, selectedBallIndex, onBallClicked } = props;
  return (
    <Flex height={height == null ? "100%" : height} overflowY="scroll">
      <SimpleGrid width="100%" columns={colCount} spacing={6}>
        {
          balls.map((ball, index) => (
            <Flex justify="center" m={2} key={index}>
              <Box display="flex" position="relative" width={ballSize} height={ballSize} borderRadius="50%" justifyContent="center" alignItems="center" backgroundColor={ball.color} onClick={()=>{onBallClicked(index)}}>
                {selectedBallIndex != null && index === selectedBallIndex &&  <Icon name="check" color="blue.500" position="absolute" bottom="2px" right="2px"/>}
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
