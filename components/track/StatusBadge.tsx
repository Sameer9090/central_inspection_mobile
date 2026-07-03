import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  status: string;
}

export default function StatusBadge({ status }: Props) {
  const getStyle = () => {
    switch (status) {
      case "Inspection Submitted":
        return {
          backgroundColor: "#DCFCE7",
          color: "#15803D",
        };

      case "Forwarded":
        return {
          backgroundColor: "#DBEAFE",
          color: "#1D4ED8",
        };

      case "Pending":
        return {
          backgroundColor: "#FEF3C7",
          color: "#92400E",
        };

      case "Pulled Back":
        return {
          backgroundColor: "#FFEDD5",
          color: "#C2410C",
        };

      case "Prosecution Initiated":
        return {
          backgroundColor: "#FEE2E2",
          color: "#B91C1C",
        };

      case "Close Requested":
        return {
          backgroundColor: "#EDE9FE",
          color: "#6D28D9",
        };

      default:
        return {
          backgroundColor: "#E5E7EB",
          color: "#374151",
        };
    }
  };

  const badge = getStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badge.backgroundColor,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: badge.color,
          },
        ]}
      >
        {status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  text: {
    fontWeight: "700",
    fontSize: 13,
  },
});