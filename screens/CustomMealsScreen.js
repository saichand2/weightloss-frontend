import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { deleteCustomMeal, fetchCustomMeals, saveCustomMeal, saveLog } from "../services/firestore";

export default function CustomMealsScreen({ navigation }) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [meals, setMeals] = useState([]);

  // Load saved custom meals
  useEffect(() => {
    const loadMeals = async () => {
      try {
        const items = await fetchCustomMeals();
        if (items) setMeals(items);
      } catch (err) {
        console.error("Failed to load custom meals:", err);
      }
    };
    loadMeals();
  }, []);

  const saveMeals = async (newMeals) => {
    // keep state in sync locally; individual save/delete functions handle persistence
    setMeals(newMeals);
  };

  const handleAddMeal = () => {
    if (!name) return Alert.alert("Enter meal name");

    const newMeal = {
      id: Date.now().toString(),
      name,
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      fiber: parseFloat(fiber) || 0,
    };
    const updated = [...meals, newMeal];
    saveMeals(updated);
    (async () => {
      try {
        await saveCustomMeal(newMeal);
      } catch (err) {
        console.warn("Failed to save custom meal to firestore, kept local:", err);
        // fallback: persist to AsyncStorage so it's not lost
        const saved = await AsyncStorage.getItem("customMeals");
        const parsed = saved ? JSON.parse(saved) : [];
        await AsyncStorage.setItem("customMeals", JSON.stringify([...parsed, newMeal]));
      }
    })();

    setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat(""); setFiber("");
  };

  const handleDelete = (id) => {
    const updated = meals.filter((m) => m.id !== id);
    saveMeals(updated);
    (async () => {
      try {
        await deleteCustomMeal(id);
      } catch (err) {
        console.warn("Failed to delete custom meal from firestore, removed locally:", err);
        const saved = await AsyncStorage.getItem("customMeals");
        const parsed = saved ? JSON.parse(saved) : [];
        await AsyncStorage.setItem("customMeals", JSON.stringify(parsed.filter(m => m.id !== id)));
      }
    })();
  };

  const handleLogMeal = async (meal) => {
    // Save to today's logs
    const currentDate = new Date().toISOString().split("T")[0];
    const newLog = {
      id: Date.now().toString(),
      date: currentDate,
      meal: meal.name,
      exercise: "",
      nutrition: { total: { ...meal } },
    };
    try {
      await saveLog(newLog);
      Alert.alert(`${meal.name} logged successfully!`);
    } catch (err) {
      console.warn("Failed to save log to firestore, saving locally:", err);
      const savedLogs = await AsyncStorage.getItem("logs");
      const logs = savedLogs ? JSON.parse(savedLogs) : [];
      await AsyncStorage.setItem("logs", JSON.stringify([...logs, newLog]));
      Alert.alert(`${meal.name} logged locally (offline).`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>➕ Create Custom Meal</Text>

      <TextInput
        style={styles.input}
        placeholder="Meal Name"
        value={name}
        onChangeText={setName}
      />
      <View style={styles.row}>
        <TextInput
          style={styles.inputHalf}
          placeholder="Calories"
          keyboardType="numeric"
          value={calories}
          onChangeText={setCalories}
        />
        <TextInput
          style={styles.inputHalf}
          placeholder="Protein"
          keyboardType="numeric"
          value={protein}
          onChangeText={setProtein}
        />
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.inputHalf}
          placeholder="Carbs"
          keyboardType="numeric"
          value={carbs}
          onChangeText={setCarbs}
        />
        <TextInput
          style={styles.inputHalf}
          placeholder="Fat"
          keyboardType="numeric"
          value={fat}
          onChangeText={setFat}
        />
      </View>
      <View style={styles.row}>
        <TextInput
          style={styles.inputHalf}
          placeholder="Fiber"
          keyboardType="numeric"
          value={fiber}
          onChangeText={setFiber}
        />
      </View>
      <Button title="Add Meal" onPress={handleAddMeal} />

      <Text style={styles.subHeader}>📒 Your Custom Meals</Text>
      <FlatList
        data={meals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.mealCard}>
            <Text style={{ fontWeight: "600" }}>{item.name}</Text>
            <Text>🔥 {item.calories} kcal</Text>
            <Text>💪 Protein: {item.protein} g</Text>
            <Text>🥔 Carbs: {item.carbs} g</Text>
            <Text>🧈 Fat: {item.fat} g</Text>
            <Text>🌾 Fiber: {item.fiber} g</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <TouchableOpacity
                style={styles.logButton}
                onPress={() => handleLogMeal(item)}
              >
                <Text style={{ color: "#fff" }}>Log</Text>
              </TouchableOpacity>
              <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, backgroundColor: "#fff" },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subHeader: { fontSize: 20, fontWeight: "600", marginTop: 20, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: "#ccc", padding: 10,
    marginVertical: 5, borderRadius: 6,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  inputHalf: {
    borderWidth: 1, borderColor: "#ccc", padding: 10,
    marginVertical: 5, borderRadius: 6, width: "48%",
  },
  mealCard: {
    backgroundColor: "#f0f8ff", padding: 15, marginVertical: 8,
    borderRadius: 8, borderWidth: 1, borderColor: "#ddd",
  },
  logButton: {
    backgroundColor: "#4ECDC4", padding: 8, borderRadius: 6, marginRight: 10,
  },
});
