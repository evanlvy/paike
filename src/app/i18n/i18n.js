import i18n from "i18next";
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enUsTrans from './en-us.json';
import zhCnTrans from './zh-cn.json';

i18n.use(LanguageDetector)
  .use(initReactI18next)
  .init({
  resources: {
    en: {
      translation: enUsTrans,
    },
    zh: {
      translation: zhCnTrans,
    },
  },
  fallbackLng: "zh",
  debug: false,
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
})

export default i18n;
