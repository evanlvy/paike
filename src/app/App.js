import React from 'react';
import { ThemeProvider, CSSReset } from '@chakra-ui/core'
import { customTheme } from './theme/theme';

import { RootNavigator } from './navigation';

function App() {
  return (
    <ThemeProvider theme={customTheme}>
      <CSSReset />
      <RootNavigator />
    </ThemeProvider>
  );
}

export default App;
