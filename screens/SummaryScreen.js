import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

export default function SummaryScreen() {
  const [weeklyLogs, setWeeklyLogs] = useState([]);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const saved = await AsyncStorage.getItem("logs");
        if (saved) {
          const parsed = JSON.parse(saved);

          // Get last 7 days
          const today = new Date();
          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 6);

          const filtered = parsed.filter((log) => {
            const logDate = new Date(log.date);
            return logDate >= sevenDaysAgo && logDate <= today;
          });

          setWeeklyLogs(filtered);
        }
      } catch (err) {
        console.error("Error loading weekly logs", err);
      }
    };
    loadLogs();
  }, []);

  // Group by date
  const groupedByDate = weeklyLogs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }
    if (log.nutrition?.total) {
      acc[log.date].calories += log.nutrition.total.calories;
      acc[log.date].protein += log.nutrition.total.protein;
      acc[log.date].carbs += log.nutrition.total.carbs;
      acc[log.date].fat += log.nutrition.total.fat;
    }
    return acc;
  }, {});

  const summaryArray = Object.keys(groupedByDate).map((date) => ({
    date,
    ...groupedByDate[date],
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📊 Weekly Summary</Text>
      {summaryArray.length === 0 ? (
        <Text style={styles.noLogs}>No entries in the past 7 days.</Text>
      ) : (
        <FlatList
          data={summaryArray}
          keyExtractor={(item) => item.date}
          renderItem={({ item }) => (
            <View style={styles.summaryCard}>
              <Text style={styles.dateText}>{item.date}</Text>
              <Text>
                🔥 {item.calories} kcal | 💪 {item.protein}g P | 🥔 {item.carbs}g C | 🧈 {item.fat}g F
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 15, textAlign: "center" },
  noLogs: { textAlign: "center", color: "#888", marginTop: 20 },
  summaryCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  dateText: { fontWeight: "600", marginBottom: 5 },
});
