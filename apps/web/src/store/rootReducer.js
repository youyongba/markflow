import { combineReducers } from '@reduxjs/toolkit';
import homeReducer from './reducers/home';
import authReducer from './reducers/auth/login';
import dashboardReducer from './reducers/dashboard';
import layoutReducer from './slices/layoutSlice';

const rootReducer = combineReducers({
  home: homeReducer,
  auth: authReducer,
  dashboard: dashboardReducer,
  layout: layoutReducer,
});

export default rootReducer;
