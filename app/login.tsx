import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";
import { API } from "../services/api";
import { encryptPassword } from "../utils/encryption";

const CIS_LOGO = require("../assets/images/cis_new.png");

/* ─── Simple inline icons (no extra libraries) ─── */
const ErrorIcon = () => (
  <View style={styles.errorIconCircle}>
    <Text style={styles.errorIconText}>!</Text>
  </View>
);

const CheckIcon = () => (
  <View style={styles.checkIconCircle}>
    <Text style={styles.checkIconText}>✓</Text>
  </View>
);

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [touched, setTouched] = useState<{ username?: boolean; password?: boolean }>({});

  const passwordRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  /* ─── Responsive sizing ─── */
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const logoSize = Math.min(120, width * 0.28);
  const horizontalPadding = Math.max(16, width * 0.06);
  const cardPadding = Math.max(20, width * 0.065);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const validate = useCallback(() => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) {
      newErrors.username = "Please enter your username to continue";
    }
    if (!password) {
      newErrors.password = "Please enter your password to continue";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    setErrors(newErrors);
    const hasErrors = Object.keys(newErrors).length > 0;
    if (hasErrors) triggerShake();
    return !hasErrors;
  }, [username, password, triggerShake]);

  const handleLogin = async () => {
    if (!validate()) return;
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const encryptedPassword = encryptPassword(password);
      const response = await API.post("/login", {
        username: username.trim(),
        password: encryptedPassword,
      });

      if (response.data.success) {
        console.log("Login successful", response.data);
        setPassword("");
        router.push({
          pathname: "/otp",
          params: {
            username: username.trim(),
            fullname: response.data.fullname || "",
            phone: response.data.phone || "",
            role: response.data.role || "office",
          },
        });
      }
    } catch (error: any) {
      console.log("========== API ERROR ==========");
      console.log("Message:", error.message);
      console.log("Status:", error.response?.status);
      console.log("URL:", error.config?.baseURL + error.config?.url);
      console.log("Request:", error.config?.data);
      console.log("Response:", error.response?.data);
      console.log("Headers:", error.config?.headers);
      console.log("===============================");

      const status = error.response?.status;

      /* ─── 422 Validation Errors ─── */
      if (status === 422) {
        const backendErrors = error.response?.data?.errors;
        if (backendErrors) {
          const newErrors: { username?: string; password?: string } = {};

          if (backendErrors.username) {
            newErrors.username = Array.isArray(backendErrors.username)
              ? backendErrors.username[0]
              : backendErrors.username;
          }
          if (backendErrors.password) {
            newErrors.password = Array.isArray(backendErrors.password)
              ? backendErrors.password[0]
              : backendErrors.password;
          }

          setErrors(newErrors);
          triggerShake();
          setIsLoading(false);
          return; // show inline only — no Alert popup
        }
      }

      /* ─── Friendly Alert for other errors ─── */
      let userMessage = "Something went wrong. Please try again in a moment.";

      if (status === 401) {
        userMessage = "The username or password you entered is incorrect. Please check and try again.";
      } else if (status === 403) {
        userMessage = "Your account has been temporarily locked. Please contact your System Administrator.";
      } else if (status === 404) {
        userMessage = "The login service is currently unavailable. Please try again later.";
      } else if (status >= 500) {
        userMessage = "We're experiencing technical difficulties. Please try again in a few minutes.";
      } else if (error.message?.includes("Network") || error.message?.includes("network")) {
        userMessage = "No internet connection detected. Please check your network settings and try again.";
      }

      Alert.alert("Unable to Sign In", userMessage, [{ text: "Got it", style: "default" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => Keyboard.dismiss();

  const getInputStyle = (field: string, hasError: boolean) => {
    const isFocused = focusedField === field;
    return [
      styles.input,
      isFocused && styles.inputFocused,
      hasError && styles.inputError,
      {
        padding: isSmall ? 12 : 16,
        paddingRight: 44,
        fontSize: isSmall ? 14 : 16,
      },
    ];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: horizontalPadding },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* ─── Header ─── */}
              <View style={[styles.header, { marginBottom: isSmall ? 20 : 32 }]}>
                <View
                  style={[
                    styles.logoContainer,
                    {
                      width: logoSize,
                      height: logoSize,
                      borderRadius: logoSize / 2,
                      marginBottom: isSmall ? 12 : 20,
                    },
                  ]}
                >
                  <Image
                    source={CIS_LOGO}
                    style={[
                      styles.logo,
                      { width: logoSize * 0.8, height: logoSize * 0.8 },
                    ]}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  style={[
                    styles.title,
                    { fontSize: isSmall ? 20 : width < 414 ? 24 : 26 },
                  ]}
                >
                  Central Inspection System
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { fontSize: isSmall ? 11 : 13, marginTop: isSmall ? 4 : 8 },
                  ]}
                >
                  Labour Welfare Department
                </Text>
              </View>

              {/* ─── Form Card ─── */}
              <Animated.View
                style={[
                  styles.form,
                  {
                    padding: cardPadding,
                    borderRadius: isSmall ? 16 : 24,
                    transform: [{ translateX: shakeAnim }],
                  },
                ]}
              >
                {/* Username */}
                <View style={[styles.inputGroup, { marginBottom: isSmall ? 14 : 20 }]}>
                  <Text style={[styles.label, { fontSize: isSmall ? 11 : 13 }]}>
                    Username <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={getInputStyle("username", !!errors.username)}
                      placeholder="Enter your username"
                      placeholderTextColor="#9bb8d3"
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        if (errors.username) {
                          setErrors((prev) => ({ ...prev, username: undefined }));
                        }
                      }}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => {
                        setFocusedField(null);
                        setTouched((prev) => ({ ...prev, username: true }));
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!isLoading}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                    {username.trim().length > 2 && !errors.username && touched.username && (
                      <View style={styles.validationIcon}>
                        <CheckIcon />
                      </View>
                    )}
                    {errors.username && (
                      <View style={styles.validationIcon}>
                        <ErrorIcon />
                      </View>
                    )}
                  </View>
                  {errors.username && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errors.username}</Text>
                    </View>
                  )}
                </View>

                {/* Password */}
                <View style={[styles.inputGroup, { marginBottom: isSmall ? 14 : 20 }]}>
                  <Text style={[styles.label, { fontSize: isSmall ? 11 : 13 }]}>
                    Password <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      ref={passwordRef}
                      style={[
                        getInputStyle("password", !!errors.password),
                        { paddingRight: 80 },
                      ]}
                      placeholder="Enter your password"
                      placeholderTextColor="#9bb8d3"
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (errors.password) {
                          setErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      secureTextEntry={!showPassword}
                      editable={!isLoading}
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.6}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    >
                      <Text style={styles.eyeText}>
                        {showPassword ? "🙈" : "👁️"}
                      </Text>
                    </TouchableOpacity>
                    {errors.password && (
                      <View style={[styles.validationIcon, { right: 44 }]}>
                        <ErrorIcon />
                      </View>
                    )}
                  </View>
                  {errors.password && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>{errors.password}</Text>
                    </View>
                  )}
                  <Text style={styles.hintText}>
                    Password must be at least 8 characters
                  </Text>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                  style={[
                    styles.loginButton,
                    {
                      padding: isSmall ? 14 : 18,
                      marginTop: isSmall ? 4 : 12,
                    },
                    isLoading && styles.loginButtonDisabled,
                  ]}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.buttonContent}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={[styles.loginButtonText, { marginLeft: 10 }]}>
                        Signing in…
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Forgot Password */}
                <TouchableOpacity
                  style={styles.forgotPasswordContainer}
                  onPress={() =>
                    Alert.alert(
                      "Password Reset",
                      "Please contact your System Administrator to have your password reset.",
                      [{ text: "OK", style: "default" }]
                    )
                  }
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 20, right: 20 }}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* ─── Footer ─── */}
              <View style={[styles.footer, { marginTop: isSmall ? 16 : 28 }]}>
                <Text style={styles.footerText}>
                  © 2026 Central Inspection System
                </Text>
                <Text style={styles.versionText}>v1.0.0</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0a3d62",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 20,
  },
  header: {
    alignItems: "center",
  },
  logoContainer: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    padding: 8,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    color: "#8ab4d9",
    fontWeight: "600",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  form: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  },
  inputGroup: {
    width: "100%",
  },
  label: {
    fontWeight: "700",
    color: "#0a3d62",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  required: {
    color: "#dc3545",
    fontWeight: "800",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
    width: "100%",
  },
  input: {
    borderWidth: 2,
    borderColor: "#d0e1f0",
    borderRadius: 14,
    color: "#0a3d62",
    backgroundColor: "#f5f9ff",
    fontWeight: "500",
    width: "100%",
  },
  inputFocused: {
    borderColor: "#0066cc",
    backgroundColor: "#fff",
    shadowColor: "#0066cc",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  eyeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 14,
    zIndex: 10,
  },
  eyeText: {
    fontSize: 20,
  },
  validationIcon: {
    position: "absolute",
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 5,
  },
  errorIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#dc3545",
    justifyContent: "center",
    alignItems: "center",
  },
  errorIconText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
  },
  checkIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
  },
  checkIconText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 20,
  },
  inputError: {
    borderColor: "#dc3545",
    backgroundColor: "#fff8f8",
  },
  errorContainer: {
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 13,
    fontWeight: "600",
  },
  hintText: {
    color: "#7a9ab8",
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: "#0066cc",
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#0066cc",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonDisabled: {
    backgroundColor: "#7bb3e0",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
  forgotPasswordContainer: {
    marginTop: 20,
    alignItems: "center",
    padding: 4,
  },
  forgotText: {
    color: "#0066cc",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
    textDecorationColor: "rgba(0, 102, 204, 0.3)",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    color: "#8ab4d9",
    fontSize: 12,
    fontWeight: "500",
  },
  versionText: {
    color: "#5a8fc4",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500",
  },
});