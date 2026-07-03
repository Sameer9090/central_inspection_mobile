import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import StatusBadge from "./StatusBadge";

interface TrackCardProps {
  applRefNo: string;
  submissionLocation: string;
  officerName: string;
  officerRole: string;
  status: string;
  heldFor: string;
  onHistory?: () => void;
  onReminder?: () => void;
}

export default function TrackCard({
  applRefNo,
  submissionLocation,
  officerName,
  officerRole,
  status,
  heldFor,
  onHistory,
  onReminder,
}: TrackCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.refNo}>{applRefNo}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Submission Location</Text>
        <Text style={styles.value}>{submissionLocation}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Current Officer</Text>
        <Text style={styles.value}>{officerName}</Text>
        <Text style={styles.role}>{officerRole}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>

        <StatusBadge status={status} />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Held For</Text>
        <Text style={styles.value}>{heldFor}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.historyButton}
          onPress={onHistory}
        >
          <Text style={styles.historyText}>View History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reminderButton}
          onPress={onReminder}
        >
          <Text style={styles.reminderText}>Reminder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  refNo: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2563EB",
    marginBottom: 15,
  },

  section: {
    marginBottom: 12,
  },

  label: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
  },

  value: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
  },

  role: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  statusBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#DCFCE7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusText: {
    color: "#15803D",
    fontWeight: "700",
    fontSize: 13,
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 10,
  },

  historyButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },

  historyText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },

  reminderButton: {
    flex: 1,
    backgroundColor: "#FEF3C7",
    paddingVertical: 12,
    borderRadius: 8,
  },

  reminderText: {
    color: "#92400E",
    textAlign: "center",
    fontWeight: "600",
  },
});