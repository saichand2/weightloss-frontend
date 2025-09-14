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

const BACKEND_URL = "http://127.0.0.1:3000/nutrition"; // replace with your backend

export default function App() {
  const [selectedDate, setSelectedDate] = useState("");
  const [meal, setMeal] = useState("");
  const [exercise, setExercise] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load logs on start
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const saved = await AsyncStorage.getItem("logs");
        if (saved) {
          const parsed = JSON.parse(saved);
          const fixed = parsed.map((l, i) => ({
            id: l.id || (Date.now() + i).toString(),
            date: l.date || "",
            meal: l.meal || "",
            exercise: l.exercise || "",
            nutrition: l.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 },
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
    if (logs.length > 0) {
      saveLogs();
    }
  }, [logs]);

  const handleGetNutrition = async () => {
    if (!meal) {
      Alert.alert("Please enter a meal to fetch nutrition");
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
    }
    setLoading(false);
  };

  const handleLog = () => {
    if (!selectedDate) {
      Alert.alert("Please select a date first");
      return;
    }
    if (!meal && !exercise) {
      Alert.alert("Please enter a meal or exercise");
      return;
    }
    if (!nutrition) {
      Alert.alert("Please fetch nutrition first");
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

    // clear fields
    setMeal("");
    setExercise("");
    setNutrition(null);
  };

  const filteredLogs = logs.filter((log) => log.date === selectedDate);

  const markedDates = logs.reduce((acc, log) => {
    if (log.date) acc[log.date] = { marked: true, dotColor: "red" };
    return acc;
  }, {});
  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: "blue",
    };
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🥗 Weight Loss Tracker</Text>

      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
      />
      <Text style={styles.dateText}>Selected: {selectedDate || "None"}</Text>

      <Text style={styles.label}>Enter your meal:</Text>
      <TextInput
        style={styles.input}
        value={meal}
        onChangeText={setMeal}
        placeholder="e.g. 200g chicken, 2 rotis"
      />

      <Text style={styles.label}>Enter exercise:</Text>
      <TextInput
        style={styles.input}
        value={exercise}
        onChangeText={setExercise}
        placeholder="e.g. 30 min treadmill"
      />

      <Button
        title={loading ? "Fetching..." : "Get Nutrition"}
        onPress={handleGetNutrition}
      />

      {nutrition && (
        <View style={styles.resultBox}>
          <Text style={styles.resultHeader}>Nutrition Summary:</Text>
          <Text>🔥 Calories: {nutrition.calories}</Text>
          <Text>💪 Protein: {nutrition.protein} g</Text>
          <Text>🥔 Carbs: {nutrition.carbs} g</Text>
          <Text>🧈 Fat: {nutrition.fat} g</Text>
          <Button title="Log Entry" onPress={handleLog} />
        </View>
      )}

      <Text style={styles.subHeader}>📒 Logged Entries</Text>
      {filteredLogs.length === 0 ? (
        <Text style={styles.noLogs}>No logs for this date.</Text>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item, index) =>
            item?.id ? item.id.toString() : index.toString()
          }
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              <Text style={styles.logText}>📅 {item.date}</Text>
              {item.meal ? <Text>🍴 Meal: {item.meal}</Text> : null}
              {item.exercise ? <Text>🏋️ Exercise: {item.exercise}</Text> : null}
              <Text>🔥 Calories: {item.nutrition?.calories || 0}</Text>
              <Text>💪 Protein: {item.nutrition?.protein || 0} g</Text>
              <Text>🥔 Carbs: {item.nutrition?.carbs || 0} g</Text>
              <Text>🧈 Fat: {item.nutrition?.fat || 0} g</Text>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
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
    marginTop: 15,
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
});
