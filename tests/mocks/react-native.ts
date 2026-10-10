export const Platform = {
  OS: 'android',
  select: (obj: any) => obj.android ?? obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
  flatten: (styles: any) => (Array.isArray(styles) ? Object.assign({}, ...styles) : styles),
};

export const View = 'View';
export const Text = 'Text';
export const Pressable = 'Pressable';
export const TextInput = 'TextInput';
export const ScrollView = 'ScrollView';
export const ActivityIndicator = 'ActivityIndicator';
export const Image = 'Image';
export const Modal = 'Modal';
export const useColorScheme = () => 'dark';
export const Touchable = {
  Mixin: {},
};
export const processColor = (c: any) => c;
export const PanResponder = {
  create: () => ({ panHandlers: {} }),
};
export const Dimensions = {
  get: () => ({ width: 360, height: 800 }),
  addEventListener: () => ({ remove: () => {} }),
};
export const Alert = {
  alert: () => {},
};
export const I18nManager = {
  isRTL: false,
};
