import React from "react";
import { StyleSheet, Text, View } from "react-native";


type Row = {
  label: string;
  value: any;
};

export default function InspectionTable({
  rows,
}: {
  rows: Row[];
}) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.cell, styles.sl]}>Sl</Text>
        <Text style={[styles.cell, styles.criteria]}>
          Criteria
        </Text>
        <Text style={[styles.cell, styles.finding]}>
          Finding
        </Text>
      </View>

      {rows.map((item, index) => (
        <View key={index} style={styles.row}>
          <Text style={[styles.cell, styles.sl]}>
            {index + 1}
          </Text>

          <Text style={[styles.cell, styles.criteria]}>
            {item.label}
          </Text>

          <Text
            style={[
              styles.cell,
              styles.finding,
              item.value === "Yes"
                ? styles.yes
                : item.value === "No"
                ? styles.no
                : null,
            ]}
          >
            {item.value || "-"}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 6,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#0D47A1",
  },
  row: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  cell: {
    padding: 10,
    fontSize: 13,
  },
  sl: {
    width: 45,
    textAlign: "center",
  },
  criteria: {
    flex: 1,
  },
  finding: {
    width: 90,
    textAlign: "center",
    fontWeight: "600",
  },
  yes: {
    color: "green",
  },
  no: {
    color: "red",
  },
});