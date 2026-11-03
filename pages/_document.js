import { Html, Head, Main, NextScript } from 'next/document';
import { APPLY_SETTINGS_SCRIPT } from '../lib/settings';

// Ustawia zapamiętane ustawienia (motyw, kontrast, rozmiary) zanim strona się wyrysuje, bez migotania.
// Bez wyboru działa motyw systemowy.
const THEME_SCRIPT = APPLY_SETTINGS_SCRIPT;

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
