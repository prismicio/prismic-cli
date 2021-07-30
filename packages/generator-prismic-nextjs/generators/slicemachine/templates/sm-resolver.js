import React, { Fragment } from 'react'

import {libraries} from './sm.json'

const __allSlices = libraries.reduce((acc, lib) => {
  const location = lib.replace(/^@\//, './')
  const slices = require(location)
  return {...acc, ...slices}
},{})

const NotFound = ({ sliceName, slice, i }) => {
  console.error(`[sm-resolver] component "${sliceName}" not found at index ${i}.`)
  console.warn(`slice data: ${slice}`)
	return process.env.NODE_ENV !== 'production' ? (
    <div
      style={{
        height: '30vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        textAlign: 'center',
        background: '#FAFAFA'
      }}
    >
      <h2>
        Slice "{sliceName}" not found.
      </h2>
      <p style={{ maxWidth: '320px', fontSize: '16px' }}>
        Check that you registered this component in your slices library!
      </p>
    </div>
  ) : <Fragment />
}

export default function SliceResolver({ sliceName, ...rest }) {
	return __allSlices[sliceName] ? __allSlices[sliceName] : () => <NotFound sliceName={sliceName} {...rest} />
}

  