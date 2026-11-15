import React from 'react';
import Link from 'next/link';
import SeoHead from '../../components/seo/SeoHead';
import styles from '../../styles/landing.module.css';

const title = '关于 MarkFlow｜个人开源 Markdown 工程文档项目';
const description = '了解 MarkFlow 的产品定位、当前演示版本、个人开源项目背景与作者小洪，以及 Markdown 工程文档工作台的使用和私有部署交流入口。';

export default function About() {
  return (
    <div className={styles.page}>
      <SeoHead title={title} description={description} path="/about" />

      <header className={styles.header}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand} aria-label="MarkFlow 产品首页">
            <span className={styles.brandMark} aria-hidden="true">M</span>
            <span>MarkFlow</span>
          </Link>
          <nav className={styles.nav} aria-label="主导航">
            <Link href="/">产品首页</Link>
            <Link href="/manual">使用手册</Link>
            <Link href="/dashboard">工作台</Link>
          </nav>
          <Link href="/auth/login" className={styles.navCta}>开始使用</Link>
        </div>
      </header>

      <main className={`${styles.container} ${styles.prose}`}>
        <p className={styles.eyebrow}>ABOUT MARKFLOW</p>
        <h1>关于 MarkFlow</h1>
        <p className={styles.aboutLead}>一个面向工程文档的 Markdown 管理工作台，让技术内容保持清晰结构、方便阅读，并能迁移为常用文档格式。</p>

        <section aria-labelledby="position-title">
          <h2 id="position-title">为什么做这个产品</h2>
          <p>工程团队会持续产生技术方案、ADR、RFC 和 API 接口说明。MarkFlow 以 Markdown 文件为内容基础，提供目录树、文档模板、源码与分屏预览、思维导图、全文搜索、文档分享和多格式导出，帮助作者在同一工作台完成编写与整理。</p>
          <p>产品不试图替代所有协作平台，也不把文档锁在专有格式中。你可以从<Link href="/manual">使用手册</Link>查看每项能力的真实操作方式与当前限制。</p>
        </section>

        <section aria-labelledby="project-title">
          <h2 id="project-title">个人开源项目与当前版本</h2>
          <p>MarkFlow 是由作者<strong>小洪</strong>维护的个人开源项目，作者联系名为小洪。网站当前提供的是<strong>演示版本</strong>，页面中的功能说明以现有实现为准，不代表商业服务等级、数据保留或可用性承诺。</p>
          <p>演示环境适合体验文档管理流程。用于真实团队资料前，请先评估数据安全、备份、访问控制和部署要求。</p>
        </section>

        <section aria-labelledby="deployment-title">
          <h2 id="deployment-title">私有部署与项目交流</h2>
          <p>如需交流私有部署、项目使用或功能问题，请联系作者小洪。也可以前往登录页查看微信交流群二维码，与现有用户交流使用经验。</p>
          <p>在反馈问题时，建议附上使用的版本、复现步骤、浏览器信息和必要的界面截图；请勿在公开交流中发送密码、Token 或私人文档内容。</p>
        </section>

        <section aria-labelledby="start-title">
          <h2 id="start-title">继续了解或直接体验</h2>
          <p>先阅读完整教程，或登录工作台创建一篇 Markdown 文档。新邮箱首次登录会自动创建账号。</p>
          <div className={styles.actions}>
            <Link href="/auth/login" className={styles.primaryButton}>开始使用 MarkFlow</Link>
            <Link href="/manual" className={styles.secondaryButton}>阅读使用手册</Link>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.container} ${styles.footerInner}`}>
          <div>
            <Link href="/" className={styles.brand}><span className={styles.brandMark} aria-hidden="true">M</span><span>MarkFlow</span></Link>
            <p>© 2026-2028 个人开源项目 · 作者：小洪 · 当前为演示版本 · 如需私有部署，请联系作者。</p>
          </div>
          <nav aria-label="页脚导航"><Link href="/">产品首页</Link><Link href="/manual">使用手册</Link><Link href="/dashboard">进入工作台</Link></nav>
        </div>
      </footer>
    </div>
  );
}
