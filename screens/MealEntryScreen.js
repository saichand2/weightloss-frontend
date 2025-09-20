import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const BACKEND_URL = "http://127.0.0.1:3000/nutrition";

export default function MealEntryScreen() {
  const [meal, setMeal] = useState("");
  const [exercise, setExercise] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFat, setManualFat] = useState("");

  const [customMeals, setCustomMeals] = useState([]);
  const [selectedCustomMeal, setSelectedCustomMeal] = useState("");
  const [mealQuantity, setMealQuantity] = useState("1");

  const currentDate = new Date().toISOString().split("T")[0];

  const dailyTargets = {
    calories: { min: 1000, max: 1500 },
    protein: 120,
    carbs: 120,
  };

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const saved = await AsyncStorage.getItem("logs");
        if (saved) {
          const parsed = JSON.parse(saved);
          setLogs(parsed.filter((log) => log.date === currentDate));
        }
        const savedMeals = await AsyncStorage.getItem("customMeals");
        if (savedMeals) setCustomMeals(JSON.parse(savedMeals));
      } catch (error) {
        console.error(error);
      }
    };
    loadLogs();
  }, []);

  useEffect(() => {
    const saveLogs = async () => {
      try {
        const saved = await AsyncStorage.getItem("logs");
        let parsed = saved ? JSON.parse(saved) : [];
        parsed = parsed.filter((log) => log.date !== currentDate);
        await AsyncStorage.setItem(
          "logs",
          JSON.stringify([...parsed, ...logs])
        );
      } catch (error) {
        console.error(error);
      }
    };
    saveLogs();
  }, [logs]);

  const handleFetchNutrition = async () => {
    if (!meal) {
      Alert.alert("Please enter a meal first");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal }),
      });
      const data = await res.json();
      setNutrition(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Failed to fetch nutrition");
      setNutrition(null);
    }
    setLoading(false);
  };

  const currentMealPreview = (() => {
    if (selectedCustomMeal) {
      const mealObj = customMeals.find((m) => m.id === selectedCustomMeal);
      const qty = parseFloat(mealQuantity) || 1;
      return {
        name: mealObj.name + (qty > 1 ? ` x${qty}` : ""),
        total: {
          calories: (mealObj.calories || 0) * qty,
          protein: (mealObj.protein || 0) * qty,
          carbs: (mealObj.carbs || 0) * qty,
          fat: (mealObj.fat || 0) * qty,
        },
      };
    }
    if (manualCalories || manualProtein || manualCarbs || manualFat) {
      return {
        name: meal || "Manual Entry",
        total: {
          calories: parseFloat(manualCalories) || 0,
          protein: parseFloat(manualProtein) || 0,
          carbs: parseFloat(manualCarbs) || 0,
          fat: parseFloat(manualFat) || 0,
        },
      };
    }
    if (meal && nutrition?.total) {
      return { name: meal, total: nutrition.total };
    }
    return null;
  })();

  const handleLog = () => {
    if (!meal && !exercise && !manualCalories && !selectedCustomMeal) {
      Alert.alert("Please enter a meal, exercise, or manual nutrition values");
      return;
    }
    const newLog = {
      id: Date.now().toString(),
      date: currentDate,
      meal: currentMealPreview.name,
      exercise,
      nutrition: currentMealPreview.total ? { total: currentMealPreview.total } : null,
    };
    setLogs((prev) => [...prev, newLog]);
    setMeal("");
    setExercise("");
    setNutrition(null);
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    setSelectedCustomMeal("");
    setMealQuantity("1");
  };

  const handleDelete = (id) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const totals = logs.reduce(
    (acc, log) => {
      if (log.nutrition?.total) {
        acc.calories += log.nutrition.total.calories;
        acc.protein += log.nutrition.total.protein;
        acc.carbs += log.nutrition.total.carbs;
        acc.fat += log.nutrition.total.fat;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const targetsMet =
    totals.calories >= dailyTargets.calories.min &&
    totals.calories <= dailyTargets.calories.max &&
    totals.protein >= dailyTargets.protein &&
    totals.carbs >= dailyTargets.carbs;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🥗 Meal Entry (Today)</Text>

      <Text style={styles.label}>Enter your meal:</Text>
      <TextInput
        style={styles.input}
        value={meal}
        onChangeText={setMeal}
        placeholder="e.g. 200g chicken, 2 rotis"
      />
      <Button
        title={loading ? "Loading..." : "Fetch Nutrition Summary"}
        onPress={handleFetchNutrition}
      />

      <Text style={[styles.label, { marginTop: 20 }]}>Manual Nutrition:</Text>
      <View style={styles.manualInputRow}>
        <TextInput
          style={styles.manualInput}
          placeholder="Calories"
          keyboardType="numeric"
          value={manualCalories}
          onChangeText={setManualCalories}
        />
        <TextInput
          style={styles.manualInput}
          placeholder="Protein"
          keyboardType="numeric"
          value={manualProtein}
          onChangeText={setManualProtein}
        />
      </View>
      <View style={styles.manualInputRow}>
        <TextInput
          style={styles.manualInput}
          placeholder="Carbs"
          keyboardType="numeric"
          value={manualCarbs}
          onChangeText={setManualCarbs}
        />
        <TextInput
          style={styles.manualInput}
          placeholder="Fat"
          keyboardType="numeric"
          value={manualFat}
          onChangeText={setManualFat}
        />
      </View>

      <Text style={styles.label}>Select a custom meal:</Text>
      <View style={styles.customMealRow}>
        <View style={{ flex: 2 }}>
          <Picker
            selectedValue={selectedCustomMeal}
            onValueChange={(itemValue) => setSelectedCustomMeal(itemValue)}
            style={{ height: 50 }}
          >
            <Picker.Item label="-- Select Meal --" value="" />
            {customMeals.map((meal) => (
              <Picker.Item key={meal.id} label={meal.name} value={meal.id} />
            ))}
          </Picker>
        </View>
        {selectedCustomMeal && (
          <View style={{ flex: 1, marginLeft: 8 }}>
            <TextInput
              style={styles.manualInput}
              placeholder="Qty"
              keyboardType="numeric"
              value={mealQuantity}
              onChangeText={setMealQuantity}
            />
          </View>
        )}
      </View>

      <Text style={styles.label}>Select exercise (optional):</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={exercise}
          onValueChange={(itemValue) => setExercise(itemValue)}
        >
          <Picker.Item label="-- Select Exercise --" value="" />
          <Picker.Item label="Chest + Tricep" value="Chest + Tricep" />
          <Picker.Item label="Back + Bicep" value="Back + Bicep" />
          <Picker.Item label="Legs" value="Legs" />
          <Picker.Item label="Abs" value="Abs" />
        </Picker>
      </View>

      {currentMealPreview && (
        <View style={[styles.resultBox, { backgroundColor: "#e0f7fa" }]}>
          <Text style={styles.resultHeader}>{currentMealPreview.name}</Text>
          <Text>🔥 Calories: {currentMealPreview.total.calories}</Text>
          <Text>💪 Protein: {currentMealPreview.total.protein} g</Text>
          <Text>🥔 Carbs: {currentMealPreview.total.carbs} g</Text>
          <Text>🧈 Fat: {currentMealPreview.total.fat} g</Text>
        </View>
      )}

      <Button title="Log Entry" onPress={handleLog} />

      {/* Totals and Celebration */}
      {totals && (
        <View style={styles.totalsCard}>
          <Text style={styles.subHeader}>📊 Today's Totals</Text>
          <View style={styles.progressRow}>
            <Text>Calories: {totals.calories}/{dailyTargets.calories.max}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text>Protein: {totals.protein}/{dailyTargets.protein}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text>Carbs: {totals.carbs}/{dailyTargets.carbs}</Text>
          </View>
        </View>
      )}
      {targetsMet && (
        <View style={styles.celebrationCard}>
          <Text style={styles.celebrationText}>
            🎉 Congrats! You hit your nutrition targets today! 🥳
          </Text>
        </View>
      )}

      {/* Logs */}
      <Text style={styles.subHeader}>📒 Today's Logs</Text>
      {logs.length === 0 ? (
        <Text style={styles.noLogs}>No logs for today.</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              {item.meal && <Text>🍴 Meal: {item.meal}</Text>}
              {item.exercise && <Text>🏋️ Exercise: {item.exercise}</Text>}
              {item.nutrition?.total && (
                <>
                  <Text>🔥 Calories: {item.nutrition.total.calories}</Text>
                  <Text>💪 Protein: {item.nutrition.total.protein} g</Text>
                  <Text>🥔 Carbs: {item.nutrition.total.carbs} g</Text>
                  <Text>🧈 Fat: {item.nutrition.total.fat} g</Text>
                </>
              )}
              <Button
                title="Delete"
                color="red"
                onPress={() => handleDelete(item.id)}
              />
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  subHeader: { fontSize: 20, fontWeight: "600", marginTop: 20, marginBottom: 10 },
  label: { fontWeight: "600", marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 6,
  },
  manualInputRow: { flexDirection: "row", justifyContent: "space-between" },
  manualInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 6,
    width: "100%",
  },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, marginVertical: 8 },
  customMealRow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  resultBox: { marginTop: 20, padding: 15, borderRadius: 8, borderWidth: 1, borderColor: "#b2ebf2" },
  resultHeader: { fontWeight: "700", marginBottom: 10, fontSize: 16 },
  noLogs: { textAlign: "center", color: "#888", marginTop: 10 },
  logCard: { backgroundColor: "#f0f8ff", padding: 15, marginVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  totalsCard: { backgroundColor: "#ffe4b5", padding: 15, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: "#ddd" },
  progressRow: { marginTop: 5 },
  celebrationCard: { backgroundColor: "#d4edda", padding: 15, borderRadius: 8, marginTop: 15, borderWidth: 1, borderColor: "#c3e6cb" },
  celebrationText: { fontSize: 18, fontWeight: "700", textAlign: "center", color: "#155724" },
});
