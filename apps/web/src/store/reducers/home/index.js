import { SET_HOME_DATA } from '../../actionTypes';

const initialState = {
  message: 'Welcome from Redux!',
  visitCount: 0,
};

export default function homeReducer(state = initialState, action) {
  switch (action.type) {
    case SET_HOME_DATA:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
}
