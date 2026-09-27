import React from 'react';
import { 
  FileText, Bold, Italic, Heading1, Code, Link as LinkIcon, 
  Image as ImageIcon, CheckSquare, Table, Sigma, AlignLeft, Eye, Download,
  Maximize2, Zap, Check, Clock, User, AlertTriangle, ChevronDown
} from 'lucide-react';
import styles from '../../pages/index.module.css';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab } from '../../store/slices/layoutSlice';

const Copy = ({ size, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

export const EditorArea = () => {
  const dispatch = useDispatch();
  const { activeTab, isSyncScroll, activeDocument } = useSelector(state => state.layout);

  return (
    <div className={styles.editorArea}>
      {/* Editor Toolbar */}
      <div className={styles.editorToolbar}>
        <div className={styles.toolbarGroup}>
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn} ${activeTab === 'source' ? styles.active : ''}`}
            onClick={() => dispatch(setActiveTab('source'))}
          >
            <AlignLeft size={14} /> 纯源码
          </div>
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn} ${activeTab === 'split' ? styles.active : ''}`}
            onClick={() => dispatch(setActiveTab('split'))}
          >
            <Maximize2 size={14} /> 分屏对齐
          </div>
          <div 
            className={`${styles.toolbarBtn} ${styles.textBtn} ${activeTab === 'preview' ? styles.active : ''}`}
            onClick={() => dispatch(setActiveTab('preview'))}
          >
            <Eye size={14} /> 只读渲染
          </div>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.toolbarGroup}>
          <div className={styles.toolbarBtn}><Bold size={14} /></div>
          <div className={styles.toolbarBtn}><Italic size={14} /></div>
          <div className={styles.toolbarBtn}><Heading1 size={14} /></div>
          <div className={styles.toolbarBtn}><Code size={14} /></div>
          <div className={styles.toolbarBtn}><LinkIcon size={14} /></div>
          <div className={styles.toolbarBtn}><ImageIcon size={14} /></div>
          <div className={styles.toolbarBtn}><CheckSquare size={14} /></div>
          <div className={styles.toolbarBtn}><Table size={14} /></div>
          <div className={styles.toolbarBtn}><Sigma size={14} /></div>
        </div>

        <div style={{ flex: 1 }} />

        <div className={styles.toolbarGroup}>
          <div className={`${styles.toolbarBtn} ${styles.textBtn}`} style={{ fontSize: 12 }}>
            双向同步滚动: <span style={{ color: isSyncScroll ? '#10b981' : '#94a3b8' }}>{isSyncScroll ? '开' : '关'}</span>
          </div>
          <div className={styles.toolbarDivider} />
          <div className={`${styles.toolbarBtn} ${styles.textBtn}`} style={{ fontSize: 12 }}>
            <Code size={14} /> 元数据 (YAML)
          </div>
          <div className={styles.toolbarDivider} />
          <div className={`${styles.toolbarBtn} ${styles.textBtn}`} style={{ fontSize: 12 }}>
            <Download size={14} /> 导出 <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* Split Panes */}
      <div className={styles.editorSplit}>
        
        {/* Left Pane: Source */}
        {(activeTab === 'source' || activeTab === 'split') && (
          <div className={`${styles.editorPane} ${styles.sourcePane}`}>
            <div className={styles.paneHeader}>
              <div className={styles.paneTitle}>
                <FileText size={14} color="#3b82f6" /> {activeDocument.title}
                <span className={styles.statusBadge} style={{ backgroundColor: '#fef08a', color: '#854d0e' }}>已自动备份</span>
              </div>
              <div>Ln 28, Col 42 &nbsp;&nbsp; LF &nbsp;&nbsp; UTF-8</div>
            </div>
            <div className={styles.paneContent} style={{ padding: '16px 0', backgroundColor: '#fdfdfd' }}>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>24</div><div className={styles.lineContent}></div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>25</div><div className={styles.lineContent}>生产环境存储网关集群必须在双可用区部署，同时要求元数据存储层采用 Raft 一致性协议以避免脑裂情况发生。</div></div>
              
              {/* AI Widget inside source */}
              <div className={styles.aiWidget}>
                <div className={styles.aiHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Zap size={14} fill="#4338ca" /> AI 智能架构润色 (CLAUDE 3.5 SONNET) <span style={{ backgroundColor: '#e0e7ff', padding: '2px 6px', borderRadius: 4, fontSize: 10 }}>语义增强</span>
                  </div>
                  <div>置信度 99.4%</div>
                </div>
                <div className={styles.aiContent}>
                  <div className={styles.aiDiff}>- 生产环境存储网关集群必须在双可用区部署，同时要求元数据存储层采用 Raft 一致性协议以避免脑裂情况发生。</div>
                  <div className={styles.aiAdd}>+ 在生产环境中，对象存储网关节点必须实施跨双可用区 (Multi-AZ) 高可用冗余；元数据共识层需严格基于 Raft 分布式一致性协议构建，确保主备切换判定在 300ms 内收敛且彻底根除脑裂 (Split-Brain) 风险。</div>
                </div>
                <div className={styles.aiActions}>
                  <div className={`${styles.aiBtn} ${styles.discard}`}>放弃建议 (Discard)</div>
                  <div className={`${styles.aiBtn} ${styles.insert}`}>在下方插入 (Insert)</div>
                  <div className={`${styles.aiBtn} ${styles.replace}`}><Check size={12} style={{ display: 'inline', marginRight: 4 }}/>替换原内容 (Replace)</div>
                </div>
              </div>

              <div className={styles.sourceLine}><div className={styles.lineNumber}>26</div><div className={styles.lineContent}></div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>27</div><div className={styles.lineContent}>## 4. 存储集群健康探测代码实现</div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>28</div><div className={styles.lineContent}>```go</div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>29</div><div className={styles.lineContent}>package main</div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>30</div><div className={styles.lineContent}></div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>31</div><div className={styles.lineContent}>import (</div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>32</div><div className={styles.lineContent}>  "context"</div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>33</div><div className={styles.lineContent}>  "github.com/minio/minio-go/v7"</div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>34</div><div className={styles.lineContent}>)</div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>35</div><div className={styles.lineContent}></div></div>
              <div className={styles.sourceLine}><div className={styles.lineNumber}>36</div><div className={styles.lineContent}>func VerifyClusterHealth(endpoint string) bool {'{'}</div></div>
            </div>
          </div>
        )}

        {/* Right Pane: Preview */}
        {(activeTab === 'preview' || activeTab === 'split') && (
          <div className={styles.editorPane}>
            <div className={styles.paneHeader}>
              <div className={styles.paneTitle}>
                <Eye size={14} color="#10b981" /> 实时排版预览 (Live HTML Output)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></div>
                阅读宽度: 800px 最佳视野
              </div>
            </div>
            <div className={styles.paneContent}>
              <div className={styles.previewContent}>
                <div className={styles.previewBadge}>ADR 标准规范</div> <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 8 }}>版本 v2.4</span>
                
                <h1>{activeDocument.title.replace('.md', '')}</h1>
                
                <div className={styles.previewMeta}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} /> {activeDocument.author}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {activeDocument.date}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3b82f6' }}><CheckSquare size={14} /> {activeDocument.reviewersCount} 位架构师同行评审中</span>
                </div>

                <div className={styles.alertBox}>
                  <div className={styles.alertTitle}><AlertTriangle size={16} /> 生产环境高可用核心红线准则</div>
                  <div className={styles.alertText}>
                    注意：存储网关与底层纠删码存储池必须部署于跨可用区（Multi-AZ）硬件机柜，核心元数据同步通道严禁共用业务公网，务必配置专用私有链路保证 RTT {'<'} 2ms。
                  </div>
                </div>

                <h2><span style={{ backgroundColor: '#1e40af', color: 'white', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 14 }}>1</span> 选型评估决策矩阵 (Comparison Matrix)</h2>
                
                <p style={{ fontSize: 14, color: '#4b5563', marginBottom: 16 }}>针对当前平台日益增长的大型工程模型资产与 Git LFS 仓库二进制大文件存储需求，技术委员会对业界主流存储引擎进行了多维度指标压测对比：</p>

                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>评估维度</th>
                      <th>MINIO 分布式集群</th>
                      <th>CEPH RADOS</th>
                      <th>公有云 S3 原生</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>S3 API 兼容度</strong></td>
                      <td>99.8% (近乎原生)</td>
                      <td>92.0% (RGW网关)</td>
                      <td>100% (标准定义)</td>
                    </tr>
                    <tr>
                      <td><strong>运维复杂度</strong></td>
                      <td>低 (单二进制部署)</td>
                      <td><span style={{ color: '#dc2626' }}>高 (需专业存储运维)</span></td>
                      <td>极低 (全托管免运维)</td>
                    </tr>
                    <tr>
                      <td><strong>内网传输性能</strong></td>
                      <td>1.4 GB/s (4x 25G 网卡)</td>
                      <td>1.1 GB/s</td>
                      <td>受限于云专线带宽</td>
                    </tr>
                    <tr>
                      <td><strong>私有化合规</strong></td>
                      <td>完全自控 (AGPLv3)</td>
                      <td>完全自控 (LGPL)</td>
                      <td><span style={{ color: '#dc2626' }}>数据出境审查风险</span></td>
                    </tr>
                  </tbody>
                </table>

                <h2><span style={{ backgroundColor: '#1e40af', color: 'white', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 14 }}>2</span> 核心探测节点探针代码 (Go 1.22)</h2>
                
                <div className={styles.codeBlock}>
                  <div className={styles.codeHeader}>
                    <div>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', marginRight: 6 }}></span>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f59e0b', marginRight: 6 }}></span>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981', marginRight: 12 }}></span>
                      pkg/storage/probe.go
                    </div>
                    <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Copy size={12} /> 复制代码</div>
                  </div>
                  <div className={styles.codeContent}>
<span className={styles.kw}>package</span> main

<span className={styles.kw}>import</span> (
<span className={styles.str}>"context"</span>
<span className={styles.str}>"github.com/minio/minio-go/v7"</span>
)

<span className={styles.comment}>// VerifyClusterHealth 探测双AZ存储端点实时健康心跳</span>
<span className={styles.kw}>func</span> VerifyClusterHealth(endpoint <span className={styles.kw}>string</span>) <span className={styles.kw}>bool</span> {'{'}
ctx := context.Background()
client, err := minio.New(endpoint, &minio.Options{'{'}Secure: <span className={styles.kw}>true</span>{'}'})
<span className={styles.kw}>if</span> err != <span className={styles.kw}>nil</span> {'{'}
  <span className={styles.kw}>return</span> <span className={styles.kw}>false</span>
{'}'}
<span className={styles.kw}>return</span> client.IsOnline(ctx)
{'}'}
                  </div>
                </div>

                <h2><span style={{ backgroundColor: '#1e40af', color: 'white', width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: 14 }}>3</span> 落地推进计划与检查清单 (Action Items)</h2>
                
                <ul className={styles.taskList}>
                  <li className={styles.taskItem}>
                    <input type="checkbox" checked readOnly />
                    <span style={{ textDecoration: 'line-through', color: '#6b7280' }}>[已完成] 完成双可用区专网物理专线链路延迟压测 (均值 1.2ms)</span>
                  </li>
                  <li className={styles.taskItem}>
                    <input type="checkbox" checked readOnly />
                    <span style={{ textDecoration: 'line-through', color: '#6b7280' }}>[已完成] 验证 Git LFS 客户端 4GB 大文件断点续传能力</span>
                  </li>
                  <li className={styles.taskItem}>
                    <input type="checkbox" readOnly />
                    <span>[待执行] 完成生产灰度集群跨区仲裁 Raft 演练</span>
                  </li>
                  <li className={styles.taskItem}>
                    <input type="checkbox" readOnly />
                    <span>[待执行] 对接中央审计平台自动化日志审计管道</span>
                  </li>
                </ul>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
