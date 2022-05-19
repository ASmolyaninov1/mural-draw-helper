import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'
import './index.css'

type InitArgsType = {
  selectedWidgets: {
    type: string
  }[]
}

const init = ({ selectedWidgets, ...args }: InitArgsType) => {
  // const isRegisterWidget = selectedWidgets.find(widget => widget.type.includes('InkingWidget'))
  const image = `%3Csvg version='1.1' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 172 172'%3E%3Cg fill='none' fill-rule='nonzero' stroke='none' stroke-width='1' stroke-linecap='butt' stroke-linejoin='miter' strokeM-miterlimit='10' stroke-dasharray='' stroke-dashoffset='0' font-family='none' font-weight='none' font-size='none' text-anchor='none'%3E%3Cpath d='M0,172v-172h172v172z' fill='none'%3E%3C/path%3E%3Cpath d='' fill='none'%3E%3C/path%3E%3Cg fill='%23000000'%3E%3Cpath d='M152.5425,6.88c-3.23844,0 -6.57094,1.19594 -9.03,3.655l-4.6225,4.73l17.845,17.845c-0.01344,0.01344 4.73,-4.6225 4.73,-4.6225c4.93156,-4.93156 4.93156,-13.02094 0,-17.9525c-2.4725,-2.4725 -5.68406,-3.655 -8.9225,-3.655zM133.3,20.425l-78.1525,78.1525l-0.215,1.075l-3.225,16.6625l-1.075,5.0525l5.0525,-1.075l16.6625,-3.225l1.075,-0.215l78.1525,-78.1525l-4.945,-4.8375l-76.54,76.4325l-8.385,-8.385l76.4325,-76.54zM10.32,34.4c-1.90812,0 -3.44,1.54531 -3.44,3.44v123.84c0,1.89469 1.53188,3.44 3.44,3.44h123.84c1.90813,0 3.44,-1.54531 3.44,-3.44v-99.76l-6.88,6.88v89.44h-116.96v-116.96h89.44l6.88,-6.88z'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/svg%3E`

  if (window?.muralSdk) {
    window.muralSdk.register.toolBar.button({
      SVGicon: image,
      name: 'Draw Helper',
      tooltip: 'Draw Helper',
      component: '/',
    })
  }
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)

window.muralSdk.onReady(init)