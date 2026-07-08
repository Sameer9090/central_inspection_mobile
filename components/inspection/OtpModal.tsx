import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  mobileNumber: string;
  onClose: () => void;
  onVerify: (otp: string) => void;
  onResend?: () => void;
  loading?: boolean;
}

export default function OtpModal({
  visible,
  mobileNumber,
  onClose,
  onVerify,
  onResend,
  loading = false,
}: Props) {
  const { username, fullname, phone, role } = useLocalSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    if (!visible) return;

    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setCanResend(false);
    setError("");

    setTimeout(() => {
      inputs.current[0]?.focus();
    }, 200);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, visible]);

  const handleChange = (text: string, index: number) => {
    if (text.length > 1) {
      const digits = text.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];

      digits.forEach((d, i) => {
        next[i] = d;
      });

      setOtp(next);

      if (digits.length === 6) {
        onVerify(next.join(""));
      }

      return;
    }

    const arr = [...otp];
    arr[index] = text;
    setOtp(arr);

    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = () => {
    const code = otp.join("");

    if (code.length !== 6) {
      setError("Please enter 6 digit OTP");
      return;
    }

    setError("");
    onVerify(code);
  };

  const resend = () => {
    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setCanResend(false);
    setError("");

    inputs.current[0]?.focus();

    onResend?.();
  };

  const masked =
    mobileNumber && mobileNumber.length >= 4
      ? `+91******${mobileNumber.slice(-4)}`
      : "+91******XXXX";

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>

        <View style={styles.modal}>

          <View style={styles.header}>

            <Text style={styles.headerTitle}>
              🔐 OTP Verification
            </Text>

            <TouchableOpacity
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>

          </View>

          <Text style={styles.info}>
            We have sent you One Time Password to your registered Mobile Number
          </Text>

          <Text style={styles.mobile}>
            {masked}
          </Text>

          <View style={styles.otpRow}>

            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref: any) => (inputs.current[index] = ref)}
                value={digit}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.input}
                onChangeText={(t) => handleChange(t, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace") {
                    handleBackspace(index);
                  }
                }}
              />
            ))}

          </View>

          {!!error && (
            <Text style={styles.error}>
              {error}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.verifyButton,
              loading && { opacity: 0.6 },
            ]}
            onPress={verify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyText}>
                ✓ Verify OTP
              </Text>
            )}
          </TouchableOpacity>

          {!canResend ? (
            <Text style={styles.timer}>
              Resend OTP in{" "}
              <Text style={styles.green}>
                {timer}
              </Text>{" "}
              sec
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={resend}
            >
              <Text style={styles.resendText}>
                🔄 Resend OTP
              </Text>
            </TouchableOpacity>
          )}

        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modal: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
  },

  header: {
    backgroundColor: "#1976D2",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  close: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },

  info: {
    marginTop: 25,
    textAlign: "center",
    fontSize: 15,
    color: "#555",
    paddingHorizontal: 20,
  },

  mobile: {
    marginTop: 10,
    textAlign: "center",
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 18,
  },

  otpRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 30,
    marginHorizontal: 20,
  },

  input: {
    width: 46,
    height: 56,
    borderWidth: 1,
    borderColor: "#1976D2",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
  },

  error: {
    marginTop: 15,
    color: "#D32F2F",
    textAlign: "center",
    fontWeight: "600",
  },

  verifyButton: {
    marginTop: 25,
    marginHorizontal: 35,
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },

  verifyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  timer: {
    marginVertical: 20,
    textAlign: "center",
    color: "#555",
  },

  green: {
    color: "#2E7D32",
    fontWeight: "700",
  },

  resendButton: {
    alignSelf: "center",
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#1976D2",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },

  resendText: {
    color: "#1976D2",
    fontWeight: "700",
  },

});