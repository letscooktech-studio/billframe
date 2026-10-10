export const useRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
});

export const useFocusEffect = (cb: any) => {
  cb();
};

export const useLocalSearchParams = () => ({});

export const Tabs = {
  Screen: 'Tabs.Screen',
};
