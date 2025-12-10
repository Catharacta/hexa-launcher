import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ja from './locales/ja.json';

/**
 * i18nextの初期化設定。
 * 日英の翻訳リソースを読み込み、アプリケーションの国際化を有効にします。
 */
i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ja: { translation: ja }
        },
        lng: 'ja', // デフォルト言語
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already escapes
        }
    });

export default i18n;
