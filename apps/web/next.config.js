/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许 Next.js 编译 workspace 中的共享包，以及需要被转译的纯 ESM 依赖
  transpilePackages: ['shared-constants', 'shared-types', 'shared-utils', 'react-markdown', 'remark-gfm', 'vfile', 'vfile-message', 'unist-util-stringify-position', 'unified', 'bail', 'is-plain-obj', 'trough', 'remark-parse', 'mdast-util-from-markdown', 'mdast-util-to-string', 'micromark', 'decode-named-character-reference', 'character-entities', 'property-information', 'hast-util-whitespace', 'remark-rehype', 'mdast-util-to-hast', 'unist-util-position', 'unist-builder', 'unist-util-generated', 'unist-util-is', 'unist-util-visit'],
  env: {
    NEXT_PUBLIC_API_MODE: process.env.NEXT_PUBLIC_API_MODE,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};
module.exports = nextConfig;
