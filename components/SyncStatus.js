import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { tryInitFirebase } from "../services/firestore";

export default function SyncStatus() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const ok = await tryInitFirebase();
        if (!mounted) return;
        setStatus(ok ? "Cloud: Connected" : "Cloud: Offline");
      } catch (err) {
        if (!mounted) return;
        setStatus("Cloud: Offline");
      }
    })();

    const onOnline = () => {
      (async () => {
        const ok = await tryInitFirebase();
        setStatus(ok ? "Cloud: Connected" : "Cloud: Offline");
      })();
    };

    // Listen to browser online/offline where supported
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", () => setStatus("No Network"));
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined" && window.removeEventListener) {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", () => {});
      }
    };
  }, []);

  const color =
    status === "Cloud: Connected" ? "#28a745" : status === "No Network" ? "#6c757d" : "#ff6b6b";

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginVertical: 8 },
  text: { fontSize: 13, fontWeight: "600" },
});
