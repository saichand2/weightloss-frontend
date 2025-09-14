import { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Calendar } from "react-native-calendars";

const BACKEND_URL = "http://127.0.0.1:3000/nutrition"; // replace with your backend IP

export default function App() {
  const [selectedDate, setSelectedDate] = useState("");
  const [meal, setMeal] = useState("");
  const [exercise, setExercise] = useState("");
  const [nutrition, setNutrition] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchNutrition = async () => {
    if (!meal) return;
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
      setNutrition({ error: "Failed to fetch nutrition" });
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🥗 Weight Loss Tracker</Text>

      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{ [selectedDate]: { selected: true, selectedColor: "blue" } }}
      />
      <Text style={styles.dateText}>Selected: {selectedDate || "None"}</Text>

      <Text style={styles.label}>Enter your meals:</Text>
      <TextInput
        style={styles.input}
        value={meal}
        onChangeText={setMeal}
        placeholder="e.g. 200g chicken, 2 rotis"
      />
      <Button title={loading ? "Loading..." : "Get Nutrition"} onPress={handleFetchNutrition} />

      <Text style={styles.label}>Enter exercise:</Text>
      <TextInput
        style={styles.input}
        value={exercise}
        onChangeText={setExercise}
        placeholder="e.g. 30 min treadmill"
      />

      {nutrition && (
        <View style={styles.resultBox}>
          <Text style={styles.resultHeader}>Nutrition Facts:</Text>
          {nutrition.error ? (
            <Text style={styles.error}>{nutrition.error}</Text>
          ) : (
            <>
              <Text>Calories: {nutrition.calories}</Text>
              <Text>Protein: {nutrition.protein} g</Text>
              <Text>Carbs: {nutrition.carbs} g</Text>
              <Text>Fat: {nutrition.fat} g</Text>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#fff", flexGrow: 1 },
  header: { fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 20 },
  dateText: { textAlign: "center", marginBottom: 20, fontWeight: "600" },
  label: { fontWeight: "600", marginTop: 15 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginVertical: 8, borderRadius: 6 },
  resultBox: { marginTop: 20, padding: 15, backgroundColor: "#f9f9f9", borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  resultHeader: { fontWeight: "700", marginBottom: 10 },
  error: { color: "red" },
});
