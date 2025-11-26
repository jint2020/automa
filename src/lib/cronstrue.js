import cronstrue from 'cronstrue';
import 'cronstrue/locales/zh_CN';

const supportedLocales = ['en', 'zh'];
const altLocaleId = {
  zh: 'zh_CN',
};

export function readableCron(expression) {
  const currentLang = document.documentElement.lang;
  const locale = supportedLocales.includes(currentLang)
    ? altLocaleId[currentLang] || currentLang
    : 'en';

  return cronstrue.toString(expression, { locale });
}

export default cronstrue;
