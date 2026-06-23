import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API } from "../../services/api";

import AseSection from "./ASEForm";
import CommonSection from "./CommonSection";
import ContractSection from "./ContractSection";
import MinimumWageSection from "./MinimumWageSection";
import OtpModal from "./OtpModal";
import PreviewSection from "./PreviewSection";

export default function InspectionFormScreen() {
  const { refNo } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState("common");

  const [commonData, setCommonData] = useState({
    ubin: "",
    application_ref_no: refNo || "",
    submission_location: "",
    name_of_inspector: "",
    date_of_inspection: new Date().toISOString().split("T")[0],
    empl_first_name: "",
    empl_last_name: "",
    empl_mobile_no: "",
    empl_alt_mobile_no: "",
    empl_email: "",
    est_address_1: "",
    est_address_2: "",
    est_address_3: "",
    est_landmark: "",
    est_district: "",
    est_ward_no: "",
    inspection_photo_path: "",
    empl_sign_path: "",
    inspector_sign_path: "",
    selected_types: [],
  });

  const [aseData, setAseData] = useState({
    cleanliness_workplace_ase: "No",
    adequate_lighting_ase: "No",
    proper_ventilation_ase: "No",
    fire_prevention_measures_ase: "No",
    accident_prevention_ase: "No",
    drinking_water_ase: "No",
    latrine_urinal_ase: "No",
    first_aid_ase: "No",
    creche_facility_ase: "No",
    canteen_ase: "No",
    issue_of_appointment_letters_ase: "",
    issue_of_identity_card_ase: "",
    issue_of_payslip_ase: "",
    applicable_of_ESIC_ase: "",
    ESIC_ase_no_of_empl: "",
    maintenance_of_registers_ase: "",
    whether_annual_rep_submitted_ase: "",
    is_adolescent_employed_ase: "",
    adolescent_details_ase: [],
    name_address_of_employer: "",
    establishment_name: "",
    contact_number_email: "",
    date_of_commencement: "",
    opening_and_closing_hours: "",
    certificate_registration_date: "",
    registration_number: "",
    certificate_renewal_obtained: "",
    whether_certificate_displayed: "",
    permanent_unskilled_male: "",
    permanent_unskilled_female: "",
    permanent_semiskilled_male: "",
    permanent_semiskilled_female: "",
    permanent_skilled_male: "",
    permanent_skilled_female: "",
    temporary_unskilled_male: "",
    temporary_unskilled_female: "",
    temporary_semiskilled_male: "",
    temporary_semiskilled_female: "",
    temporary_skilled_male: "",
    temporary_skilled_female: "",
    temporary_apprentice_male: "",
    temporary_apprentice_female: "",
    contract_unskilled_male: "",
    contract_unskilled_female: "",
    contract_semiskilled_male: "",
    contract_semiskilled_female: "",
    contract_skilled_male: "",
    contract_skilled_female: "",
    wages_paid_unskilled_male: "",
    wages_paid_unskilled_female: "",
    wages_paid_semiskilled_male: "",
    wages_paid_semiskilled_female: "",
    wages_paid_skilled_male: "",
    wages_paid_skilled_female: "",
    whether_notified_wages_paid: "",
    hours_of_work_a_day: "",
    working_hours_of_female: "",
    whether_weekly_holidays_provided: "",
    wheather_prescribed_reg_maintained: "",
    register_of_hours_of_work: "",
    register_of_overtime: "",
    register_of_employment: "",
    register_of_leave: "",
    violation_of_provisions: "",
    ase_directions: [""],
    additional_remarks: "",
  });

  const [contractData, setContractData] = useState({
    cleanliness_workplace_contract: "No",
    adequate_lighting_contract: "No",
    proper_ventilation_contract: "No",
    fire_prevention_measures_contract: "No",
    accident_prevention_contract: "No",
    issue_of_appointment_letters_contract: "",
    issue_of_identity_card_contract: "",
    issue_of_payslip_contract: "",
    applicable_of_ESIC_contract: "",
    ESIC_contract_no_of_empl: "",
    maintenance_of_registers_contract: "",
    whether_annual_rep_submitted_contract: "",
    is_adolescent_employed_contract: "",
    adolescent_details_contract: [],
    whether_license_obtained: "",
    whether_contract_labour_numbering: "",
    whether_notices_regarding_rates_of_wages: "",
    whether_notice_regarding_names: "",
    whether_copy_of_each_notice_displayed: "",
    whether_notices_showing_wage_period: "",
    whether_intimation_of_commencement: "",
    whether_half_yearly_return: "",
    whether_contractor_has_ensured_presence_of_representative: "",
    whether_contractor_ensured_payment_of_wages: "",
    whether_register_of_person_maintained: "",
    whether_wage_register_maintained: "",
    whether_contractor_obtained_sig_thumb_impression: "",
    whether_welfare_facilities_regarding_drinking_water: "",
    whether_contractor_creche_facility: "",
    whether_contractor_provides_canteen_facility: "",
    whether_contractor_prvides_rest_rooms: "",
    whether_first_aid_provided: "",
    whether_contractor_issued_employment_card: "",
    whether_date_maintained_in_employment_card: "",
    whether_contractor_issued_service_certificate: "",
    whether_wage_slips_formxix_issued: "",
    contract_directions: [""],
    additional_remarks2: "",
  });

  const [mwData, setMwData] = useState({
    issue_of_appointment_letters_mw: "",
    issue_of_identity_card_mw: "",
    issue_of_payslip_mw: "",
    applicable_of_ESIC_mw: "",
    ESIC_mw_no_of_empl: "",
    maintenance_of_registers_mw: "",
    whether_annual_rep_submitted_mw: "",
    is_adolescent_employed_mw: "",
    adolescent_details_minimumwage: [],
    whether_master_roll_maintained: "",
    whether_register_of_wages_maintained: "",
    whether_fine_deductions_recorded_appropriately: "",
    whether_wage_slips_prescribed: "",
    whether_annual_return_form3_submitted: "",
    no_of_employees_paid_after_statutory: "",
    whether_overtime_registered: "",
    number_of_cases_where_overtime_wages_not_paid: "",
    whether_weekly_rest_is_allowed: "",
    whether_notices_displayed_abstract_name_schedule: "",
    whether_minimum_wages_fixed_by_govt_paid: "",
    no_of_employees_paid_at_a_lesser_rate: "",
    whether_register_fines_maintained: "",
    whether_register_deduction_for_damage_maintained: "",
    whether_register_fines_maintained_rule5: "",
    whether_wages_paid_on_time: "",
    whether_salaries_paid_in_their_bank_accounts: "",
    whether_annual_return_submitted_rule17: "",
    whether_equal_renumeration_paid_men_women_workers: "",
    whether_register_maintained_by_employes_section8: "",
    permanent_employees_unskilled_male: "",
    permanent_employees_unskilled_female: "",
    permanent_employees_semiskilled_male: "",
    permanent_employees_semiskilled_female: "",
    permanent_employees_skilled_male: "",
    permanent_employees_skilled_female: "",
    permanent_employees_highlyskilled_male: "",
    permanent_employees_highlyskilled_female: "",
    permanent_employees_apprentice_male: "",
    permanent_employees_apprentice_female: "",
    permanent_employees_remarks: "",
    temporary_employees_unskilled_male: "",
    temporary_employees_unskilled_female: "",
    temporary_employees_semiskilled_male: "",
    temporary_employees_semiskilled_female: "",
    temporary_employees_skilled_male: "",
    temporary_employees_skilled_female: "",
    temporary_employees_highlyskilled_male: "",
    temporary_employees_highlyskilled_female: "",
    temporary_employees_remarks: "",
    contract_employees_unskilled_male: "",
    contract_employees_unskilled_female: "",
    contract_employees_semiskilled_male: "",
    contract_employees_semiskilled_female: "",
    contract_employees_skilled_male: "",
    contract_employees_skilled_female: "",
    contract_employees_highlyskilled_male: "",
    contract_employees_highlyskilled_female: "",
    contract_employees_remarks: "",
    workers_detail_mw: [],
    minimumwage_directions: [""],
    additional_remarks3: "",
  });

  const [showOtpModal, setShowOtpModal] = useState(false);

  useEffect(() => {
    loadInspectionData();
  }, []);

  const loadInspectionData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const response = await API.get(`/inspection-form/${refNo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;
      if (data.commonData)
        setCommonData((prev) => ({ ...prev, ...data.commonData }));
      if (data.aseData) setAseData((prev) => ({ ...prev, ...data.aseData }));
      if (data.contractData)
        setContractData((prev) => ({ ...prev, ...data.contractData }));
      if (data.mwData) setMwData((prev) => ({ ...prev, ...data.mwData }));
    } catch (error) {
      console.log("Error loading inspection data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSection = async (section, data) => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("token");

      const formData = new FormData();
      formData.append("appl_ref_no", refNo);

      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      await API.post(`/inspection-form/${section}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Move to next step
      const steps = ["common"];
      if (commonData.selected_types.includes("ase")) steps.push("ase");
      if (commonData.selected_types.includes("contract"))
        steps.push("contract");
      if (commonData.selected_types.includes("minimumwage"))
        steps.push("minimumwage");
      steps.push("preview");

      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleFinalSubmit = async () => {
    setShowOtpModal(true);
  };

  const handleVerifyOtp = async (otp) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await API.post(
        "/inspection-form/final-submit",
        {
          appl_ref_no: refNo,
          otp,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setShowOtpModal(false);
      Alert.alert("Success", "Inspection report submitted successfully");
    } catch (error) {
      Alert.alert("Error", error?.response?.data?.message || "Invalid OTP");
    }
  };

  const getAvailableSteps = () => {
    const steps = [{ key: "common", label: "C", color: "#1976D2" }];
    if (commonData.selected_types.includes("ase"))
      steps.push({ key: "ase", label: "A", color: "#28a745" });
    if (commonData.selected_types.includes("contract"))
      steps.push({ key: "contract", label: "CL", color: "#ffc107" });
    if (commonData.selected_types.includes("minimumwage"))
      steps.push({ key: "minimumwage", label: "MW", color: "#17a2b8" });
    steps.push({ key: "preview", label: "P", color: "#6c757d" });
    return steps;
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {getAvailableSteps().map((step, index) => {
        const isActive = currentStep === step.key;
        const isPast =
          getAvailableSteps().findIndex((s) => s.key === currentStep) > index;

        return (
          <TouchableOpacity
            key={step.key}
            style={[
              styles.stepDot,
              isActive && { backgroundColor: step.color },
              isPast && { backgroundColor: "#2E7D32" },
            ]}
            onPress={() => {
              if (isPast || step.key === "common") setCurrentStep(step.key);
            }}
          >
            <Text
              style={[
                styles.stepText,
                (isActive || isPast) && styles.stepTextActive,
              ]}
            >
              {step.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1976D2" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Text style={styles.title}>Inspection Report Form</Text>
        <Text style={styles.subtitle}>Ref No: {refNo}</Text>

        {renderStepIndicator()}

        {currentStep === "common" && (
          <CommonSection
            data={commonData}
            onChange={setCommonData}
            onSave={() => handleSaveSection("common", commonData)}
            saving={saving}
          />
        )}

        {currentStep === "ase" && commonData.selected_types.includes("ase") && (
          <AseSection
            data={aseData}
            onChange={setAseData}
            onSave={() => handleSaveSection("ase", aseData)}
            onBack={() => setCurrentStep("common")}
            saving={saving}
          />
        )}

        {currentStep === "contract" &&
          commonData.selected_types.includes("contract") && (
            <ContractSection
              data={contractData}
              onChange={setContractData}
              onSave={() => handleSaveSection("contract", contractData)}
              onBack={() => {
                if (commonData.selected_types.includes("ase"))
                  setCurrentStep("ase");
                else setCurrentStep("common");
              }}
              saving={saving}
            />
          )}

        {currentStep === "minimumwage" &&
          commonData.selected_types.includes("minimumwage") && (
            <MinimumWageSection
              data={mwData}
              onChange={setMwData}
              onSave={() => handleSaveSection("minimumwage", mwData)}
              onBack={() => {
                if (commonData.selected_types.includes("contract"))
                  setCurrentStep("contract");
                else if (commonData.selected_types.includes("ase"))
                  setCurrentStep("ase");
                else setCurrentStep("common");
              }}
              saving={saving}
            />
          )}

        {currentStep === "preview" && (
          <PreviewSection
            commonData={commonData}
            aseData={aseData}
            contractData={contractData}
            mwData={mwData}
            onEdit={(section) => setCurrentStep(section)}
            onSubmit={handleFinalSubmit}
          />
        )}
      </ScrollView>

      <OtpModal
        visible={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        mobileNumber={commonData.empl_mobile_no}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flex: 1,
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
  },
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    gap: 8,
  },
  stepDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  stepText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666",
  },
  stepTextActive: {
    color: "#fff",
  },
});
