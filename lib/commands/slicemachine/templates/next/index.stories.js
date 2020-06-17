import React from 'react';
import MySlice from '.';
import mock from './mock.json';

export default {
  title: '{{componentName}}',
  component: MySlice,
};

export const Default = () => < MySlice slice={mock} />;
