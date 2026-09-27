import { SET_PROJECTS, SET_SEARCH_QUERY, ADD_PROJECT, UPDATE_PROJECT, DELETE_PROJECT } from '../../actionTypes';

const initialState = {
  projects: [],
  searchQuery: '',
};

export default function dashboardReducer(state = initialState, action) {
  switch (action.type) {
    case SET_PROJECTS:
      return {
        ...state,
        projects: action.payload,
      };
    case SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload,
      };
    case ADD_PROJECT:
      return {
        ...state,
        projects: [action.payload, ...state.projects],
      };
    case UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
      };
    default:
      return state;
  }
}
