import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

export default function SummaryScreen() {
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailyLogs, setDailyLogs] = useState([]);
  const [editMode, setEditMode] = useState(false);

  const dailyTargets = {
    calories: { min: 1000, max: 1500 },
    protein: 120,
    carbs: 120,
    fat: 50,
  };

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const saved = await AsyncStorage.getItem("logs");
        if (saved) setLogs(JSON.parse(saved));
      } catch (err) {
        console.error(err);
      }
    };
    loadLogs();
  }, []);

  useEffect(() => {
    const dayLogs = logs.filter((log) => log.date === selectedDate);
    setDailyLogs(dayLogs);
  }, [logs, selectedDate]);

  const totals = dailyLogs.reduce(
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

  const getBarColor = (value, target) => {
    if (value < target.min) return "#FFD93D"; // under target -> yellow
    if (value > target.max) return "#FF6B6B"; // over target -> red
    return "#4ECDC4"; // within target -> green
  };

  const handleEdit = () => {
    Alert.alert("Edit", "Edit functionality will be implemented.");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Calendar */}
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: "#007AFF" },
        }}
        style={styles.calendar}
      />

      {/* Daily Totals */}
      <View style={styles.totalsCard}>
        <Text style={styles.subHeader}>Summary for {selectedDate}</Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>🔥 Calories</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min((totals.calories / dailyTargets.calories.max) * 100, 100)}%`,
                  backgroundColor: getBarColor(totals.calories, dailyTargets.calories),
                },
              ]}
            />
          </View>
          <Text style={styles.progressValue}>
            {totals.calories}/{dailyTargets.calories.max}
          </Text>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>💪 Protein</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min((totals.protein / dailyTargets.protein) * 100, 100)}%`,
                  backgroundColor: totals.protein >= dailyTargets.protein ? "#4ECDC4" : "#FFD93D",
                },
              ]}
            />
          </View>
          <Text style={styles.progressValue}>
            {totals.protein}/{dailyTargets.protein}
          </Text>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>🥔 Carbs</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min((totals.carbs / dailyTargets.carbs) * 100, 100)}%`,
                  backgroundColor: totals.carbs >= dailyTargets.carbs ? "#4ECDC4" : "#FFD93D",
                },
              ]}
            />
          </View>
          <Text style={styles.progressValue}>
            {totals.carbs}/{dailyTargets.carbs}
          </Text>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>🧈 Fat</Text>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min((totals.fat / dailyTargets.fat) * 100, 100)}%`,
                  backgroundColor: totals.fat >= dailyTargets.fat ? "#4ECDC4" : "#FFD93D",
                },
              ]}
            />
          </View>
          <Text style={styles.progressValue}>
            {totals.fat}/{dailyTargets.fat}
          </Text>
        </View>

        <Button title={editMode ? "Save" : "Edit"} onPress={handleEdit} />
      </View>

      {/* Daily Logs */}
      <Text style={styles.subHeader}>Logged Meals</Text>
      {dailyLogs.length === 0 ? (
        <Text style={styles.noLogs}>No logs for this day.</Text>
      ) : (
        <FlatList
          data={dailyLogs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.logCard}>
              {item.meal && <Text style={styles.logText}>🍴 {item.meal}</Text>}
              {item.exercise && <Text style={styles.logText}>🏋️ {item.exercise}</Text>}
              {item.nutrition?.total && (
                <Text style={styles.logText}>
                  🔥 {item.nutrition.total.calories} kcal | 💪 {item.nutrition.total.protein}g P | 🥔 {item.nutrition.total.carbs}g C | 🧈 {item.nutrition.total.fat}g F
                </Text>
              )}
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#f8f9fa", padding: 15 },
  calendar: { marginBottom: 20, borderRadius: 10, overflow: "hidden" },
  totalsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  subHeader: { fontSize: 18, fontWeight: "700", marginBottom: 15 },
  progressRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  progressLabel: { width: 80 },
  progressBarBackground: {
    flex: 1,
    height: 12,
    backgroundColor: "#e0e0e0",
    borderRadius: 6,
    marginHorizontal: 10,
  },
  progressBarFill: { height: 12, borderRadius: 6 },
  progressValue: { width: 60, textAlign: "right", fontWeight: "600" },
  logCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  logText: { fontSize: 15, marginBottom: 5 },
  noLogs: { textAlign: "center", color: "#888", marginTop: 10, fontStyle: "italic" },
});
