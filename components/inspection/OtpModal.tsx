import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function OtpModal({ visible, onClose, onVerify, mobileNumber }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(180);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (visible) {
      setOtp(["", "", "", "", "", ""]);
      setTimer(180);
      setCanResend(false);
      setError("");
    }
  }, [visible]);

  useEffect(() => {
    if (timer > 0 && visible) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (timer === 0) {
      setCanResend(true);
    }
  }, [timer, visible]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (index, key) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    onVerify(otpString);
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setTimer(180);
    setCanResend(false);
    setError("");
    // Call API to resend OTP
    Alert.alert("OTP Sent", "A new OTP has been sent to your mobile");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const maskedMobile = mobileNumber
    ? `+91******${mobileNumber.slice(-4)}`
    : "+91******XXXX";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔐 OTP Verification</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            We have sent you One Time Password to your registered Mobile Number
            ending with {maskedMobile}
          </Text>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={styles.otpInput}
                value={digit}
                onChangeText={(v) => handleOtpChange(index, v)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(index, nativeEvent.key)
                }
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.verifyBtn} onPress={handleVerify}>
            <Text style={styles.verifyBtnText}>✓ Verify OTP</Text>
          </TouchableOpacity>

          <View style={styles.timerContainer}>
            {canResend ? (
              <TouchableOpacity style={styles.resendBtn} onPress={handleResend}>
                <Text style={styles.resendBtnText}>🔄 Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend OTP in{" "}
                <Text style={styles.timerHighlight}>{formatTime(timer)}</Text>
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976D2",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "bold",
  },
  description: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 20,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: "#ddd",
    borderRadius: 12,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    backgroundColor: "#fafafa",
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  verifyBtn: {
    backgroundColor: "#1976D2",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  verifyBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  timerContainer: {
    alignItems: "center",
  },
  timerText: {
    fontSize: 14,
    color: "#666",
  },
  timerHighlight: {
    color: "#28a745",
    fontWeight: "bold",
  },
  resendBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#1976D2",
  },
  resendBtnText: {
    color: "#1976D2",
    fontWeight: "600",
    fontSize: 14,
  },
});
