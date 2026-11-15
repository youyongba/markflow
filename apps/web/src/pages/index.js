import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SeoHead from '../components/seo/SeoHead';
import { SITE_URL } from '../config/site';
import { trackEvent } from '../utils/analytics';
import styles from '../styles/landing.module.css';

const title = 'MarkFlow｜Markdown 文档管理、实时预览与多格式导出';
const description = 'MarkFlow 是面向工程文档的 Markdown 管理工作台，支持目录树、源码与分屏预览、思维导图、全文搜索、文档分享，以及 Markdown、HTML、PDF、Word 导出。';

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MarkFlow',
    url: SITE_URL,
    inLanguage: 'zh-CN'
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'MarkFlow',
    url: SITE_URL,
    description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    inLanguage: 'zh-CN'
  }
];

const scenarios = [
  { title: '工程文档', text: '按项目和目录沉淀设计说明、技术方案与研发知识，让 Markdown 文件保持清晰结构。', label: '01' },
  { title: 'ADR 架构决策', text: '使用 ADR 模板记录背景、选项、最终决策与后果，保留架构演进依据。', label: '02' },
  { title: 'RFC 技术提案', text: '围绕动机、详细设计、风险和替代方案组织 RFC，方便评审与持续修订。', label: '03' },
  { title: 'API 接口文档', text: '用统一目录管理接口说明，在源码、预览和脑图视图之间按需切换。', label: '04' }
];

const features = [
  {
    title: '目录树与文档模板',
    text: '通过多级目录组织文档，使用空白、ADR、RFC 或 API 接口模板快速开始，并支持重命名、删除与展开状态记忆。',
    link: '/manual#files',
    linkText: '查看目录与模板用法'
  },
  {
    title: '源码、分屏、预览与脑图',
    text: '在四种视图间切换，使用格式工具栏、自动备份、双向同步滚动和正文锚点，兼顾编写与阅读。',
    link: '/manual#editor',
    linkText: '了解编辑器与视图'
  },
  {
    title: '实时大纲、搜索与分享',
    text: '右侧大纲实时解析标题并高亮阅读位置；可搜索文档标题与正文，也可生成链接分享指定文档。',
    link: '/manual#outline',
    linkText: '查看导航、搜索与分享'
  },
  {
    title: 'Markdown、HTML、PDF、Word 导出',
    text: '按使用场景导出源码或静态文档。HTML 保留锚点和代码复制功能，PDF 支持长文档分页，Word 保留标题与表格等样式。',
    link: '/manual#export',
    linkText: '阅读多格式导出教程'
  }
];

export default function HomePage() {
  const trackCta = (label) => trackEvent('SEO 转化', '点击开始使用', label);

  return (
    <div className={styles.page}>
      <SeoHead title={title} description={description} path="/" structuredData={structuredData} />

      <a className={styles.skipLink} href="#main-content">跳到主要内容</a>
      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand} aria-label="MarkFlow 产品首页">
            <span className={styles.brandMark} aria-hidden="true">M</span>
            <span>MarkFlow</span>
          </Link>
          <nav className={styles.nav} aria-label="主导航">
            <a href="#features">功能</a>
            <Link href="/manual">使用手册</Link>
            <Link href="/about">关于项目</Link>
            <Link href="/dashboard">工作台</Link>
          </nav>
          <Link href="/auth/login" className={styles.navCta} onClick={() => trackCta('home_header')}>
            开始使用
          </Link>
        </div>
      </header>

      <main id="main-content">
        <section className={`${styles.hero} ${styles.container}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>为工程文档而生的 Markdown 工作台</p>
            <h1 id="hero-title"><span className={styles.heroPrimary}>Markdown 文档管理、</span><span>实时预览与多格式导出</span></h1>
            <p className={styles.heroDescription}>
              从目录管理、源码编写到分屏预览、思维导图与文档分享，MarkFlow 将分散的工程知识整理为清晰、可读、可导出的 Markdown 文档。
            </p>
            <div className={styles.actions}>
              <Link href="/auth/login" className={styles.primaryButton} onClick={() => trackCta('home_hero')}>
                开始使用 MarkFlow
              </Link>
              <Link href="/manual" className={styles.secondaryButton}>查看使用手册</Link>
            </div>
            <p className={styles.signupNote}>新邮箱首次登录会自动创建账号，无需单独注册。</p>
            <ul className={styles.heroFacts} aria-label="产品特点">
              <li>个人开源项目</li>
              <li>当前为演示版本</li>
              <li>支持私有部署</li>
            </ul>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.visualLabel}>一个工作台，完成编写、阅读与导出</div>
            <Image
              src="/images/markflow-workbench.webp"
              alt="MarkFlow Markdown 工作台，展示文档目录、编辑区域和实时预览"
              width={1440}
              height={960}
              priority
              sizes="(max-width: 900px) 100vw, 52vw"
              className={styles.workbenchImage}
            />
          </div>
        </section>

        <section className={styles.scenarios} aria-labelledby="scenarios-title">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>适用文档场景</p>
              <h2 id="scenarios-title">让每一类技术内容都有清晰结构</h2>
              <p>沿用团队熟悉的 Markdown 文件，按实际文档类型组织内容，而不是把知识锁在不可迁移的格式里。</p>
            </div>
            <div className={styles.scenarioGrid}>
              {scenarios.map((item) => (
                <article className={styles.scenarioCard} key={item.title}>
                  <span className={styles.cardNumber}>{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className={`${styles.features} ${styles.container}`} aria-labelledby="features-title">
          <div className={styles.sectionHeading}>
            <p className={styles.eyebrow}>核心功能</p>
            <h2 id="features-title">从创建文档到分享导出，流程保持一致</h2>
            <p>每项能力都可在使用手册中找到对应操作步骤与注意事项。</p>
          </div>
          <div className={styles.featureGrid}>
            {features.map((feature, index) => (
              <article className={styles.featureCard} key={feature.title}>
                <span className={styles.featureIndex}>0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
                <Link href={feature.link}>{feature.linkText}<span aria-hidden="true"> →</span></Link>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.workflow} aria-labelledby="workflow-title">
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>三步开始</p>
              <h2 id="workflow-title">从第一次登录到完成一篇文档</h2>
            </div>
            <ol className={styles.steps}>
              <li>
                <span>1</span>
                <div><h3>登录并自动创建账号</h3><p>输入新邮箱和访问凭据，首次登录时自动完成账号创建。</p></div>
              </li>
              <li>
                <span>2</span>
                <div><h3>选择目录和模板</h3><p>在合适的目录中新建文档，从空白、ADR、RFC 或 API 模板开始。</p></div>
              </li>
              <li>
                <span>3</span>
                <div><h3>编辑预览，然后分享或导出</h3><p>使用熟悉的视图完成内容，按需生成分享链接或导出目标格式。</p></div>
              </li>
            </ol>
          </div>
        </section>

        <section className={`${styles.finalCta} ${styles.container}`} aria-labelledby="final-cta-title">
          <div>
            <p className={styles.eyebrow}>开始整理下一篇文档</p>
            <h2 id="final-cta-title">把工程知识留在清晰、可迁移的 Markdown 中</h2>
            <p>先体验真实工作台，再根据需要阅读完整手册或了解私有部署。</p>
          </div>
          <div className={styles.actions}>
            <Link href="/auth/login" className={styles.primaryButton} onClick={() => trackCta('home_final')}>
              开始使用 MarkFlow
            </Link>
            <Link href="/manual" className={styles.secondaryButton}>先阅读使用手册</Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div>
            <Link href="/" className={styles.brand}><span className={styles.brandMark} aria-hidden="true">M</span><span>MarkFlow</span></Link>
            <p>© 2026-2028 个人开源项目 · 作者：小洪 · 当前为演示版本 · 如需私有部署，请联系作者。</p>
          </div>
          <nav aria-label="页脚导航">
            <Link href="/manual">使用手册</Link>
            <Link href="/about">关于项目</Link>
            <Link href="/dashboard">进入工作台</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
