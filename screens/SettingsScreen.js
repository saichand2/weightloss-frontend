import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, View } from "react-native";
import { fetchUserProfile, getCurrentUser, saveUserProfile, signOutUser } from "../services/firestore";

export default function SettingsScreen() {
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const user = getCurrentUser();
      if (!user) return;
      setProfile((p) => ({ ...p, email: user.email || p.email }));
      try {
        const fetched = await fetchUserProfile(user.uid);
        if (fetched) setProfile((p) => ({ ...p, ...fetched }));
      } catch (err) {
        console.warn("Failed to fetch profile", err);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveUserProfile(profile);
      Alert.alert("Saved", "Profile updated");
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", err.message || String(err));
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOutUser();
  };

  const handleShowLocalUsers = async () => {
    try {
      const saved = await AsyncStorage.getItem("local_users");
      const users = saved ? JSON.parse(saved) : [];
      if (users.length === 0) return Alert.alert("Local users", "No local users found");
      const list = users.map((u) => `${u.email} (id: ${u.uid})`).join("\n");
      Alert.alert("Local users", list);
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Failed to read local users");
    }
  };

  const handleClearLocalData = async () => {
    try {
      await AsyncStorage.removeItem("local_users");
      await AsyncStorage.removeItem("local_session");
      // Also remove any stored user:{uid} profiles
      const keys = await AsyncStorage.getAllKeys();
      const userKeys = keys.filter((k) => k && k.startsWith("user:"));
      if (userKeys.length) await AsyncStorage.multiRemove(userKeys);
      Alert.alert("Cleared", "Local users and session cleared.");
      // notify listeners indirectly by signing out
      await signOutUser();
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Failed to clear local data");
    }
  };

  const handleDumpLocalStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const entries = await AsyncStorage.multiGet(keys || []);
      const obj = {};
      entries.forEach(([k, v]) => {
        try {
          obj[k] = v ? JSON.parse(v) : null;
        } catch (e) {
          obj[k] = v;
        }
      });
      console.log("Full AsyncStorage dump:", obj);
      Alert.alert("Dumped to console", "Full local storage has been printed to the Metro/console.");
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "Failed to dump local storage");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Account</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={profile.email} editable={false} />
      <Text style={styles.label}>Full name</Text>
      <TextInput style={styles.input} value={profile.name} onChangeText={(t) => setProfile((p) => ({ ...p, name: t }))} />
      <View style={{ height: 12 }} />
      <Button title={loading ? "Saving..." : "Save"} onPress={handleSave} />
      <View style={{ height: 12 }} />
      <Button title="Sign out" color="red" onPress={handleSignOut} />
      <View style={{ height: 20 }} />
      <Text style={{ fontWeight: "700", marginBottom: 8 }}>Debug (dev only)</Text>
      <Button title="Show local users" onPress={handleShowLocalUsers} />
      <View style={{ height: 8 }} />
      <Button title="Dump local storage (console)" onPress={handleDumpLocalStorage} />
      <View style={{ height: 8 }} />
      <Button title="Clear local users & session" color="#aa0000" onPress={handleClearLocalData} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  label: { fontSize: 12, fontWeight: "600", marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginTop: 6, borderRadius: 6 },
});
