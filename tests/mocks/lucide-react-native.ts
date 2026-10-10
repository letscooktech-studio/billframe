const React = require('react');

const mockIcon = (props: any) => React.createElement('Icon', props);

module.exports = new Proxy({}, {
  get: () => mockIcon,
});
