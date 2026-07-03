import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";

import ASEForm from "../components/inspection/ASEForm";
import CommonForm from "../components/inspection/CommonForm";
import ContractForm from "../components/inspection/ContractForm";
import MinimumWageForm from "../components/inspection/MinimumWageForm";

import { API } from "../services/api";
import { getCurrentLocation, GPSLocation } from "../utils/location";

export default function InspectionFormScreen() {
  const { refNo } = useLocalSearchParams();

  const [application, setApplication] = useState<any>(null);
  const [common, setCommon] = useState<any>(null);
  const [inspectionASE, setinspectionASE] = useState<any>({});
  const [inspectionContract, setinspectionContract] = useState<any>({});
  const [inspectionMW, setinspectionMW] = useState<any>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [gpsAcquiring, setGpsAcquiring] = useState(false);

  // Step tracking from backend
  const [currentStep, setCurrentStep] = useState<string>("common");
  const [sectionsStatus, setSectionsStatus] = useState<Record<string, boolean>>({});
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  useEffect(() => {
    loadApplication();
  }, []);

  const loadApplication = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const encodedRefNo = encodeURIComponent(String(refNo));

      const response = await API.get(`/inspection-form/${encodedRefNo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setApplication(response.data.application);
      setCommon(response.data.common);

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

      // Set step data from common data
      if (response.data.common) {
        setCurrentStep(response.data.common.current_step || "common");
        setSectionsStatus(response.data.common.sections_status || {});
        setSelectedTypes(response.data.common.selected_types || []);
      }
    } catch (error: any) {
      console.log(error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCommonFormSave = async (formData: Record<string, any>) => {
    setGpsAcquiring(true);
    let gps: GPSLocation;

    try {
      gps = await getCurrentLocation(60000);
    } catch (error: any) {
      setGpsAcquiring(false);
      if (error.message === "LOCATION_PERMISSION_DENIED") {
        Alert.alert("Permission Required", "Location permission is required.", [{ text: "OK" }]);
      } else if (error.message === "GPS_DISABLED") {
        Alert.alert("GPS Required", "Please enable location services.", [{ text: "OK" }]);
      } else if (error.message === "GPS_TIMEOUT") {
        Alert.alert("GPS Timeout", "Could not get location. Please try again.", [{ text: "OK" }]);
      } else {
        Alert.alert("GPS Error", "Failed to get location. Please try again.");
      }
      throw new Error("GPS_REQUIRED");
    }

    const payload = {
      ...formData,
      application_ref_no: refNo,
      latitude: gps.latitude,
      longitude: gps.longitude,
    };

    try {
      const token = await AsyncStorage.getItem("token");
      const response = await API.post("/common-fields-save", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGpsAcquiring(false);

      if (response.data.status) {
        Alert.alert("Success", "Common data saved with GPS location.");
        setCurrentStep(response.data.next_step || "ase");
        await loadApplication();
      } else {
        Alert.alert("Error", response.data.message || "Save failed");
      }
      return response.data;
    } catch (error: any) {
      setGpsAcquiring(false);
      console.error("Save error:", error?.response?.data || error);
      Alert.alert("Error", "Failed to save common form.");
      throw error;
    }
  };

  const handleSectionSave = async (sectionType: string, formData: any) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await API.post("/save-section", {
        ...formData,
        reference_number: refNo,
        inspection_type: sectionType,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status) {
        Alert.alert("Success", `${sectionType.toUpperCase()} saved successfully`);
        setCurrentStep(response.data.next_step || "preview");
        await loadApplication();
      }
      return response.data;
    } catch (error: any) {
      console.error("Save error:", error?.response?.data || error);
      Alert.alert("Error", `Failed to save ${sectionType}`);
      throw error;
    }
  };

  // ✅ Determine which form to show based on current step
  const renderCurrentForm = () => {
    switch (currentStep) {
      case "common":
        return (
          <CommonForm
            application={application}
            common={common}
            user={user}
            onSave={handleCommonFormSave}
            gpsAcquiring={gpsAcquiring}
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
          />
        );
      case "ase":
        return (
          <ASEForm
            inspectionASE={inspectionASE}
            user={user}
            onSave={(data) => handleSectionSave("ase", data)}
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
          />
        );
      case "contract":
        return (
          <ContractForm
            inspectionContract={inspectionContract}
            user={user}
            onSave={(data) => handleSectionSave("contract", data)}
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
          />
        );
      case "minimumwage":
        return (
          <MinimumWageForm
            inspectionMW={inspectionMW}
            user={user}
            onSave={(data) => handleSectionSave("minimumwage", data)}
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
          />
        );
      case "preview":
        return <PreviewForm application={application} common={common} />;
      default:
        return (
          <CommonForm
            application={application}
            common={common}
            user={user}
            onSave={handleCommonFormSave}
            gpsAcquiring={gpsAcquiring}
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
          />
        );
    }
  };

  // ✅ Get step label for display
  const getStepLabel = (step: string) => {
    const labels: Record<string, string> = {
      common: "Common Details",
      ase: "ASE Inspection",
      contract: "Contract Labour",
      minimumwage: "Minimum Wage",
      preview: "Preview & Submit",
    };
    return labels[step] || step;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={["left", "right", "bottom"]}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />
        <AppHeader />
        <ActivityIndicator size="large" color="#1a1a4e" />
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f5" }} edges={["left", "right", "bottom"]}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />
      <AppHeader />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Step Progress Indicator */}
        <StepProgressIndicator
          currentStep={currentStep}
          sectionsStatus={sectionsStatus}
          selectedTypes={selectedTypes}
        />

        {/* ✅ Current Step Indicator */}
        <View style={styles.currentStepBanner}>
          <Text style={styles.currentStepLabel}>You are here:</Text>
          <Text style={styles.currentStepValue}>{getStepLabel(currentStep)}</Text>
        </View>

        {/* Application Info Cards */}
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
          <Text style={styles.value}>{application?.name_of_the_establishment}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Submission Location</Text>
          <Text style={styles.value}>{application?.submission_location}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Name Of the Inspector</Text>
          <Text style={styles.value}>{`${user?.firstname} ${user?.lastname}`}</Text>
        </View>

        {/* ✅ Only show the CURRENT step form */}
        {renderCurrentForm()}

      </ScrollView>
    </SafeAreaView>
  );
}

// Step Progress Indicator Component
function StepProgressIndicator({
  currentStep,
  sectionsStatus,
  selectedTypes,
}: {
  currentStep: string;
  sectionsStatus: Record<string, boolean>;
  selectedTypes: string[];
}) {
  const steps = [
    { key: "common", label: "Common", icon: "📋" },
    { key: "ase", label: "ASE", icon: "🏭" },
    { key: "contract", label: "Contract", icon: "📝" },
    { key: "minimumwage", label: "Min. Wage", icon: "💰" },
    { key: "preview", label: "Preview", icon: "👁️" },
  ];

  const getStepStatus = (stepKey: string) => {
    if (!selectedTypes.includes(stepKey) && stepKey !== "common" && stepKey !== "preview") {
      return "skipped";
    }
    if (sectionsStatus[stepKey] === true) return "completed";
    if (currentStep === stepKey) return "current";
    return "pending";
  };

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressTitle}>Inspection Progress</Text>
      <View style={styles.stepsRow}>
        {steps.map((step, index) => {
          const status = getStepStatus(step.key);
          const isLast = index === steps.length - 1;

          return (
            <React.Fragment key={step.key}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    status === "completed" && styles.stepCompleted,
                    status === "current" && styles.stepCurrent,
                    status === "skipped" && styles.stepSkipped,
                  ]}
                >
                  {status === "completed" ? (
                    <Text style={styles.stepCheck}>✓</Text>
                  ) : status === "skipped" ? (
                    <Text style={styles.stepSkip}>−</Text>
                  ) : (
                    <Text style={styles.stepIcon}>{step.icon}</Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    status === "current" && styles.stepLabelCurrent,
                    status === "skipped" && styles.stepLabelSkipped,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.stepLine,
                    status === "completed" && styles.stepLineCompleted,
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

// Preview Form Component (for final step)
function PreviewForm({ application, common }: { application: any; common: any }) {
  return (
    <View style={styles.previewContainer}>
      <Text style={styles.previewTitle}>Review & Submit</Text>
      <Text style={styles.previewText}>
        All sections completed. Review your inspection data before final submission.
      </Text>
      <TouchableOpacity style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Submit Inspection</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 30,
  },
  currentStepBanner: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#1976D2",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currentStepLabel: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  currentStepValue: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "700",
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
  // Progress indicator styles
  progressContainer: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1a1a4e",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8EAF6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C5CAE9",
  },
  stepCompleted: {
    backgroundColor: "#2ECC71",
    borderColor: "#2ECC71",
  },
  stepCurrent: {
    backgroundColor: "#1976D2",
    borderColor: "#1976D2",
    transform: [{ scale: 1.1 }],
  },
  stepSkipped: {
    backgroundColor: "#f0f0f0",
    borderColor: "#ddd",
  },
  stepCheck: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  stepSkip: {
    color: "#999",
    fontSize: 16,
    fontWeight: "bold",
  },
  stepIcon: {
    fontSize: 14,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },
  stepLabelCurrent: {
    color: "#1976D2",
    fontWeight: "700",
  },
  stepLabelSkipped: {
    color: "#bbb",
  },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: "#E8EAF6",
    marginHorizontal: -4,
  },
  stepLineCompleted: {
    backgroundColor: "#2ECC71",
  },
  // Preview styles
  previewContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1a1a4e",
    marginBottom: 10,
  },
  previewText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: "#2ECC71",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});