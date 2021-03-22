import React from 'react';
import { array, shape } from 'prop-types';
import { RichText } from 'prismic-reactjs';

const <%= sliceName %> = ({ slice }) => (
  <section>
    <span className="title">
      {
        slice.primary.title ?
        <RichText render={slice.primary.title}/>
        : <h2>Template slice, update me!</h2>
      }
    </span>
    {
      slice.primary.description ?
      <RichText render={slice.primary.description}/>
      : <p>start by editing this slice from inside the SliceMachine builder!</p>
    }
    <style jsx>{`
        section {
          max-width: 600px;
          margin: 4em auto;
          text-align: center;
        }
        .title {
          color: #8592e0;
        }
    `}</style>
  </section>
);

<%= sliceName %>.propTypes = {
  slice: shape({
    primary: shape({
      title: array.isRequired,
    }).isRequired,
  }).isRequired,
};

<%= sliceName %>.displayName = <%= sliceName %>

export default <%= sliceName %>;
