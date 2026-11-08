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
  onVerify: (otp: string) => void | Promise<void>;
  onResend?: () => void;
  loading?: boolean;
  requestingOtp?: boolean;
}

export default function OtpModal({
  visible,
  mobileNumber,
  onClose,
  onVerify,
  onResend,
  loading = false,
  requestingOtp = false,
}: Props) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState("");

  const inputs = useRef<TextInput[]>([]);
  const verificationInProgress = useRef(false);

  useEffect(() => {
    if (!visible) return;

    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setCanResend(false);
    setError("");
  }, [visible]);

  // Do not start the resend countdown while the inspection is being saved
  // or while the initial OTP request is still in progress.
  useEffect(() => {
    if (!visible || requestingOtp) return;

    if (timer <= 0) {
      setCanResend(true);
      return;
    }

    const interval = setInterval(() => {
      setTimer((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, visible, requestingOtp]);

  useEffect(() => {
    if (!visible || requestingOtp || loading) return;

    const focusTimer = setTimeout(() => {
      inputs.current[0]?.focus();
    }, 200);

    return () => clearTimeout(focusTimer);
  }, [visible, requestingOtp, loading]);

  const handleChange = (text: string, index: number) => {
    const digits = text.replace(/\D/g, "");

    if (digits.length > 1) {
      const pastedDigits = digits.slice(0, 6).split("");
      const next = ["", "", "", "", "", ""];

      pastedDigits.forEach((digit, i) => {
        next[i] = digit;
      });

      setOtp(next);
      setError("");
      inputs.current[Math.min(pastedDigits.length, 5)]?.focus();
      return;
    }

    const next = [...otp];
    next[index] = digits;
    setOtp(next);
    setError("");

    if (digits && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (index: number) => {
    if (otp[index] === "" && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = async () => {
    const code = otp.join("");

    if (code.length !== 6) {
      setError("Please enter 6 digit OTP");
      return;
    }

    if (verificationInProgress.current || loading || requestingOtp) {
      return;
    }

    verificationInProgress.current = true;
    setError("");

    try {
      await onVerify(code);
    } finally {
      verificationInProgress.current = false;
    }
  };

  const resend = () => {
    if (loading || requestingOtp || !canResend) return;

    setOtp(["", "", "", "", "", ""]);
    setTimer(60);
    setCanResend(false);
    setError("");
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
      onRequestClose={() => {
        if (!loading && !requestingOtp) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔐 OTP Verification</Text>
            <TouchableOpacity
              onPress={onClose}
              disabled={loading || requestingOtp}
            >
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.info}>
            We have sent you One Time Password to your registered Mobile Number
          </Text>

          <Text style={styles.mobile}>{masked}</Text>

          {requestingOtp && (
            <View style={styles.progress}>
              <ActivityIndicator size="small" color="#1976D2" />
              <Text style={styles.progressText}>
                Preparing inspection and sending OTP. Please wait...
              </Text>
            </View>
          )}

          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputs.current[index] = ref;
                }}
                value={digit}
                keyboardType="number-pad"
                maxLength={1}
                style={styles.input}
                onChangeText={(value) => handleChange(value, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Backspace") {
                    handleBackspace(index);
                  }
                }}
                editable={!loading && !requestingOtp}
              />
            ))}
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (loading || requestingOtp) && styles.disabledButton,
            ]}
            onPress={verify}
            disabled={loading || requestingOtp}
          >
            {loading || requestingOtp ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyText}>✓ Verify OTP</Text>
            )}
          </TouchableOpacity>

          {!canResend ? (
            <Text style={styles.timer}>
              Resend OTP in <Text style={styles.green}>{timer}</Text> sec
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.resendButton}
              onPress={resend}
              disabled={loading || requestingOtp}
            >
              <Text style={styles.resendText}>🔄 Resend OTP</Text>
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
  progress: {
    marginTop: 15,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  progressText: {
    color: "#1976D2",
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
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
  disabledButton: {
    opacity: 0.6,
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
