import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLeftSidebarOpen: true,
  isRightSidebarOpen: true,
  activeDocument: {
    title: 'ADR-004-分布式存储架构与高可用设计',
    status: 'In-Review',
    tags: ['architecture', 'storage', 's3'],
    author: 'Alex Chen (系统架构组)',
    date: '2025-02-28',
    reviewersCount: 3,
  },
  activeTab: 'source', // 'source', 'split', 'preview'
  isSyncScroll: true,
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
    setActiveTab: (state, action) => {
      state.activeTab = action.payload;
    },
    toggleSyncScroll: (state) => {
      state.isSyncScroll = !state.isSyncScroll;
    },
    updateDocumentTitle: (state, action) => {
      state.activeDocument.title = action.payload;
    },
    updateDocumentStatus: (state, action) => {
      state.activeDocument.status = action.payload;
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
  setActiveTab,
  toggleSyncScroll,
  updateDocumentTitle,
  updateDocumentStatus,
  addDocumentTag,
  removeDocumentTag,
} = layoutSlice.actions;

export default layoutSlice.reducer;
