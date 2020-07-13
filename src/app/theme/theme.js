import { theme } from "@chakra-ui/core";

// Let's say you want to add custom colors
const customTheme = {
  ...theme,
  colors: {
    ...theme.colors,
  },
  icons: {
    ...theme.icons,
  },
};

export { customTheme }
