import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";

import ASEForm from "../components/inspection/ASEForm";
import CommonForm from "../components/inspection/CommonForm";
import ContractLabourForm from "../components/inspection/ContractLabourForm";
import MWForm from "../components/inspection/MWForm";
import PreviewForm from "../components/inspection/PreviewForm";



import OtpModal from "@/components/inspection/OtpModal";
import { API } from "../services/api";
import { getCurrentLocation, GPSLocation } from "../utils/location";

export default function InspectionFormScreen() {
  const { refNo } = useLocalSearchParams();
  const [otpVisible, setOtpVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
        const step = response.data.common.current_step || "common";
        const status = response.data.common.sections_status || {};
        const types = response.data.common.selected_types || [];

        setCurrentStep(step);
        setSectionsStatus(status);
        setSelectedTypes(types);
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
      const response = await API.post("/common/save", payload, {
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

      if (error.response?.status !== 422) {
        console.error(error);
        Alert.alert(
          "Error",
          error.response?.data?.message || "Something went wrong."
        );
      }

      throw error;
    }
  };

  const handleSectionSave = async (sectionType: string, formData: any) => {
    try {
      const token = await AsyncStorage.getItem("token");
      console.log("Saving section:", sectionType, "refNo:", refNo);
      const payload = new FormData();
      payload.append('reference_number', String(refNo));
      payload.append('inspection_type', sectionType);
      console.log(formData);

      // Add all scalar fields, skipping nested arrays
      Object.entries(formData).forEach(([key, value]) => {
        if (
          key === "inspection_type" ||
          key === "reference_number" ||
          key === 'adolescent_details_ase' ||
          key === 'adolescent_details_contract' ||
          key === 'adolescent_details_minimumwage' ||
          key === 'workers_detail_mw') {
          return;
        }

        if (value === null || value === undefined) return;

        if (Array.isArray(value)) {
          value.forEach((item) => payload.append(`${key}[]`, String(item)));
        } else {
          payload.append(key, String(value));
        }
      });

      // Handle adolescent details with EXPLICIT indices
      const adolescentKey = `adolescent_details_${sectionType}`;
      const adolescents = formData[adolescentKey] || [];

      adolescents.forEach((ado: any, index: number) => {
        // Use [index] instead of [] for explicit indexing
        payload.append(`labour_office_intimation_${sectionType}[${index}]`, ado.labour_office_intimation || '');
        payload.append(`adolescent_name_${sectionType}[${index}]`, ado.name || '');
        payload.append(`adolescent_address_${sectionType}[${index}]`, ado.address || '');
        payload.append(`adolescent_age_${sectionType}[${index}]`, ado.age || '');
        payload.append(`hazardous_work_${sectionType}[${index}]`, ado.hazardous_work || '');
        payload.append(`working_hours_${sectionType}[${index}]`, ado.working_hours || '');
        payload.append(`wage_amount_${sectionType}[${index}]`, ado.wage_amount || '');
        payload.append(`maintain_register_${sectionType}[${index}]`, ado.maintain_register || '');
        console.log("Age proof:", ado.age_proof);
        if (ado.age_proof && ado.age_proof.uri) {
          payload.append(`age_proof_${sectionType}[${index}]`, {
            uri: ado.age_proof.uri,
            name: ado.age_proof.name || `age_proof_${index}.pdf`,
            type: ado.age_proof.type || 'application/pdf',
          } as any);
        }
      });

      // Handle MW individual workers with EXPLICIT indices
      if (sectionType === 'minimumwage' && formData.workers_detail_mw) {
        formData.workers_detail_mw.forEach((worker: any, index: number) => {
          payload.append(`worker_name_mw[${index}]`, worker.name || '');
          payload.append(`worker_designation_mw[${index}]`, worker.designation || '');
          payload.append(`worker_doj_mw[${index}]`, worker.doj || '');
          payload.append(`worker_wages_mw[${index}]`, worker.wages || '');

          if (worker.payslip && worker.payslip.uri) {
            payload.append(`worker_payslip[${index}]`, {
              uri: worker.payslip.uri,
              name: worker.payslip.name || `payslip_${index}.pdf`,
              type: worker.payslip.type || 'application/pdf',
            } as any);
          }
        });
      }

      const response = await API.post("/section/save", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status) {
        Alert.alert("Success", `${sectionType.toUpperCase()} saved successfully`);
        setCurrentStep(response.data.data?.next_step || "preview");
        await loadApplication();
      }
      return response.data;
    } catch (error: any) {
      console.error("Save error:", error?.response?.data || error);
      Alert.alert("Error", `Failed to save ${sectionType}: ${error?.response?.data?.message || error.message}`);
      throw error;
    }
  };
  const handleFinalSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      
      const response = await API.post(
        "/office/send-otp-inspection",
        {
          username: user?.username,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status) {
        setOtpVisible(true);

        Alert.alert(
          "Success",
          response.data.message
        );
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Unable to send OTP"
      );
    }
  };
  const handleVerifyOtp = async (otp: string) => {

    try {

      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");

      const response = await API.post(
        "/office/verify-otp-inspection",
        {
          username: user?.username,
          otp,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data.status) {

        Alert.alert(
          "Verification Failed",
          response.data.msg
        );

        return;
      }

      setOtpVisible(false);

      Alert.alert(
        "Success",
        "OTP Verified Successfully"
      );

      // FINAL SUBMIT
      await submitInspection();

    } catch (e: any) {

      Alert.alert(
        "Error",
        e?.response?.data?.msg || "OTP Verification Failed"
      );

    } finally {

      setSubmitting(false);

    }

  };

  const handleResendOtp = async () => {

    try {

      const token = await AsyncStorage.getItem("token");

      const response = await API.post(
        "/office/resend-otp-sms",
        {
          username: user?.username,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {

        Alert.alert(
          "Success",
          response.data.message
        );

      } else {

        Alert.alert(
          "Error",
          response.data.message
        );

      }

    } catch (e: any) {

      Alert.alert(
        "Error",
        "Unable to resend OTP."
      );

    }

  };

  const submitInspection = async () => {
    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem("token");

      const payload = {
        application_ref_no: application.appl_ref_no,

        name_of_inspector: common.common_data.inspector.name,
        date_of_inspection: common.common_data.inspector.date,

        empl_first_name: common.common_data.employer.first_name,
        empl_last_name: common.common_data.employer.last_name,
        empl_mobile_no: common.common_data.employer.mobile,
        empl_alt_mobile_no: common.common_data.employer.alt_mobile,
        empl_email: common.common_data.employer.email,

        est_address_1: common.common_data.establishment.address_1,
        est_address_2: common.common_data.establishment.address_2,
        est_landmark: common.common_data.establishment.landmark,

        est_district: common.common_data.establishment.district,
        est_ward_no: common.common_data.establishment.ward_no,
        panchayat: common.common_data.establishment.panchayat,

        submission_location: common.common_data.submission_location,

        inspection_photo_path:
          common.common_data.files.est_photo,

        empl_sign_path:
          common.common_data.files.empl_sign,

        inspector_sign_path:
          common.common_data.files.inspector_sign,

        form_selector: selectedTypes,

        ubin: application.ubin,

        name_of_the_establishment:
          application.name_of_the_establishment,
      };

      const response = await API.post(
        "/inspection-submit",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status) {

        setOtpVisible(false);

        Alert.alert(
          "Success",
          response.data.message
        );

        await loadApplication();

        // router.replace("/dashboard");

      } else {

        Alert.alert(
          "Error",
          response.data.message
        );

      }

    } catch (e: any) {

      console.log(e.response?.data);

      Alert.alert(
        "Error",
        e.response?.data?.message ||
        "Submission failed."
      );

    } finally {

      setSubmitting(false);

    }
  };

  // ✅ FIXED: Navigate back to previous step

  const handleBack = () => {
    const stepOrder = ["common", ...selectedTypes, "preview"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  // ✅ FIXED: Correct component mapping for each step
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
            onBack={handleBack}
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
          />
        );
      case "contract":
        return (
          <ContractLabourForm
            inspectionContract={inspectionContract}
            user={user}
            onSave={(data) => handleSectionSave("contract", data)}
            onBack={handleBack}
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
          />
        );
      case "minimumwage":
        return (
          <MWForm
            inspectionMW={inspectionMW}
            user={user}
            onSave={(data) => handleSectionSave("minimumwage", data)}
            onBack={handleBack}
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
            referenceNumber={String(refNo)}
          />
        );
      case "preview":
        return (
          <PreviewForm
            application={application}
            common={common}
            inspectionASE={inspectionASE}
            inspectionContract={inspectionContract}
            inspectionMW={inspectionMW}
            selectedTypes={selectedTypes}
            onEdit={(step: string) => setCurrentStep(step)}
            onSubmit={handleFinalSubmit}
          />
        );
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

        {/* Current Step Indicator */}
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

        {/* Current step form */}
        {renderCurrentForm()}

      </ScrollView>
      <OtpModal
        visible={otpVisible}
        mobileNumber={user?.phone}
        loading={submitting}
        onClose={() => setOtpVisible(false)}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
      />
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
            <View key={step.key} style={{ flexDirection: "row", alignItems: "center" }}>
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
            </View>
          );
        })}
      </View>
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
  notImplemented: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 12,
    marginTop: 15,
    alignItems: "center",
  },
  notImplementedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a4e",
    marginBottom: 8,
  },
  notImplementedSubtext: {
    fontSize: 14,
    color: "#999",
  },
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

