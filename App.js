import { Ionicons } from "@expo/vector-icons"; // expo install @expo/vector-icons
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import MealEntryScreen from "./screens/MealEntryScreen";
import SummaryScreen from "./screens/SummaryScreen";
import CustomMealsScreen from "./screens/CustomMealsScreen"; // import new screen

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
      </Tab.Navigator>
    </NavigationContainer>
  );
}
