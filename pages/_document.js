import { Html, Head, Main, NextScript } from 'next/document';

// Ustawia zapamiętany motyw zanim strona się wyrysuje (bez migotania). Bez wyboru działa motyw systemowy.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="pl">
      <Head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
