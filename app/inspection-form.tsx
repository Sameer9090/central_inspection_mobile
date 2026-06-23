import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ASEForm from "../components/inspection/ASEForm";
import CommonForm from "../components/inspection/CommonForm";

import { API } from "../services/api";

export default function InspectionFormScreen() {
  const { refNo } = useLocalSearchParams();

  const [application, setApplication] = useState<any>(null);
  const [common, setCommon] = useState<any>(null);
  const [inspections, setInspections] = useState<any[]>([]);
  const [inspectionASE, setinspectionASE] = useState<any[]>([]);
  const [inspectionContract, setinspectionContract] = useState<any[]>([]);
  const [inspectionMW, setinspectionMW] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    try {
      const token = await AsyncStorage.getItem("token");

      const encodedRefNo = encodeURIComponent(String(refNo));

      const response = await API.get(`/inspection-form/${encodedRefNo}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(JSON.stringify(response.data, null, 2));
      setApplication(response.data.application);
      setCommon(response.data.common);
      setInspections(response.data.inspections || []);

      const ase = response.data.inspections?.find(
        (item: any) => item.inspection_type === "ASE",
      );

      const contract = response.data.inspections?.find(
        (item: any) => item.inspection_type === "CONTRACT",
      );

      const mw = response.data.inspections?.find(
        (item: any) => item.inspection_type === "MINIMUMWAGE",
      );

      setinspectionASE(ase?.inspection_data || {});
      setinspectionContract(contract?.inspection_data || {});
      setinspectionMW(mw?.inspection_data || {});

      setUser(response.data.user || null);
    } catch (error: any) {
      console.log(error?.response?.data);
    } finally {
      setLoading(false);
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Inspection Form</Text>
      <View style={styles.card}>
        <Text style={styles.label}>UBIN</Text>
        <Text style={styles.value}>{application?.ubin}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Application Number</Text>
        <Text style={styles.value}>{application?.appl_ref_no}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Establishment Name</Text>
        <Text style={styles.value}>
          {application?.name_of_the_establishment}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Submission Location</Text>
        <Text style={styles.value}>{application?.submission_location}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Name Of the Inspector</Text>

        <Text style={styles.value}>
          {`${user?.firstname} ${user?.lastname}`}
        </Text>
      </View>

      <CommonForm
        application={application}
        common={common}
        user={user}
        // inspections={inspections}
      />
      <ASEForm inspectionASE={inspectionASE} user={user} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
  },

  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },

  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});
