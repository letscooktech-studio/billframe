/**
 * MOCK FOR REACT-NATIVE-SVG
 * Node test environment mock providing dummy component stubs.
 */

import React from 'react';

const createComponent = (name: string) => {
  return (props: any) => React.createElement(name, props, props.children);
};

export const Svg = createComponent('Svg');
export const Defs = createComponent('Defs');
export const LinearGradient = createComponent('LinearGradient');
export const RadialGradient = createComponent('RadialGradient');
export const Stop = createComponent('Stop');
export const Rect = createComponent('Rect');
export const Path = createComponent('Path');
export const Circle = createComponent('Circle');
export const G = createComponent('G');
export const Text = createComponent('Text');
export const TSpan = createComponent('TSpan');

export default Svg;
