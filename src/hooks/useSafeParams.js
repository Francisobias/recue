import { useRoute } from '@react-navigation/native';

export const useSafeParams = (defaultParams = {}) => {
  const route = useRoute();
  return { ...defaultParams, ...(route?.params || {}) };
};

// Usage in any screen:
// const { userId, token } = useSafeParams({ userId: 'default' });