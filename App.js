import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { Calendar } from "react-native-calendars";

const BACKEND_URL = "http://127.0.0.1:3000/nutrition"; // replace with your backend IP

export default function App() {
  const [selectedDate, setSelectedDate] = useState("");
  const [meal, setMeal] = useState("");
  const [exercise, setExercise] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);

  // Load logs on start
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const saved = await AsyncStorage.getItem("logs");
        if (saved) {
          const parsed = JSON.parse(saved);
          const fixed = parsed.map((l, i) => ({
            id: l.id || Date.now() + i,
            ...l,
          }));
          setLogs(fixed);
        }
      } catch (error) {
        console.error("Error loading logs", error);
      }
    };
    loadLogs();
  }, []);

  // Save logs whenever updated
  useEffect(() => {
    const saveLogs = async () => {
      try {
        await AsyncStorage.setItem("logs", JSON.stringify(logs));
      } catch (error) {
        console.error("Error saving logs", error);
      }
    };
    saveLogs();
  }, [logs]);

  // Fetch nutrition from backend
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

  // Log entry
  const handleLog = () => {
    if (!selectedDate) {
      Alert.alert("Please select a date first");
      return;
    }
    if (!meal && !exercise) {
      Alert.alert("Please enter a meal or exercise");
      return;
    }
    const newLog = {
      id: Date.now().toString(),
      date: selectedDate,
      meal,
      exercise,
      nutrition,
    };
    setLogs((prev) => [...prev, newLog]);

    // Clear inputs
    setMeal("");
    setExercise("");
    setNutrition(null);
  };

  // Delete log entry
  const handleDeleteLog = (id) => {
    setLogs((prev) => prev.filter((log) => log.id !== id));
  };

  // Filter logs by selected date
  const filteredLogs = logs.filter((log) => log.date === selectedDate);

  // Build marked dates for calendar
  const markedDates = logs.reduce((acc, log) => {
    acc[log.date] = { marked: true, dotColor: "red" };
    return acc;
  }, {});
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "blue",
    };
  }

  // Weekly summary (last 7 days)
  const getWeeklyCalories = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const weeklyLogs = logs.filter((log) => {
      const logDate = new Date(log.date);
      return logDate >= weekAgo && logDate <= today;
    });

    return weeklyLogs.reduce((sum, log) => sum + (log.nutrition?.total?.calories || 0), 0);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🥗 Weight Loss Tracker</Text>

      {/* Weekly Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryText}>
          🔥 Weekly Calories: {getWeeklyCalories()}
        </Text>
      </View>

      {/* Calendar */}
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
      />
      <Text style={styles.dateText}>Selected: {selectedDate || "None"}</Text>

      {/* Meal Input */}
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

      {/* Exercise Input */}
      <Text style={styles.label}>Enter exercise:</Text>
      <TextInput
        style={styles.input}
        value={exercise}
        onChangeText={setExercise}
        placeholder="e.g. 30 min treadmill"
      />

      {/* Nutrition Summary */}
      {nutrition && (
        <View style={styles.resultBox}>
          <Text style={styles.resultHeader}>Nutrition Summary</Text>
          {nutrition.items &&
            nutrition.items.map((item, idx) => (
              <Text key={idx}>
                {item.name} → Calories: {item.calories}, Protein: {item.protein}g,
                Carbs: {item.carbs}g, Fat: {item.fat}g
              </Text>
            ))}
          {nutrition.total && (
            <Text style={{ marginTop: 5, fontWeight: "700" }}>
              Total → Calories: {nutrition.total.calories}, Protein:{" "}
              {nutrition.total.protein}g, Carbs: {nutrition.total.carbs}g, Fat:{" "}
              {nutrition.total.fat}g
            </Text>
          )}
        </View>
      )}

      {/* Log Button */}
      <Button title="Log Entry" onPress={handleLog} />

      {/* Logged Entries */}
      <Text style={styles.subHeader}>📒 Logged Entries</Text>
      {filteredLogs.length === 0 ? (
        <Text style={styles.noLogs}>No logs for this date.</Text>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <Text style={styles.logText}>📅 {item.date}</Text>
              {item.meal ? <Text>🍴 Meal: {item.meal}</Text> : null}
              {item.exercise ? <Text>🏋️ Exercise: {item.exercise}</Text> : null}
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
                color="#ff4d4d"
                onPress={() => handleDeleteLog(item.id)}
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
  dateText: { textAlign: "center", marginBottom: 20, fontWeight: "600" },
  label: { fontWeight: "600", marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginVertical: 8,
    borderRadius: 6,
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resultHeader: { fontWeight: "700", marginBottom: 10 },
  noLogs: { textAlign: "center", color: "#888", marginTop: 10 },
  logCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  logText: { fontWeight: "600", marginBottom: 5 },
  summaryBox: {
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    alignItems: "center",
  },
  summaryText: { fontWeight: "700", fontSize: 16 },
});
