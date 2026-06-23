import React, { useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";

import { API } from "../services/api";

export default function OtpScreen() {
  const { username } = useLocalSearchParams();

  const [otp, setOtp] = useState("");

  const verifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Please enter OTP");
      return;
    }

    try {
      const response = await API.post("/verify-otp", {
        username,
        otp,
      });

      if (response.data.success) {
        await AsyncStorage.setItem("token", response.data.token);

        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));

        Alert.alert("Success", "Login Successful");

        router.replace("/dashboard");
      }
    } catch (error: any) {
      Alert.alert(
        "OTP Failed",
        error?.response?.data?.message || "Invalid OTP",
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>OTP Verification</Text>

      <Text style={styles.subtitle}>Username: {username}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter OTP"
        keyboardType="numeric"
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity style={styles.button} onPress={verifyOtp}>
        <Text style={styles.buttonText}>Verify OTP</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    marginBottom: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#0066cc",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
