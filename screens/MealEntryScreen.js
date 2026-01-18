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
import CrossPicker from "../components/cross-picker";
import SyncStatus from "../components/SyncStatus";
import { deleteLog, fetchCustomMeals, fetchLogs, saveLog } from "../services/firestore";

const BACKEND_URL = "https://my-nutrition-api-production.up.railway.app/nutrition";

export default function MealEntryScreen() {
  const [meal, setMeal] = useState("");
  const [exercise, setExercise] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");
  const [manualFiber, setManualFiber] = useState("");

  const [customMeals, setCustomMeals] = useState([]);
  const [selectedCustomMeal, setSelectedCustomMeal] = useState("");
  const [mealQuantity, setMealQuantity] = useState("1");

  const currentDate = new Date().toISOString().split("T")[0];

  const dailyTargets = {
    calories: { min: 1900, max: 1900 },
    protein: { min: 170, max: 170 },
    carbs: { min: 200, max: 200 },
    fat: { min: 55, max: 60 },
    fiber: { min: 30, max: 35 },
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Try to fetch from Firestore (falls back to AsyncStorage inside the service)
        const allLogs = await fetchLogs();
        if (allLogs) setLogs(allLogs.filter((log) => log.date === currentDate));
        const meals = await fetchCustomMeals();
        if (meals) setCustomMeals(meals);
      } catch (error) {
        console.error("Failed to load logs/custom meals:", error);
      }
    };
    loadData();
  }, []);


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
          fiber: (mealObj.fiber || 0) * qty,
        },
      };
    }
    if (manualCalories || manualProtein || manualCarbs || manualFiber) {
      return {
        name: meal || "Manual Entry",
        total: {
          calories: parseFloat(manualCalories) || 0,
          protein: parseFloat(manualProtein) || 0,
          carbs: parseFloat(manualCarbs) || 0,
          fat: 0,
          fiber: parseFloat(manualFiber) || 0,
        },
      };
    }
    if (meal && nutrition?.total) {
      return { name: meal, total: nutrition.total };
    }
    return null;
  })();

  const handleLog = async () => {
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
    // update UI immediately
    setLogs((prev) => [...prev, newLog]);
    try {
      await saveLog(newLog);
    } catch (err) {
      console.warn("Failed to save log to firestore, kept local:", err);
    }
    setMeal("");
    setExercise("");
    setNutrition(null);
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFiber("");
    setSelectedCustomMeal("");
    setMealQuantity("1");
  };

  const handleDelete = (id) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
    (async () => {
      try {
        await deleteLog(id);
      } catch (err) {
        console.warn("Failed to delete log from firestore, removed locally:", err);
      }
    })();
  };

  const totals = logs.reduce(
    (acc, log) => {
      if (log.nutrition?.total) {
        acc.calories += log.nutrition.total.calories;
        acc.protein += log.nutrition.total.protein;
        acc.carbs += log.nutrition.total.carbs;
        acc.fat += log.nutrition.total.fat || 0;
        acc.fiber += log.nutrition.total.fiber || 0;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  const targetsMet =
    totals.calories >= dailyTargets.calories.min &&
    totals.calories <= dailyTargets.calories.max &&
    totals.protein >= dailyTargets.protein.min &&
    totals.protein <= dailyTargets.protein.max &&
    totals.carbs >= dailyTargets.carbs.min &&
    totals.carbs <= dailyTargets.carbs.max &&
    totals.fat >= dailyTargets.fat.min &&
    totals.fat <= dailyTargets.fat.max &&
    totals.fiber >= dailyTargets.fiber.min &&
    totals.fiber <= dailyTargets.fiber.max;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🥗 Meal Entry (Today)</Text>
      <SyncStatus />

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
          placeholder="Fiber"
          keyboardType="numeric"
          value={manualFiber}
          onChangeText={setManualFiber}
        />
      </View>

      <Text style={styles.label}>Select a custom meal:</Text>
      <View style={styles.customMealRow}>
        <View style={{ flex: 2 }}>
          <CrossPicker
            options={[{ label: '-- Select Meal --', value: '' }, ...customMeals.map(m => ({ label: m.name, value: m.id }))]}
            selectedValue={selectedCustomMeal}
            onValueChange={(itemValue) => setSelectedCustomMeal(itemValue)}
            style={{ height: 50 }}
          />
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
        <CrossPicker
          options={[
            { label: '-- Select Exercise --', value: '' },
            { label: 'Chest + Tricep', value: 'Chest + Tricep' },
            { label: 'Back + Bicep', value: 'Back + Bicep' },
            { label: 'Legs', value: 'Legs' },
            { label: 'Abs', value: 'Abs' },
          ]}
          selectedValue={exercise}
          onValueChange={(itemValue) => setExercise(itemValue)}
        />
      </View>

      {currentMealPreview && (
        <View style={[styles.resultBox, { backgroundColor: "#e0f7fa" }]}>
          <Text style={styles.resultHeader}>{currentMealPreview.name}</Text>
          <Text>🔥 Calories: {currentMealPreview.total.calories}</Text>
          <Text>💪 Protein: {currentMealPreview.total.protein} g</Text>
          <Text>🥔 Carbs: {currentMealPreview.total.carbs} g</Text>
          <Text>🧈 Fat: {currentMealPreview.total.fat} g</Text>
          <Text>🌾 Fiber: {currentMealPreview.total.fiber ?? 0} g</Text>
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
            <Text>Protein: {totals.protein}/{dailyTargets.protein.max}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text>Carbs: {totals.carbs}/{dailyTargets.carbs.max}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text>Fiber: {totals.fiber}/{dailyTargets.fiber.min}-{dailyTargets.fiber.max}</Text>
          </View>
          <View style={styles.progressRow}>
            <Text>Fats: {totals.fat}/{dailyTargets.fat.min}-{dailyTargets.fat.max}</Text>
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
                  <Text>🌾 Fiber: {item.nutrition.total.fiber ?? 0} g</Text>
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
