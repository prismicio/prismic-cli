import React from "react";
import { RichText } from "../../components";

const MySlice = ({ slice }) => (
  <section>
    <span className="title">
      {slice.primary.title ? (
        <RichText text={slice.primary.title} />
      ) : (
        <h2>Template slice, update me!</h2>
      )}
    </span>
    {slice.primary.description ? (
      <RichText text={slice.primary.description} />
    ) : (
      <p>start by editing this slice from inside the SliceMachine builder!</p>
    )}
  </section>
);

export default MySlice;
