import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  activeNavItem: 'files',
  expandedNodes: ['doc-space', 'architecture', 'api-specs', 'bookmarks'],
  activeDocument: {
    id: null,
    title: '',
    status: '',
    tags: [],
    author: '',
    date: '',
    reviewersCount: 0,
  },
  activeTab: 'source', // 'source', 'split', 'preview'
  isSyncScroll: true,
  treeNodes: [], // 扁平化目录树数据
  documentSource: '', // 当前文档的 Markdown 源码（由编辑器同步，供右侧大纲解析）
  headingNavigation: null, // 标题跳转事件 { line, index, nonce }
  bookmarks: [], // 书签数据
  filesCount: 0,
  tagsCount: 0,
};

export const layoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleLeftSidebar: (state) => {
      state.isLeftSidebarOpen = !state.isLeftSidebarOpen;
    },
    toggleRightSidebar: (state) => {
      state.isRightSidebarOpen = !state.isRightSidebarOpen;
    },
    setActiveNavItem: (state, action) => {
      state.activeNavItem = action.payload;
    },
    toggleNodeExpansion: (state, action) => {
      const nodeId = action.payload;
      if (state.expandedNodes.includes(nodeId)) {
        state.expandedNodes = state.expandedNodes.filter(id => id !== nodeId);
      } else {
        state.expandedNodes.push(nodeId);
      }
    },
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    toggleSyncScroll: (state) => {
      state.isSyncScroll = !state.isSyncScroll;
    },
    setPreferences: (state, action) => {
      const { activeNavItem, expandedNodes, isLeftSidebarOpen, filesCount, tagsCount } = action.payload;
      if (activeNavItem !== undefined) state.activeNavItem = activeNavItem;
      if (expandedNodes !== undefined) state.expandedNodes = expandedNodes;
      if (isLeftSidebarOpen !== undefined) state.isLeftSidebarOpen = isLeftSidebarOpen;
      if (filesCount !== undefined) state.filesCount = filesCount;
      if (tagsCount !== undefined) state.tagsCount = tagsCount;
    },
    setTreeNodes: (state, action) => {
      state.treeNodes = action.payload;
    },
    addTreeNodes: (state, action) => {
      const newNodes = action.payload.filter(
        newNode => !state.treeNodes.some(existing => existing.id === newNode.id)
      );
      state.treeNodes = [...state.treeNodes, ...newNodes];
    },
    setBookmarks: (state, action) => {
      state.bookmarks = action.payload;
    },
    setDocumentSource: (state, action) => {
      state.documentSource = action.payload;
    },
    navigateToHeading: (state, action) => {
      state.headingNavigation = action.payload;
    },
    updateDocumentTitle: (state, action) => {
      state.activeDocument.title = action.payload;
    },
    updateDocumentStatus: (state, action) => {
      state.activeDocument.status = action.payload;
    },
    setActiveDocument: (state, action) => {
      state.activeDocument = { ...state.activeDocument, ...action.payload };
    },
    addDocumentTag: (state, action) => {
      if (!state.activeDocument.tags.includes(action.payload)) {
        state.activeDocument.tags.push(action.payload);
      }
    },
    removeDocumentTag: (state, action) => {
      state.activeDocument.tags = state.activeDocument.tags.filter(
        (tag) => tag !== action.payload
      );
    }
  },
});

export const {
  toggleLeftSidebar,
  toggleRightSidebar,
  setActiveNavItem,
  toggleNodeExpansion,
  setActiveTab,
  toggleSyncScroll,
  setPreferences,
  setTreeNodes,
  addTreeNodes,
  setBookmarks,
  setDocumentSource,
  navigateToHeading,
  updateDocumentTitle,
  updateDocumentStatus,
  setActiveDocument,
  addDocumentTag,
  removeDocumentTag
} = layoutSlice.actions;

export default layoutSlice.reducer;
