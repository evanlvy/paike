import React from 'react';
import { Provider } from "react-redux";
import { ThemeProvider, CSSReset } from '@chakra-ui/core'
import { customTheme } from './theme/theme';

import configureStore from "./redux/configureStore";
import { RootNavigator } from './navigation';

const rootStore = configureStore();
function App() {
  return (
    <Provider store={rootStore}>
      <ThemeProvider theme={customTheme}>
        <CSSReset />
        <RootNavigator />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
