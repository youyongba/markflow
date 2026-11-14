import React from 'react';
import Head from 'next/head';

const colors = {
  text: '#0b1c30',
  secondary: '#475569',
  muted: '#94a3b8',
  border: '#e2e8f0',
  accent: '#30568b',
  bg: '#f8fafc'
};

const Section = ({ id, title, children }) => (
  <section id={id} style={{ marginBottom: 36 }}>
    <h2 style={{ fontSize: 20, fontWeight: 600, color: colors.text, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ display: 'inline-block', width: 6, height: 16, borderRadius: 9999, backgroundColor: colors.accent }} />
      {title}
    </h2>
    <div style={{ fontSize: 14, lineHeight: 1.9, color: colors.secondary }}>{children}</div>
  </section>
);

const Item = ({ title, children }) => (
  <div style={{ marginBottom: 12 }}>
    <strong style={{ color: colors.text, fontWeight: 600 }}>{title}</strong>
    <div>{children}</div>
  </div>
);

export default function Manual() {
  return (
    <div style={{ height: '100vh', overflowY: 'auto', backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <Head>
        <title>使用手册 - MarkFlow</title>
      </Head>

      {/* 顶部导航 */}
      <div style={{ height: 56, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', position: 'sticky', top: 0, backgroundColor: '#ffffff', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, backgroundColor: '#4f46e5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <span style={{ fontSize: 14, fontWeight: 'bold' }}>M</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 15, color: colors.text }}>MarkFlow 使用手册</span>
        </div>
        <a href="/" style={{ fontSize: 13, color: '#2563eb', textDecoration: 'none' }}>← 返回工作台</a>
      </div>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '36px 32px 64px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: colors.text, marginBottom: 12 }}>用户使用手册</h1>
        <p style={{ fontSize: 14, color: colors.secondary, lineHeight: 1.8, marginBottom: 28 }}>
          MarkFlow 是一个面向工程文档的 Markdown 管理工作台，支持目录树管理、源码与实时预览、文档结构导航以及多格式导出。本手册基于当前版本的功能编写。
        </p>

        {/* 目录 */}
        <div style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 36, fontSize: 14, lineHeight: 2 }}>
          <strong style={{ color: colors.text }}>本页目录</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', marginTop: 6 }}>
            <a href="#start" style={{ color: '#2563eb', textDecoration: 'none' }}>1. 快速开始</a>
            <a href="#files" style={{ color: '#2563eb', textDecoration: 'none' }}>2. 文档与目录管理</a>
            <a href="#editor" style={{ color: '#2563eb', textDecoration: 'none' }}>3. 编辑器与视图</a>
            <a href="#outline" style={{ color: '#2563eb', textDecoration: 'none' }}>4. 右侧导航目录</a>
            <a href="#search" style={{ color: '#2563eb', textDecoration: 'none' }}>5. 搜索与分享</a>
            <a href="#export" style={{ color: '#2563eb', textDecoration: 'none' }}>6. 导出格式说明</a>
            <a href="#faq" style={{ color: '#2563eb', textDecoration: 'none' }}>7. 常见问题</a>
          </div>
        </div>

        <Section id="start" title="1. 快速开始">
          <Item title="登录">在登录页输入工作邮箱和访问凭据即可进入工作台，首次使用的新邮箱会自动注册账号。</Item>
          <Item title="界面布局">左侧是目录树，中间是编辑区，顶部是搜索与操作栏，右侧是文档的导航目录。左右侧栏都可以折叠，获得更大的编辑空间。</Item>
        </Section>

        <Section id="files" title="2. 文档与目录管理">
          <Item title="新建目录">点击左侧"目录树结构"右侧的 + 可新建根目录；把鼠标移到某个目录上，点击目录行的 + 可在其下新建子目录，支持多级嵌套。</Item>
          <Item title="新建文档">点击顶栏"新建文档"，输入文档名称（可自动补全 .md 后缀），选择存储目录（下拉会列出全部层级的目录及完整路径）和模板（空白、ADR、RFC、API 接口），点击"立即创建"。创建成功后目录树会自动展开到对应位置。</Item>
          <Item title="重命名与删除">鼠标悬停在目录或文档上，使用行内的编辑、删除图标。删除目录会同时删除其中内容，请谨慎操作。</Item>
          <Item title="展开与折叠">点击目录名展开或折叠子节点，展开状态会被记住，刷新后保持不变。</Item>
        </Section>

        <Section id="editor" title="3. 编辑器与视图">
          <Item title="四种视图">工具栏左侧可切换：纯源码、分屏对齐（左源码右预览）、只读渲染（纯预览）、解析脑图（把标题结构渲染为思维导图）。</Item>
          <Item title="自动保存">编辑内容会防抖自动备份，源码区顶部显示最近备份时间，无需手动保存。</Item>
          <Item title="格式工具栏">支持加粗、斜体、删除线、一到六级标题、引用、代码、链接、图片、无序/有序列表、任务列表、表格、分割线和数学公式。</Item>
          <Item title="双向同步滚动">分屏模式下，左右两栏按比例同步滚动，可在工具栏右侧开关。点击导航目录或锚点跳转时会自动暂停同步，避免定位被覆盖。</Item>
          <Item title="正文锚点">预览中类似 [章节名](#章节名) 的锚点链接，点击可平滑滚动到对应标题，支持 GitHub 风格的 slug 规则和被截断的锚点。</Item>
        </Section>

        <Section id="outline" title="4. 右侧导航目录">
          <Item title="实时大纲">右侧面板实时解析当前文档的 # ～ ###### 标题，按层级缩进展示，自动跳过 YAML frontmatter 和代码块中的 # 行。</Item>
          <Item title="点击跳转">点击大纲条目：预览/分屏模式平滑滚动到对应标题；纯源码模式定位并选中标题行；脑图模式会先切换到预览再定位。</Item>
          <Item title="阅读高亮">滚动预览时，大纲会高亮当前阅读位置所在的标题（橙色）。</Item>
          <Item title="折叠面板">点击"导航目录"左侧的图标可隐藏面板；隐藏后顶栏最右侧会出现同样的图标，点击即可恢复。</Item>
        </Section>

        <Section id="search" title="5. 搜索与分享">
          <Item title="全局搜索">在顶栏搜索框输入关键词并回车，可搜索文档标题与内容，点击结果直接打开对应文档。</Item>
          <Item title="分享文档">打开文档后点击"分享"生成分享链接，复制后发送给同事即可。分享前需要先选中一个文档。</Item>
        </Section>

        <Section id="export" title="6. 导出格式说明">
          <p style={{ marginBottom: 14 }}>工具栏"导出"菜单支持四种格式，视觉样式均以只读渲染为准：</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, border: `1px solid ${colors.border}` }}>
            <thead>
              <tr style={{ backgroundColor: '#eff4ff' }}>
                {['格式', '版式', '锚点跳转', '复制代码'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', borderBottom: `1px solid ${colors.border}`, color: colors.text }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Markdown (.md)', '纯源码', '—', '—'],
                ['HTML 包 (.html)', '与只读渲染一致', '支持，点击跳转', '支持，按钮可复制'],
                ['PDF (.pdf)', '与只读渲染一致，自动分页', '支持，阅读器内跳转', '按钮已隐藏（PDF 无法执行脚本）'],
                ['Word (.docx)', '标题/表格/代码块等样式对齐', '支持，书签 + 内部链接', '无按钮，请选中代码复制']
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '10px 12px', borderBottom: `1px solid ${colors.border}`, color: j === 0 ? colors.text : colors.secondary, fontWeight: j === 0 ? 600 : 400 }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ marginTop: 12, color: colors.muted, fontSize: 13 }}>提示：PDF 和 Word 都是静态文档格式，不能执行 JavaScript，因此"复制代码"按钮只在 HTML 包中可用。</p>
        </Section>

        <Section id="faq" title="7. 常见问题">
          <Item title="导出后样式或内容有变化？">请重新导出。旧文件不会随功能更新自动变化，导出 HTML/PDF/Word 时均以当前预览样式为准。</Item>
          <Item title="目录展开后看不到文档？">尝试先折叠再展开目录。新建、重命名文档后目录树会整树刷新，已展开的层级会保留。</Item>
          <Item title="导出 PDF 只有一页？">该问题已修复：导出时会重置页面高度限制，长文档会按 A4 自动分页。</Item>
          <Item title="如何反馈问题？">请联系工作区管理员，并附上文档名称、操作步骤和截图。</Item>
        </Section>

        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 20, fontSize: 13, color: colors.muted }}>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>← 返回工作台</a>
        </div>
      </div>
    </div>
  );
}
