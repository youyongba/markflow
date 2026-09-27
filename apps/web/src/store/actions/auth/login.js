import { SET_AUTH_USER, LOGOUT } from '../../actionTypes';

export const setAuthUser = (user) => ({
  type: SET_AUTH_USER,
  payload: user,
});

export const logout = () => ({
  type: LOGOUT,
});
