import {
  Document, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle
} from 'docx';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { gfm } from 'micromark-extension-gfm';

// 与只读渲染一致的颜色与字号（docx 字号为半点，px * 0.75 * 2 = px * 1.5）
const COLOR_TEXT = '0B1C30';
const COLOR_MUTED = '64748B';
const COLOR_LINK = '2563EB';
const COLOR_CODE = 'C53030';
const COLOR_BORDER = 'DCE9FF';
const FONT_TEXT = 'Segoe UI';
const FONT_MONO = 'Consolas';
const SIZE_BODY = 21; // 14px
const SIZE_H1 = 48; // 32px
const SIZE_H2 = 30; // 20px
const SIZE_H3 = 24; // 16px
const SIZE_CODE = 20; // 13.5px

const clearShading = (fill) => ({ type: ShadingType.CLEAR, fill });
const border = (color = COLOR_BORDER, size = 4) => ({ style: BorderStyle.SINGLE, size, color, space: 0 });

// 行内节点 -> TextRun（支持加粗/斜体/删除线/行内代码/链接/图片）
function inlineRuns(nodes, inherited = {}) {
  const runs = [];
  const makeRun = (text) => new TextRun({
    text,
    font: FONT_TEXT,
    size: inherited.size || SIZE_BODY,
    color: inherited.color || COLOR_TEXT,
    bold: inherited.bold,
    italics: inherited.italics,
    strike: inherited.strike
  });

  for (const node of nodes || []) {
    switch (node.type) {
      case 'text':
        runs.push(makeRun(node.value));
        break;
      case 'strong':
        runs.push(...inlineRuns(node.children, { ...inherited, bold: true }));
        break;
      case 'emphasis':
        runs.push(...inlineRuns(node.children, { ...inherited, italics: true }));
        break;
      case 'delete':
        runs.push(...inlineRuns(node.children, { ...inherited, strike: true }));
        break;
      case 'inlineCode':
        runs.push(new TextRun({
          text: node.value,
          font: FONT_MONO,
          size: inherited.size || SIZE_BODY,
          color: COLOR_CODE,
          shading: clearShading('F1F5F9')
        }));
        break;
      case 'link':
        runs.push(...inlineRuns(node.children, { ...inherited, color: COLOR_LINK }));
        break;
      case 'break':
        runs.push(new TextRun({ break: 1 }));
        break;
      case 'image':
        runs.push(new TextRun({ text: `[图片: ${node.alt || node.url || ''}]`, font: FONT_TEXT, size: SIZE_BODY, color: COLOR_MUTED }));
        break;
      case 'html':
        break;
      default:
        if (node.children) runs.push(...inlineRuns(node.children, inherited));
    }
  }
  return runs;
}

function headingParagraph(node) {
  const level = node.depth;
  const size = level === 1 ? SIZE_H1 : level === 2 ? SIZE_H2 : SIZE_H3;
  return new Paragraph({
    children: inlineRuns(node.children, { size, bold: level <= 2 }),
    spacing: { before: level === 1 ? 0 : 240, after: 160 },
    // 预览中 h2 带蓝色竖条，用左边框近似还原
    border: level === 2 ? { left: { style: BorderStyle.SINGLE, size: 24, color: '30568B', space: 8 } } : undefined
  });
}

function codeBlock(node) {
  const lang = node.lang || 'code';
  const lines = (node.value || '').split('\n');
  return [
    // 深色头部（语言名），与预览的 codeHeader 对应
    new Paragraph({
      children: [new TextRun({ text: lang, font: FONT_MONO, size: SIZE_CODE, color: 'C3C6D1' })],
      shading: clearShading('213145'),
      spacing: { before: 120, after: 0 },
      indent: { left: 160 }
    }),
    new Paragraph({
      children: lines.map((line, i) => new TextRun({
        text: line || ' ',
        font: FONT_MONO,
        size: SIZE_CODE,
        color: COLOR_TEXT,
        ...(i < lines.length - 1 ? { break: 1 } : {})
      })),
      shading: clearShading('FFFFFF'),
      border: { top: border(), bottom: border(), left: border(), right: border() },
      spacing: { before: 0, after: 240 },
      indent: { left: 160 }
    })
  ];
}

function listItems(node, ordered, level = 0) {
  const blocks = [];
  let index = node.start || 1;
  for (const item of node.children || []) {
    const isTask = item.checked !== null && item.checked !== undefined;
    const marker = isTask ? (item.checked ? '☑ ' : '☐ ') : ordered ? `${index++}. ` : '• ';
    const firstParagraph = item.children.find(c => c.type === 'paragraph');
    blocks.push(new Paragraph({
      children: [new TextRun({ text: marker, font: FONT_TEXT, size: SIZE_BODY, color: COLOR_TEXT }),
        ...inlineRuns(firstParagraph ? firstParagraph.children : [])],
      spacing: { after: 80 },
      indent: { left: 360 + level * 360 }
    }));
    // 嵌套列表
    for (const child of item.children) {
      if (child.type === 'list') {
        blocks.push(...listItems(child, child.ordered, level + 1));
      }
    }
  }
  return blocks;
}

function tableBlock(node) {
  const rows = (node.children || []).map((row, rowIndex) => new TableRow({
    children: (row.children || []).map(cell => new TableCell({
      children: [new Paragraph({
        children: inlineRuns(cell.children, rowIndex === 0 ? { bold: true } : {})
      })],
      shading: rowIndex === 0 ? clearShading('EFF4FF') : undefined,
      margins: { top: 140, bottom: 140, left: 160, right: 160 }
    }))
  }));
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: border(), bottom: border(), left: border(), right: border(),
      insideHorizontal: border(), insideVertical: border()
    }
  });
}

function blockElements(nodes, inBlockquote = false) {
  const blocks = [];
  for (const node of nodes || []) {
    const quoteStyle = inBlockquote ? {
      shading: clearShading('FDF6EF'),
      border: { left: { style: BorderStyle.SINGLE, size: 24, color: 'B45309', space: 8 } }
    } : {};
    switch (node.type) {
      case 'heading':
        blocks.push(headingParagraph(node));
        break;
      case 'paragraph':
        blocks.push(new Paragraph({
          children: inlineRuns(node.children),
          spacing: { after: 160 },
          ...quoteStyle
        }));
        break;
      case 'code':
        blocks.push(...codeBlock(node));
        break;
      case 'blockquote':
        blocks.push(...blockElements(node.children, true));
        break;
      case 'list':
        blocks.push(...listItems(node, node.ordered));
        break;
      case 'table':
        blocks.push(tableBlock(node));
        break;
      case 'thematicBreak':
        blocks.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0', space: 1 } }, spacing: { after: 240 } }));
        break;
      case 'html':
      case 'yaml':
        break;
      default:
        if (node.children) blocks.push(...blockElements(node.children, inBlockquote));
    }
  }
  return blocks;
}

// 去掉 YAML frontmatter，避免被当成正文导出
function stripFrontmatter(source) {
  const lines = String(source || '').split('\n');
  if (lines[0] && lines[0].trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---' || lines[i].trim() === '...') {
        return lines.slice(i + 1).join('\n');
      }
    }
  }
  return String(source || '');
}

export function createDocx(markdown) {
  const tree = fromMarkdown(stripFrontmatter(markdown), {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()]
  });
  return new Document({
    creator: 'MarkFlow',
    styles: {
      default: {
        document: {
          run: { font: FONT_TEXT, size: SIZE_BODY, color: COLOR_TEXT }
        }
      }
    },
    sections: [{
      properties: {},
      children: blockElements(tree.children)
    }]
  });
}
