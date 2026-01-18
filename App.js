import { Ionicons } from "@expo/vector-icons"; // expo install @expo/vector-icons
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { useEffect, useState } from "react";
import CustomMealsScreen from "./screens/CustomMealsScreen"; // import new screen
import LoginScreen from "./screens/LoginScreen";
import MealEntryScreen from "./screens/MealEntryScreen";
import SettingsScreen from "./screens/SettingsScreen";
import SummaryScreen from "./screens/SummaryScreen";
import { subscribeAuthState } from "./services/firestore";

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = subscribeAuthState((u) => setUser(u));
    return unsub;
  }, []);
  return (
    <NavigationContainer>
      {user ? (
        <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === "Meals") {
              iconName = "restaurant";
            } else if (route.name === "Summary") {
              iconName = "stats-chart";
            } else if (route.name === "Custom Meals") {
              iconName = "add-circle";
            } else if (route.name === "Account") {
              iconName = "person";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "gray",
          headerShown: false,
        })}
      >
        <Tab.Screen name="Meals" component={MealEntryScreen} />
        <Tab.Screen name="Summary" component={SummaryScreen} />
        <Tab.Screen name="Custom Meals" component={CustomMealsScreen} />
        <Tab.Screen name="Account" component={SettingsScreen} />
      </Tab.Navigator>
      ) : (
        <LoginScreen />
      )}
    </NavigationContainer>
  );
}
