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

export default function SummaryScreen() {
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dailyLogs, setDailyLogs] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editableTotals, setEditableTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const dailyTargets = {
    calories: { min: 1000, max: 1500 },
    protein: { min: 120, max: 200 },
    carbs: { min: 120, max: 250 },
    fat: { min: 30, max: 70 },
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

    const totals = dayLogs.reduce(
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
    setEditableTotals(totals);
    setEditMode(false);
  }, [logs, selectedDate]);

  const getBarColor = (value, target) => {
    if (value < target.min) return "#FFD93D";
    if (value > target.max) return "#FF6B6B";
    return "#4ECDC4";
  };

  const handleSave = async () => {
    if (dailyLogs.length === 0) {
      setEditMode(false);
      return;
    }

    // Calculate total of existing logs
    const originalTotals = dailyLogs.reduce(
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

    // Update each log proportionally
    const updatedLogs = logs.map((log) => {
      if (log.date !== selectedDate || !log.nutrition?.total) return log;

      const updatedTotal = {};
      ["calories", "protein", "carbs", "fat"].forEach((key) => {
        const proportion = originalTotals[key]
          ? log.nutrition.total[key] / originalTotals[key]
          : 1 / dailyLogs.length;
        updatedTotal[key] = Math.round(editableTotals[key] * proportion);
      });

      return { ...log, nutrition: { total: updatedTotal } };
    });

    setLogs(updatedLogs);
    await AsyncStorage.setItem("logs", JSON.stringify(updatedLogs));
    Alert.alert("Saved", "Daily totals updated successfully!");
    setEditMode(false);
  };

  const markedDates = logs.reduce((acc, log) => {
    if (log.nutrition?.total) {
      const t = log.nutrition.total;
      const met =
        t.calories >= dailyTargets.calories.min &&
        t.calories <= dailyTargets.calories.max &&
        t.protein >= dailyTargets.protein.min &&
        t.protein <= dailyTargets.protein.max &&
        t.carbs >= dailyTargets.carbs.min &&
        t.carbs <= dailyTargets.carbs.max &&
        t.fat >= dailyTargets.fat.min &&
        t.fat <= dailyTargets.fat.max;
      acc[log.date] = {
        marked: true,
        dotColor: met ? "#4ECDC4" : "#FF6B6B",
      };
    }
    return acc;
  }, {});
  markedDates[selectedDate] = { ...(markedDates[selectedDate] || {}), selected: true, selectedColor: "#007AFF" };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        style={styles.calendar}
      />

      <View style={styles.totalsCard}>
        <Text style={styles.subHeader}>Summary for {selectedDate}</Text>

        {["calories", "protein", "carbs", "fat"].map((key) => (
          <View style={styles.progressRow} key={key}>
            <Text style={styles.progressLabel}>
              {key === "calories"
                ? "🔥 Calories"
                : key === "protein"
                ? "💪 Protein"
                : key === "carbs"
                ? "🥔 Carbs"
                : "🧈 Fat"}
            </Text>

            {editMode ? (
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={editableTotals[key].toString()}
                onChangeText={(val) =>
                  setEditableTotals((prev) => ({ ...prev, [key]: parseInt(val) || 0 }))
                }
              />
            ) : (
              <>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(
                          (editableTotals[key] / dailyTargets[key].max) * 100,
                          100
                        )}%`,
                        backgroundColor: getBarColor(editableTotals[key], dailyTargets[key]),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressValue}>
                  {editableTotals[key]}/{dailyTargets[key].max}
                </Text>
              </>
            )}
          </View>
        ))}

        <Button
          title={editMode ? "Save" : "Edit"}
          onPress={editMode ? handleSave : () => setEditMode(true)}
        />
      </View>

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
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 5,
    width: 60,
    textAlign: "center",
  },
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
