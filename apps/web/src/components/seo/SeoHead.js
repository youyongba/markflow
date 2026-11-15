import React from 'react';
import Head from 'next/head';
import { getSiteUrl } from '../../config/site';

export default function SeoHead({
  title,
  description,
  path = '/',
  robots = 'index,follow',
  image = '/images/markflow-og.png',
  structuredData = []
}) {
  const canonical = getSiteUrl(path);
  const imageUrl = getSiteUrl(image);
  const schemas = Array.isArray(structuredData) ? structuredData : [structuredData];

  return (
    <Head>
      <title>{title}</title>
      <meta key="description" name="description" content={description} />
      <meta key="robots" name="robots" content={robots} />
      <link key="canonical" rel="canonical" href={canonical} />

      <meta key="og:type" property="og:type" content="website" />
      <meta key="og:locale" property="og:locale" content="zh_CN" />
      <meta key="og:site_name" property="og:site_name" content="MarkFlow" />
      <meta key="og:title" property="og:title" content={title} />
      <meta key="og:description" property="og:description" content={description} />
      <meta key="og:url" property="og:url" content={canonical} />
      <meta key="og:image" property="og:image" content={imageUrl} />
      <meta key="og:image:width" property="og:image:width" content="1200" />
      <meta key="og:image:height" property="og:image:height" content="630" />
      <meta key="og:image:alt" property="og:image:alt" content="MarkFlow Markdown 文档管理工作台" />

      <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
      <meta key="twitter:title" name="twitter:title" content={title} />
      <meta key="twitter:description" name="twitter:description" content={description} />
      <meta key="twitter:image" name="twitter:image" content={imageUrl} />

      {schemas.filter(Boolean).map((schema, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
      ))}
    </Head>
  );
}
