import { useState } from "react";
import { Alert, Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { saveUserProfile, signIn, signUp } from "../services/firestore";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleAuth = async () => {
    // Reset inline errors
    setEmailError("");
    setPasswordError("");
    // Basic client-side validations (set inline errors instead of Alerts)
    if (!email) {
      console.log("Validation failed: missing email");
      setEmailError("Please enter your email address.");
      return;
    }
    if (!emailRegex.test(email)) {
      console.log("Validation failed: invalid email", email);
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      console.log("Validation failed: missing password");
      setPasswordError("Please enter your password.");
      return;
    }
    if (password.length < 6) {
      console.log("Validation failed: weak password");
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }
    if (isSignup) {
      if (!confirmPassword) {
        console.log("Validation failed: missing confirm password");
        setPasswordError("Please re-enter your password to confirm.");
        return;
      }
      if (password !== confirmPassword) {
        console.log("Validation failed: passwords do not match");
        setPasswordError("Passwords do not match. Please make sure both passwords match.");
        return;
      }
    }
    setLoading(true);
    try {
      console.log("Auth attempt", { isSignup, email });
      if (isSignup) {
        const user = await signUp(email, password);
        // save profile if provided
        if (name) {
          await saveUserProfile({ name, email });
        }
        console.log("Signed up user", user);
        Alert.alert("Signed up", `Welcome ${name || user.email}`);
      } else {
        const user = await signIn(email, password);
        console.log("Signed in user", user);
        Alert.alert("Signed in", `Welcome ${user.email}`);
      }
    } catch (err) {
      console.error("Auth error:", err);
      const code = err && err.code;
      if (code === "auth/user-not-found") {
        // Show inline validation message and toggle to signup mode
        setEmailError("No account exists with this email. Tap 'Create account' to register.");
        setIsSignup(true);
      } else if (code === "auth/wrong-password") {
        Alert.alert("Incorrect password", "The password you entered is incorrect.");
        setPasswordError("The password you entered is incorrect.");
      } else if (code === "auth/email-already-in-use") {
        Alert.alert("Email already in use", "An account with this email already exists. Sign in instead.");
        setIsSignup(false);
      } else {
        const msg = err && err.message ? err.message : String(err);
        Alert.alert("Auth error", msg);
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isSignup ? "Create Account" : "Sign In"}</Text>
      {isSignup && (
        <TextInput
          style={styles.input}
          placeholder="Full name (optional)"
          value={name}
          onChangeText={(t) => {
            setName(t);
          }}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (emailError) setEmailError("");
        }}
      />
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (passwordError) setPasswordError("");
        }}
      />
      {/* Show password-related inline error: if signing up, show after confirm field, otherwise show here */}
      {!isSignup && passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      <TouchableOpacity onPress={() => setShowPassword((s) => !s)} style={styles.toggleRow}>
        <Text style={styles.toggleText}>{showPassword ? "Hide password" : "Show password"}</Text>
      </TouchableOpacity>
      {isSignup && (
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          secureTextEntry={!showPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
      )}
      {/* If in signup mode, render password errors under the confirm field */}
      {isSignup && passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      <Button
        title={loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
        onPress={handleAuth}
        disabled={loading}
      />
      <View style={{ height: 10 }} />
      <Button
        title={isSignup ? "Have an account? Sign In" : "Create account"}
        onPress={() => setIsSignup((s) => !s)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 12, borderRadius: 6 },
  toggleRow: { alignItems: "flex-end", marginBottom: 12 },
  toggleText: { color: "#007AFF" },
  errorText: { color: "#cc0000", marginBottom: 8 },
});
