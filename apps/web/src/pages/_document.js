import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  const verificationTags = [
    { name: 'google-site-verification', value: process.env.GOOGLE_SITE_VERIFICATION },
    { name: 'baidu-site-verification', value: process.env.BAIDU_SITE_VERIFICATION },
    { name: 'msvalidate.01', value: process.env.BING_SITE_VERIFICATION }
  ].filter(({ value }) => value && value.trim());

  return (
    <Html lang="zh-CN">
      <Head>
        {verificationTags.map(({ name, value }) => (
          <meta key={name} name={name} content={value.trim()} />
        ))}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-WZFSQDJ6');
            `
          }}
        />
      </Head>
      <body>
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WZFSQDJ6"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="Google Tag Manager"
          />
        </noscript>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
