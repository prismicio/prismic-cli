// pages/_app.js
import React from 'react'
import NextApp from 'next/app'

import { theme } from 'essential-slices'// this is new

import { ThemeProvider, BaseStyles } from 'theme-ui' // this is new

export default class App extends NextApp {
  render() {
    const { Component, pageProps } = this.props
    return (
      <ThemeProvider theme={theme}>
        <BaseStyles>
          <Component {...pageProps} />
        </BaseStyles>
      </ThemeProvider>
    )
  }
}