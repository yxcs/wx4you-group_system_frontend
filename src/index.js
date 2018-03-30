import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import app from './reducers/reducers';
import sagas from './reducers/sagas';
import { Provider } from 'react-redux';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  app,
  applyMiddleware(sagaMiddleware)
)
sagaMiddleware.run(sagas)

ReactDOM.render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('root')
);
