import React from 'react'
import { render } from 'react-dom'
import { Router, Route, browserHistory } from 'react-router'
import { createStore, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import createLogger from 'redux-logger'
import thunk from 'redux-thunk'
import thunkMiddleware from 'redux-thunk'
import reducer from './reducers'
import { getAllAccounts } from './actions'
import { watchPrescriptions } from './actions'
import App from './containers/App'
import DoctorContainer from './containers/DoctorContainer'
import PharmaContainer from './containers/PharmaContainer'
import PrescriptionFormContainer from './containers/PrescriptionFormContainer'


const middleware = [ thunk ];
if (process.env.NODE_ENV !== 'production') {
  middleware.push(createLogger());
}

const store = createStore(
  reducer,
  applyMiddleware(thunkMiddleware, ...middleware),
)
store.dispatch(getAllAccounts())
store.dispatch(watchPrescriptions())

render(
  <Provider store={store}>
    <Router history={browserHistory}>
      <Route path="/" component={App}>
        <Route path="doctor" component={DoctorContainer} />
        <Route path="prescription" component={PrescriptionFormContainer} />
        <Route path="pharma" component={PharmaContainer} />
      </Route>
    </Router>
  </Provider>,
  document.getElementById('root')
)
