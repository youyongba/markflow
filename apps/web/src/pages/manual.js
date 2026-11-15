import React from 'react';
import Link from 'next/link';
import SeoHead from '../components/seo/SeoHead';
import { trackEvent } from '../utils/analytics';
import styles from '../styles/manual.module.css';

const title = 'MarkFlow 使用手册｜Markdown 编辑、管理与导出教程';
const description = '学习使用 MarkFlow 管理 Markdown 目录和文档，切换源码、分屏、只读与脑图视图，使用 ADR/RFC 模板，并导出 Markdown、HTML、PDF 和 Word。';

const faqItems = [
  {
    question: '新用户如何注册 MarkFlow？',
    answer: '不需要单独注册。打开登录页，输入尚未使用过的新邮箱和访问凭据，首次登录时系统会自动创建账号并进入工作台。'
  },
  {
    question: '为什么 PDF 导出需要允许弹窗？',
    answer: 'PDF 通过浏览器打印窗口生成。请点击导出 PDF 后允许当前站点打开弹窗，再在打印对话框中选择“另存为 PDF”；若浏览器拦截弹窗，PDF 导出无法继续。'
  },
  {
    question: '为什么 HTML 或 PDF 导出前需要切换视图？',
    answer: 'HTML 和 PDF 从当前渲染后的预览内容生成。请先切换到分屏对齐或只读渲染视图，再打开导出菜单；Markdown 和 Word 则直接根据当前源码生成。'
  },
  {
    question: 'Word 导出会保留文档中的图片吗？',
    answer: '当前版本会将 Markdown 图片导出为“[图片: 替代文字或地址]”文字占位，不会嵌入原始图片。标题、列表、表格和代码块等内容会按支持的样式转换。'
  },
  {
    question: '导出后样式或内容有变化怎么办？',
    answer: '请确认当前源码和预览已经更新，然后重新导出。旧文件不会随文档或产品功能更新而自动变化，HTML 和 PDF 以导出时的预览为准。'
  },
  {
    question: '目录展开后看不到文档怎么办？',
    answer: '尝试先折叠再展开目录。新建或重命名文档后，目录树会整树刷新并保留已展开层级；仍未显示时，可刷新页面后重试。'
  }
];

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer
    }
  }))
};

function Section({ id, title: sectionTitle, children }) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}><span aria-hidden="true" />{sectionTitle}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Item({ title: itemTitle, children }) {
  return (
    <div className={styles.item}>
      <h3>{itemTitle}</h3>
      <div>{children}</div>
    </div>
  );
}

export default function Manual() {
  const trackCta = (label) => trackEvent('SEO 转化', '点击开始使用', label);

  return (
    <div className={styles.page}>
      <SeoHead title={title} description={description} path="/manual" structuredData={structuredData} />

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="返回 MarkFlow 产品首页">
            <span aria-hidden="true">M</span>
            <strong>MarkFlow 使用手册</strong>
          </Link>
          <nav aria-label="手册导航">
            <Link href="/">产品首页</Link>
            <Link href="/dashboard">进入工作台</Link>
            <Link href="/auth/login" className={styles.headerCta} onClick={() => trackCta('manual_header')}>开始使用</Link>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>MARKDOWN DOCUMENTATION GUIDE</p>
          <h1>MarkFlow 使用手册：从文档管理到多格式导出</h1>
          <p>MarkFlow 是面向工程文档的 Markdown 管理工作台。本教程基于当前版本，介绍目录与模板、四种编辑视图、全文搜索、文档分享和导出格式的真实用法与限制。</p>
        </div>

        <nav className={styles.toc} aria-label="本页目录">
          <strong>本页目录</strong>
          <div>
            <a href="#start">1. 快速开始</a>
            <a href="#files">2. 文档与目录管理</a>
            <a href="#editor">3. 编辑器与视图</a>
            <a href="#outline">4. 右侧导航目录</a>
            <a href="#search">5. 搜索与分享</a>
            <a href="#export">6. 多格式导出教程</a>
            <a href="#faq">7. 常见问题</a>
          </div>
        </nav>

        <Section id="start" title="1. 快速开始">
          <Item title="登录并自动创建账号">在<Link href="/auth/login">登录页</Link>输入邮箱和访问凭据即可进入工作台。首次使用的新邮箱会自动创建账号，已有账号则校验凭据后登录。</Item>
          <Item title="认识工作台布局">左侧是目录树，中间是编辑区，顶部是搜索与操作栏，右侧是当前文档的导航目录。左右侧栏都可以折叠，为编辑腾出空间。</Item>
          <Item title="完成第一篇文档">先选择目录，再点击顶栏“新建文档”，选择模板并开始编辑。内容会自动备份；完成后可生成分享链接，或按本文<a href="#export">导出教程</a>保存为所需格式。</Item>
        </Section>

        <Section id="files" title="2. 文档、目录与工程模板">
          <Item title="新建目录">点击左侧“目录树结构”右侧的 + 新建根目录；将鼠标移到某个目录上，点击目录行的 + 新建子目录。目录支持多级嵌套。</Item>
          <Item title="新建文档">点击顶栏“新建文档”，输入文档名称（可自动补全 .md 后缀），选择存储目录和模板，然后点击“立即创建”。目录下拉框会显示全部层级的完整路径，创建成功后目录树会展开到对应位置。</Item>
          <Item title="重命名、删除与展开状态">将鼠标悬停在目录或文档上，使用行内编辑、删除图标。删除目录会同时删除其中内容，请谨慎操作。点击目录名可展开或折叠子节点，展开状态会被记住。</Item>

          <div className={styles.templateGrid}>
            <article>
              <h3>ADR：记录架构决策</h3>
              <p>适合保留技术选型过程。新建文档时选择 ADR 模板，并按“背景、选项、决策、后果”补齐信息。</p>
              <pre><code>{`# ADR：决策标题\n\n## 背景\n说明问题、约束与决策时限。\n\n## 选项\n列出候选方案及比较依据。\n\n## 决策\n记录最终选择及理由。\n\n## 后果\n说明收益、代价和后续行动。`}</code></pre>
            </article>
            <article>
              <h3>RFC：组织技术提案</h3>
              <p>适合在开发前说明方案并收集评审意见。RFC 模板可围绕以下结构持续修订。</p>
              <pre><code>{`# RFC：提案标题\n\n## 概述\n概括提案与预期结果。\n\n## 动机\n说明现状问题和解决价值。\n\n## 详细设计\n描述架构、流程与接口。\n\n## 风险\n列出安全、兼容和运维风险。\n\n## 替代方案\n记录未采用的方案及原因。`}</code></pre>
            </article>
          </div>
          <p className={styles.note}>API 接口模板用于生成接口文档起点。生成后仍需按真实接口补齐路径、参数、响应与示例，不等同于自动完成 OpenAPI 规范文件。</p>
        </Section>

        <Section id="editor" title="3. 编辑器与四种视图">
          <Item title="源码、分屏、只读与脑图">工具栏左侧可切换纯源码、分屏对齐（左源码右预览）、只读渲染和解析脑图。脑图将标题结构渲染为思维导图，便于检查文档层级。</Item>
          <Item title="自动备份">编辑内容会防抖自动备份，源码区顶部显示最近备份时间，无需手动保存。</Item>
          <Item title="格式工具栏">支持加粗、斜体、删除线、一到六级标题、引用、代码、链接、图片、无序/有序列表、任务列表、表格、分割线和数学公式。</Item>
          <Item title="双向同步滚动">分屏模式下，左右两栏按比例同步滚动，可在工具栏右侧开关。点击导航目录或锚点跳转时会自动暂停同步，避免定位被覆盖。</Item>
          <Item title="正文锚点">预览中的 [章节名](#章节名) 形式锚点链接可平滑滚动到对应标题，支持 GitHub 风格 slug 规则和被截断的锚点。</Item>
        </Section>

        <Section id="outline" title="4. 右侧导航目录">
          <Item title="实时大纲">右侧面板实时解析当前文档的 # 至 ###### 标题，按层级缩进展示，并自动跳过 YAML frontmatter 和代码块中的 # 行。</Item>
          <Item title="点击跳转与阅读高亮">预览或分屏模式会平滑滚动到对应标题；纯源码模式会定位并选中标题行；脑图模式会先切换到预览再定位。滚动预览时，大纲高亮当前阅读位置。</Item>
          <Item title="折叠面板">点击“导航目录”左侧的图标可隐藏面板；隐藏后顶栏最右侧会出现同样的图标，点击即可恢复。</Item>
        </Section>

        <Section id="search" title="5. 全文搜索与文档分享">
          <Item title="搜索标题与正文">在顶栏搜索框输入关键词并回车，可搜索文档标题与内容，点击结果直接打开对应文档。</Item>
          <Item title="生成分享链接">打开文档后点击“分享”生成链接，复制后发送给同事。分享前需要先选中一个文档；接收者打开链接并登录后，可将文档接收到自己的工作区。</Item>
        </Section>

        <Section id="export" title="6. Markdown、HTML、PDF 与 Word 导出教程">
          <p>先打开需要导出的文档，再点击工具栏“导出”菜单。不同格式使用的内容来源和前置条件不同：</p>
          <ol className={styles.exportSteps}>
            <li><strong>导出 Markdown：</strong>直接选择“导出 Markdown”，将当前编辑器源码保存为 .md 文件，包括源码中的 frontmatter。</li>
            <li><strong>导出 HTML：</strong>先切换到分屏对齐或只读渲染，再选择“导出 HTML 包”。单文件 HTML 保留当前预览样式、标题锚点和代码复制按钮。</li>
            <li><strong>导出 PDF：</strong>先切换到分屏对齐或只读渲染，再选择“导出 PDF”。允许浏览器打开弹窗，在打印窗口中选择“另存为 PDF”。长文档会按打印页面自动分页。</li>
            <li><strong>导出 Word：</strong>直接选择“导出 Word”，系统根据当前 Markdown 源码生成 .docx。YAML frontmatter 不进入正文，图片目前仅导出为文字占位。</li>
          </ol>

          <div className={styles.tableScroll} tabIndex="0" role="region" aria-label="导出格式对比表，可横向滚动">
            <table>
              <caption>四种导出格式的内容与交互能力对比</caption>
              <thead>
                <tr>
                  {['格式', '内容来源与版式', '锚点跳转', '复制代码'].map((heading) => <th key={heading} scope="col">{heading}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Markdown (.md)', '当前源码', '保留源码语法', '使用编辑器复制'],
                  ['HTML (.html)', '当前预览与样式', '支持，点击跳转', '支持，按钮可复制'],
                  ['PDF (.pdf)', '当前预览，浏览器打印分页', '支持，阅读器内跳转', '静态内容，无复制按钮'],
                  ['Word (.docx)', '当前源码，转换标题与表格等样式', '支持书签与内部链接', '静态内容，选中代码复制']
                ].map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell, index) => index === 0 ? <th key={cell} scope="row">{cell}</th> : <td key={cell}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.note}>PDF 和 Word 都是静态格式，不能执行代码复制按钮所需的 JavaScript。Word 的图片高保真嵌入目前不受支持，请在导出后检查图片占位和版式。</p>
          <Link href="/dashboard" className={styles.exportCta} onClick={() => trackCta('manual_export')}>进入工作台导出文档</Link>
        </Section>

        <Section id="faq" title="7. 常见问题">
          <div className={styles.faqList}>
            {faqItems.map((item) => <Item key={item.question} title={item.question}>{item.answer}</Item>)}
          </div>
          <Item title="如何反馈问题？">请联系工作区管理员，并附上问题现象、操作步骤和截图。项目交流信息也可在<Link href="/about">关于页面</Link>查看。</Item>
        </Section>

        <section className={styles.finalCta} aria-labelledby="manual-cta-title">
          <div>
            <p className={styles.eyebrow}>继续实践</p>
            <h2 id="manual-cta-title">用 MarkFlow 整理下一篇工程文档</h2>
            <p>回到<Link href="/">产品首页</Link>了解功能，或直接登录后从目录和模板开始。</p>
          </div>
          <Link href="/auth/login" className={styles.primaryCta} onClick={() => trackCta('manual_final')}>开始使用 MarkFlow</Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>© 2026-2028 MarkFlow · 个人开源项目 · 当前为演示版本</span>
        <nav aria-label="页脚导航"><Link href="/">产品首页</Link><Link href="/about">关于项目</Link><Link href="/dashboard">进入工作台</Link></nav>
      </footer>
    </div>
  );
}
