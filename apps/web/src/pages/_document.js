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
              var _hmt = _hmt || [];
              _hmt.push(['_setAutoPageview', false]);
              (function() {
                var hm = document.createElement('script');
                hm.src = 'https://hm.baidu.com/hm.js?74a95ebf77c4d891259030ed57280cf1';
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(hm, s);
              })();
            `
          }}
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
