import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { PhotoRegisterScreen } from '../screens/instruments/PhotoRegisterScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  PhotoRegister: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: '로그인' }} />
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'MetroAI' }} />
      <Stack.Screen
        name="PhotoRegister"
        component={PhotoRegisterScreen}
        options={{ title: '사진으로 등록' }}
      />
    </Stack.Navigator>
  );
}
