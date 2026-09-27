import { SET_PROJECTS, SET_SEARCH_QUERY, ADD_PROJECT, UPDATE_PROJECT, DELETE_PROJECT } from '../../actionTypes';

export const setProjects = (projects) => ({
  type: SET_PROJECTS,
  payload: projects,
});

export const setSearchQuery = (query) => ({
  type: SET_SEARCH_QUERY,
  payload: query,
});

export const addProject = (project) => ({
  type: ADD_PROJECT,
  payload: project,
});

export const updateProject = (project) => ({
  type: UPDATE_PROJECT,
  payload: project,
});

export const deleteProject = (projectId) => ({
  type: DELETE_PROJECT,
  payload: projectId,
});
