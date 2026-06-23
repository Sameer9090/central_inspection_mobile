import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { API } from "../services/api";

export default function ApplicationsScreen() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await API.get("/applications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApplications(response.data.data || []);
    } catch (error: any) {
      console.log(error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const saveInspectionDate = async (
    applRefNo: string,
    inspectionDate: string,
    onSuccess: () => void,
  ) => {
    try {
      const token = await AsyncStorage.getItem("token");

      await API.post(
        "/set-inspection-date",
        {
          appl_ref_no: applRefNo,
          inspection_date: inspectionDate,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      Alert.alert("Success", "Inspection Date Saved Successfully");
      onSuccess(); // ✅ Notify card to disable picker & show form button
    } catch (error: any) {
      console.log("FULL ERROR:", error?.response?.data);
      Alert.alert(
        "Error",
        error?.response?.data?.message ||
          JSON.stringify(error?.response?.data) ||
          "Failed to Save Inspection Date",
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Applications In Queue</Text>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.appl_ref_no}
        renderItem={({ item }) => (
          <ApplicationCard item={item} onSave={saveInspectionDate} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No Applications Found</Text>
        }
      />
    </View>
  );
}

function ApplicationCard({
  item,
  onSave,
}: {
  item: any;
  onSave: (refNo: string, date: string, onSuccess: () => void) => void;
}) {
  const [inspectionDate, setInspectionDate] = useState(
    item.inspection_scheduled_on || "",
  );
  const [showPicker, setShowPicker] = useState(false);

  // ✅ Track if date has been saved (disables picker, hides save button)
  const [isDateSaved, setIsDateSaved] = useState(
    !!item.inspection_scheduled_on,
  );

  const handleSave = () => {
    if (!inspectionDate) {
      Alert.alert("Validation", "Please select an inspection date");
      return;
    }

    onSave(item.appl_ref_no, inspectionDate, () => {
      setIsDateSaved(true); // ✅ Disable picker & reveal form button after API success
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (!selectedDate) return;
    const formatted = selectedDate.toISOString().split("T")[0];
    setInspectionDate(formatted);
  };

  return (
    <View style={styles.card}>
      <Text style={styles.refNo}>{item.appl_ref_no}</Text>
      <Text style={styles.establishment}>{item.name_of_the_establishment}</Text>
      <Text>📍 {item.submission_location}</Text>
      <Text>📅 {item.submission_date}</Text>

      <Text style={styles.label}>Inspection Date</Text>

      {/* ✅ Date picker — disabled after save */}
      <TouchableOpacity
        style={[styles.input, isDateSaved && styles.disabledInput]}
        onPress={() => !isDateSaved && setShowPicker(true)}
        disabled={isDateSaved}
      >
        <Text style={isDateSaved ? styles.disabledText : undefined}>
          {inspectionDate || "Select Inspection Date"}
        </Text>
      </TouchableOpacity>

      {showPicker && !isDateSaved && (
        <DateTimePicker
          value={inspectionDate ? new Date(inspectionDate) : new Date()}
          mode="date"
          minimumDate={new Date()}
          onChange={handleDateChange}
        />
      )}

      {/* ✅ Save button — hidden after date is saved */}
      {!isDateSaved && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.btnText}>Save Date</Text>
        </TouchableOpacity>
      )}

      {/* ✅ Inspection Form button — always visible, enabled only after save */}
      <TouchableOpacity
        style={[
          styles.formBtn,
          !isDateSaved && styles.disabledFormBtn, // disabled visually until saved
        ]}
        disabled={!isDateSaved}
        onPress={() =>
          router.push({
            pathname: "/inspection-form",
            params: { refNo: item.appl_ref_no },
          })
        }
      >
        <Text style={styles.btnText}>Inspection Form</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 12,
    borderRadius: 10,
    elevation: 3,
  },
  refNo: {
    fontSize: 16,
    fontWeight: "bold",
  },
  establishment: {
    marginTop: 5,
    marginBottom: 5,
    fontSize: 15,
  },
  label: {
    marginTop: 15,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  disabledInput: {
    backgroundColor: "#e9ecef",
    borderColor: "#adb5bd",
  },
  disabledText: {
    color: "#6c757d",
  },
  saveBtn: {
    backgroundColor: "#1976D2",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  formBtn: {
    backgroundColor: "#2E7D32",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  disabledFormBtn: {
    backgroundColor: "#a5d6a7", // lighter green when disabled
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  empty: {
    textAlign: "center",
    marginTop: 50,
  },
});
