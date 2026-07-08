import DateTimePicker from "@react-native-community/datetimepicker";
import * as DocumentPicker from 'expo-document-picker';
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// ===== Reusable Components (same as ASEForm) =====
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.sectionTitle}>{children}</Text>
);

const SubSectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.subSectionTitle}>{children}</Text>
);

const Label = ({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <Text style={styles.label}>
    {children}
    {required && <Text style={styles.required}> *</Text>}
  </Text>
);

const ErrorText = ({ children }: { children: React.ReactNode }) => (
  <Text style={styles.errorText}>{children}</Text>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.row}>{children}</View>
);

const RadioGroup = ({
  options,
  selected,
  onSelect,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) => (
  <View style={styles.radioGroup}>
    {options.map((option) => (
      <TouchableOpacity
        key={option}
        style={styles.radioOption}
        onPress={() => onSelect(option)}
      >
        <View
          style={[
            styles.radioCircle,
            selected === option && styles.radioCircleSelected,
          ]}
        >
          {selected === option && <View style={styles.radioDot} />}
        </View>
        <Text style={styles.radioLabel}>{option}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const SelectDropdown = ({
  value,
  onSelect,
  options,
  placeholder = "Select",
}: {
  value: string;
  onSelect: (value: string) => void;
  options: string[];
  placeholder?: string;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text
          style={value ? styles.dropdownText : styles.dropdownPlaceholder}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    value === item && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === item && styles.optionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {value === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.optionSeparator} />
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const NumberInput = ({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}) => (
  <TextInput
    style={styles.numberInput}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    keyboardType="numeric"
    placeholderTextColor="#999"
  />
);

const TextInputField = ({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  keyboardType = "default",
  maxLength,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  maxLength?: number;
}) => (
  <TextInput
    style={[styles.textInput, multiline && styles.textArea]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#999"
    multiline={multiline}
    numberOfLines={numberOfLines}
    keyboardType={keyboardType}
    maxLength={maxLength}
  />
);

// ===== Employee Table (MW-specific with prefix) =====
const EmployeeTable = ({
  title,
  categories,
  data,
  onChange,
  prefix,
  showApprentice = false,
  remarksValue,
  onRemarksChange,
}: {
  title: string;
  categories: string[];
  data: any;
  onChange: (field: string, value: string) => void;
  prefix: string;
  showApprentice?: boolean;
  remarksValue?: string;
  onRemarksChange?: (text: string) => void;
}) => {
  const getKey = (cat: string) => cat.toLowerCase().replace(/[-\s]/g, "");

  return (
    <View style={styles.tableContainer}>
      <SubSectionTitle>{title}</SubSectionTitle>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 2 }]}>
            Category
          </Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Male</Text>
          <Text style={[styles.tableCell, styles.tableHeaderCell]}>Female</Text>
        </View>
        {categories.map((cat) => (
          <View key={cat} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{cat}</Text>
            <NumberInput
              value={data[`${prefix}_${getKey(cat)}_male`] || ""}
              onChangeText={(val) =>
                onChange(`${prefix}_${getKey(cat)}_male`, val)
              }
              placeholder="0"
            />
            <NumberInput
              value={data[`${prefix}_${getKey(cat)}_female`] || ""}
              onChangeText={(val) =>
                onChange(`${prefix}_${getKey(cat)}_female`, val)
              }
              placeholder="0"
            />
          </View>
        ))}
        {showApprentice && (
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>Apprentice</Text>
            <NumberInput
              value={data[`${prefix}_apprentice_male`] || ""}
              onChangeText={(val) =>
                onChange(`${prefix}_apprentice_male`, val)
              }
              placeholder="0"
            />
            <NumberInput
              value={data[`${prefix}_apprentice_female`] || ""}
              onChangeText={(val) =>
                onChange(`${prefix}_apprentice_female`, val)
              }
              placeholder="0"
            />
          </View>
        )}
      </View>
      {onRemarksChange && (
        <View style={{ marginTop: 10 }}>
          <Label>Remarks</Label>
          <TextInputField
            value={remarksValue || ""}
            onChangeText={onRemarksChange}
            placeholder="Enter remarks"
          />
        </View>
      )}
    </View>
  );
};

// ===== Main MW Form Component =====
export default function MWForm({
  inspectionMW,
  user,
  onSave,
  onBack,
  currentStep,
  sectionsStatus,
  referenceNumber,
}: {
  inspectionMW: any;
  user: any;
  onSave?: (data: any) => void;
  onBack?: () => void;
  currentStep?: string;
  sectionsStatus?: Record<string, boolean>;
  referenceNumber?: string;
}) {
  // ===== SECTION 1: Minimum Wage Observations =====
  const [issueOfAppointmentLetters, setIssueOfAppointmentLetters] = useState(
    inspectionMW?.issue_of_appointment_letters_mw || ""
  );
  const [issueOfIdentityCard, setIssueOfIdentityCard] = useState(
    inspectionMW?.issue_of_identity_card_mw || ""
  );
  const [issueOfPayslip, setIssueOfPayslip] = useState(
    inspectionMW?.issue_of_payslip_mw || ""
  );
  const [applicableOfESIC, setApplicableOfESIC] = useState(
    inspectionMW?.applicable_of_ESIC_mw || ""
  );
  const [esicNoOfEmpl, setEsicNoOfEmpl] = useState(
    inspectionMW?.ESIC_mw_no_of_empl || ""
  );
  const [maintenanceOfRegisters, setMaintenanceOfRegisters] = useState(
    inspectionMW?.maintenance_of_registers_mw || ""
  );
  const [annualRepSubmitted, setAnnualRepSubmitted] = useState(
    inspectionMW?.whether_annual_rep_submitted_mw || ""
  );
  const [isAdolescentEmployed, setIsAdolescentEmployed] = useState(
    inspectionMW?.is_adolescent_employed_mw || ""
  );

  // ===== SECTION 2: Adolescent Worker Details =====
  const [adolescentDetails, setAdolescentDetails] = useState(
    inspectionMW?.adolescent_details_minimumwage || [
      {
        labour_office_intimation: "",
        name: "",
        address: "",
        age: "",
        age_proof: null,
        age_proof_name: "",
        hazardous_work: "",
        working_hours: "",
        maintain_register: "",
        wage_amount: "",
      },
    ]
  );

  const addAdolescent = () => {
    setAdolescentDetails([
      ...adolescentDetails,
      {
        labour_office_intimation: "",
        name: "",
        address: "",
        age: "",
        age_proof: null,
        age_proof_name: "",
        hazardous_work: "",
        working_hours: "",
        maintain_register: "",
        wage_amount: "",
      },
    ]);
  };

  const removeAdolescent = (index: number) => {
    if (adolescentDetails.length > 1) {
      setAdolescentDetails(adolescentDetails.filter((_, i) => i !== index));
    }
  };

  const updateAdolescent = (index: number, field: string, value: any) => {
    setAdolescentDetails(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const pickAgeProofDocument = async (index: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];

        setAdolescentDetails(prev => {
          const updated = [...prev];

          updated[index] = {
            ...updated[index],
            age_proof: {
              uri: file.uri,
              name: file.name,
              type: file.mimeType || "application/octet-stream",
              size: file.size,
            },
            age_proof_name: file.name,
          };

          return updated;
        });

        console.log("Selected file:", file);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to pick document");
    }
  };

  // ===== SECTION 3: A) Code of Wages Observations =====
  const [masterRollMaintained, setMasterRollMaintained] = useState(
    inspectionMW?.whether_master_roll_maintained || ""
  );
  const [registerOfWagesMaintained, setRegisterOfWagesMaintained] = useState(
    inspectionMW?.whether_register_of_wages_maintained || ""
  );
  const [fineDeductionsRecorded, setFineDeductionsRecorded] = useState(
    inspectionMW?.whether_fine_deductions_recorded_appropriately || ""
  );
  const [wageSlipsPrescribed, setWageSlipsPrescribed] = useState(
    inspectionMW?.whether_wage_slips_prescribed || ""
  );
  const [annualReturnForm3, setAnnualReturnForm3] = useState(
    inspectionMW?.whether_annual_return_form3_submitted || ""
  );
  const [employeesPaidAfterStatutory, setEmployeesPaidAfterStatutory] = useState(
    inspectionMW?.no_of_employees_paid_after_statutory || ""
  );
  const [overtimeRegistered, setOvertimeRegistered] = useState(
    inspectionMW?.whether_overtime_registered || ""
  );
  const [overtimeWagesNotPaid, setOvertimeWagesNotPaid] = useState(
    inspectionMW?.number_of_cases_where_overtime_wages_not_paid || ""
  );
  const [weeklyRestAllowed, setWeeklyRestAllowed] = useState(
    inspectionMW?.whether_weekly_rest_is_allowed || ""
  );
  const [noticesDisplayed, setNoticesDisplayed] = useState(
    inspectionMW?.whether_notices_displayed_abstract_name_schedule || ""
  );
  const [minWagesGovtPaid, setMinWagesGovtPaid] = useState(
    inspectionMW?.whether_minimum_wages_fixed_by_govt_paid || ""
  );
  const [employeesPaidLesserRate, setEmployeesPaidLesserRate] = useState(
    inspectionMW?.no_of_employees_paid_at_a_lesser_rate || ""
  );

  // ===== SECTION 4: B) Payment of Wages Act =====
  const [registerFinesMaintained, setRegisterFinesMaintained] = useState(
    inspectionMW?.whether_register_fines_maintained || ""
  );
  const [registerDeductionDamage, setRegisterDeductionDamage] = useState(
    inspectionMW?.whether_register_deduction_for_damage_maintained || ""
  );
  const [registerFinesRule5, setRegisterFinesRule5] = useState(
    inspectionMW?.whether_register_fines_maintained_rule5 || ""
  );
  const [wagesPaidOnTime, setWagesPaidOnTime] = useState(
    inspectionMW?.whether_wages_paid_on_time || ""
  );
  const [salariesInBank, setSalariesInBank] = useState(
    inspectionMW?.whether_salaries_paid_in_their_bank_accounts || ""
  );
  const [annualReturnRule17, setAnnualReturnRule17] = useState(
    inspectionMW?.whether_annual_return_submitted_rule17 || ""
  );

  // ===== SECTION 5: C) Equal Remuneration Act =====
  const [equalRemuneration, setEqualRemuneration] = useState(
    inspectionMW?.whether_equal_renumeration_paid_men_women_workers || ""
  );
  const [registerMaintainedSection8, setRegisterMaintainedSection8] = useState(
    inspectionMW?.whether_register_maintained_by_employes_section8 || ""
  );

  // ===== SECTION 6: Employee Details =====
  const [permanentEmployees, setPermanentEmployees] = useState({
    permanent_employees_unskilled_male: inspectionMW?.permanent_employees_unskilled_male || "",
    permanent_employees_unskilled_female: inspectionMW?.permanent_employees_unskilled_female || "",
    permanent_employees_semiskilled_male: inspectionMW?.permanent_employees_semiskilled_male || "",
    permanent_employees_semiskilled_female: inspectionMW?.permanent_employees_semiskilled_female || "",
    permanent_employees_skilled_male: inspectionMW?.permanent_employees_skilled_male || "",
    permanent_employees_skilled_female: inspectionMW?.permanent_employees_skilled_female || "",
    permanent_employees_highlyskilled_male: inspectionMW?.permanent_employees_highlyskilled_male || "",
    permanent_employees_highlyskilled_female: inspectionMW?.permanent_employees_highlyskilled_female || "",
    permanent_employees_apprentice_male: inspectionMW?.permanent_employees_apprentice_male || "",
    permanent_employees_apprentice_female: inspectionMW?.permanent_employees_apprentice_female || "",
  });
  const [permanentRemarks, setPermanentRemarks] = useState(
    inspectionMW?.permanent_employees_remarks || ""
  );

  const [temporaryEmployees, setTemporaryEmployees] = useState({
    temporary_employees_unskilled_male: inspectionMW?.temporary_employees_unskilled_male || "",
    temporary_employees_unskilled_female: inspectionMW?.temporary_employees_unskilled_female || "",
    temporary_employees_semiskilled_male: inspectionMW?.temporary_employees_semiskilled_male || "",
    temporary_employees_semiskilled_female: inspectionMW?.temporary_employees_semiskilled_female || "",
    temporary_employees_skilled_male: inspectionMW?.temporary_employees_skilled_male || "",
    temporary_employees_skilled_female: inspectionMW?.temporary_employees_skilled_female || "",
    temporary_employees_highlyskilled_male: inspectionMW?.temporary_employees_highlyskilled_male || "",
    temporary_employees_highlyskilled_female: inspectionMW?.temporary_employees_highlyskilled_female || "",
  });
  const [temporaryRemarks, setTemporaryRemarks] = useState(
    inspectionMW?.temporary_employees_remarks || ""
  );

  const [contractEmployees, setContractEmployees] = useState({
    contract_employees_unskilled_male: inspectionMW?.contract_employees_unskilled_male || "",
    contract_employees_unskilled_female: inspectionMW?.contract_employees_unskilled_female || "",
    contract_employees_semiskilled_male: inspectionMW?.contract_employees_semiskilled_male || "",
    contract_employees_semiskilled_female: inspectionMW?.contract_employees_semiskilled_female || "",
    contract_employees_skilled_male: inspectionMW?.contract_employees_skilled_male || "",
    contract_employees_skilled_female: inspectionMW?.contract_employees_skilled_female || "",
    contract_employees_highlyskilled_male: inspectionMW?.contract_employees_highlyskilled_male || "",
    contract_employees_highlyskilled_female: inspectionMW?.contract_employees_highlyskilled_female || "",
  });
  const [contractRemarks, setContractRemarks] = useState(
    inspectionMW?.contract_employees_remarks || ""
  );

  // ===== SECTION 7: Individual Workers =====
  const [individualWorkers, setIndividualWorkers] = useState(
    inspectionMW?.workers_detail_mw || [
      { name: "", designation: "", doj: "", wages: "", payslip: null, payslip_name: "" },
    ]
  );
  const [activeDateIndex, setActiveDateIndex] = useState<number | null>(null);

  const addWorker = () => {
    setIndividualWorkers([
      ...individualWorkers,
      { name: "", designation: "", doj: "", wages: "", payslip: null, payslip_name: "" },
    ]);
  };

  const removeWorker = (index: number) => {
    if (individualWorkers.length > 1) {
      setIndividualWorkers(individualWorkers.filter((_, i) => i !== index));
    }
  };

  const updateWorker = (index: number, field: string, value: any) => {
    const updated = [...individualWorkers];
    updated[index] = { ...updated[index], [field]: value };
    setIndividualWorkers(updated);
  };

  const pickPayslip = async (index: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled === false) {
        const file = result.assets[0];
        updateWorker(index, 'payslip', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
          size: file.size,
        });
        updateWorker(index, 'payslip_name', file.name);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setActiveDateIndex(null);
    if (selectedDate && activeDateIndex !== null) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      updateWorker(activeDateIndex, "doj", `${year}-${month}-${day}`);
    }
  };

  // ===== SECTION 8: Directions =====
  const [directions, setDirections] = useState(
    inspectionMW?.minimumwage_directions || [""]
  );

  const addDirection = () => setDirections([...directions, ""]);
  const removeDirection = (index: number) => {
    if (directions.length > 1) {
      setDirections(directions.filter((_, i) => i !== index));
    }
  };
  const updateDirection = (index: number, value: string) => {
    const updated = [...directions];
    updated[index] = value;
    setDirections(updated);
  };

  // ===== SECTION 9: Additional Remarks =====
  const [additionalRemarks, setAdditionalRemarks] = useState(
    inspectionMW?.additional_remarks3 || ""
  );

  // ===== VALIDATION & SAVE =====
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!issueOfAppointmentLetters) newErrors.issue_of_appointment_letters_mw = "Required";
    if (!issueOfIdentityCard) newErrors.issue_of_identity_card_mw = "Required";
    if (!issueOfPayslip) newErrors.issue_of_payslip_mw = "Required";
    if (!applicableOfESIC) newErrors.applicable_of_ESIC_mw = "Required";
    if (!maintenanceOfRegisters) newErrors.maintenance_of_registers_mw = "Required";
    if (!annualRepSubmitted) newErrors.whether_annual_rep_submitted_mw = "Required";
    if (!isAdolescentEmployed) newErrors.is_adolescent_employed_mw = "Required";

    if (!masterRollMaintained) newErrors.whether_master_roll_maintained = "Required";
    if (!registerOfWagesMaintained) newErrors.whether_register_of_wages_maintained = "Required";
    if (!fineDeductionsRecorded) newErrors.whether_fine_deductions_recorded_appropriately = "Required";
    if (!wageSlipsPrescribed) newErrors.whether_wage_slips_prescribed = "Required";
    if (!annualReturnForm3) newErrors.whether_annual_return_form3_submitted = "Required";
    if (!overtimeRegistered) newErrors.whether_overtime_registered = "Required";
    if (!weeklyRestAllowed) newErrors.whether_weekly_rest_is_allowed = "Required";
    if (!noticesDisplayed) newErrors.whether_notices_displayed_abstract_name_schedule = "Required";
    if (!minWagesGovtPaid) newErrors.whether_minimum_wages_fixed_by_govt_paid = "Required";

    if (!registerFinesMaintained) newErrors.whether_register_fines_maintained = "Required";
    if (!registerDeductionDamage) newErrors.whether_register_deduction_for_damage_maintained = "Required";
    if (!registerFinesRule5) newErrors.whether_register_fines_maintained_rule5 = "Required";
    if (!wagesPaidOnTime) newErrors.whether_wages_paid_on_time = "Required";
    if (!salariesInBank) newErrors.whether_salaries_paid_in_their_bank_accounts = "Required";
    if (!annualReturnRule17) newErrors.whether_annual_return_submitted_rule17 = "Required";

    if (!equalRemuneration) newErrors.whether_equal_renumeration_paid_men_women_workers = "Required";
    if (!registerMaintainedSection8) newErrors.whether_register_maintained_by_employes_section8 = "Required";

    if (!additionalRemarks.trim()) newErrors.additional_remarks3 = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      Alert.alert("Validation Error", "Please fill all required fields");
      return;
    }

    const formData = {
      reference_number: referenceNumber || "",
      inspection_type: "minimumwage",

      // Minimum Wage Observations
      issue_of_appointment_letters_mw: issueOfAppointmentLetters,
      issue_of_identity_card_mw: issueOfIdentityCard,
      issue_of_payslip_mw: issueOfPayslip,
      applicable_of_ESIC_mw: applicableOfESIC,
      ESIC_mw_no_of_empl: esicNoOfEmpl,
      maintenance_of_registers_mw: maintenanceOfRegisters,
      whether_annual_rep_submitted_mw: annualRepSubmitted,
      is_adolescent_employed_mw: isAdolescentEmployed,

      // Adolescent
      adolescent_details_minimumwage: adolescentDetails,

      // A) Code of Wages
      whether_master_roll_maintained: masterRollMaintained,
      whether_register_of_wages_maintained: registerOfWagesMaintained,
      whether_fine_deductions_recorded_appropriately: fineDeductionsRecorded,
      whether_wage_slips_prescribed: wageSlipsPrescribed,
      whether_annual_return_form3_submitted: annualReturnForm3,
      no_of_employees_paid_after_statutory: employeesPaidAfterStatutory,
      whether_overtime_registered: overtimeRegistered,
      number_of_cases_where_overtime_wages_not_paid: overtimeWagesNotPaid,
      whether_weekly_rest_is_allowed: weeklyRestAllowed,
      whether_notices_displayed_abstract_name_schedule: noticesDisplayed,
      whether_minimum_wages_fixed_by_govt_paid: minWagesGovtPaid,
      no_of_employees_paid_at_a_lesser_rate: employeesPaidLesserRate,

      // B) Payment of Wages
      whether_register_fines_maintained: registerFinesMaintained,
      whether_register_deduction_for_damage_maintained: registerDeductionDamage,
      whether_register_fines_maintained_rule5: registerFinesRule5,
      whether_wages_paid_on_time: wagesPaidOnTime,
      whether_salaries_paid_in_their_bank_accounts: salariesInBank,
      whether_annual_return_submitted_rule17: annualReturnRule17,

      // C) Equal Remuneration
      whether_equal_renumeration_paid_men_women_workers: equalRemuneration,
      whether_register_maintained_by_employes_section8: registerMaintainedSection8,

      // Employee Details
      ...permanentEmployees,
      permanent_employees_remarks: permanentRemarks,
      ...temporaryEmployees,
      temporary_employees_remarks: temporaryRemarks,
      ...contractEmployees,
      contract_employees_remarks: contractRemarks,

      // Individual Workers
      workers_detail_mw: individualWorkers.map((w) => ({
        name: w.name,
        designation: w.designation,
        doj: w.doj,
        wages: w.wages,
        payslip: w.payslip,
      })),

      // Directions & Remarks
      minimumwage_directions: directions,
      additional_remarks3: additionalRemarks,
    };

    onSave?.(formData);
  };

  const yesNoOptions = ["Yes", "No"];
  const yesNoDataOptions = ["Yes", "No", "Data not available"];

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Minimum Wage Inspection</Text>

        {/* ===== SECTION 1: Minimum Wage Observations ===== */}
        <SectionTitle>Minimum Wage Observations</SectionTitle>

        <View style={styles.formGroup}>
          <Label required>1. Issue of appointment letters</Label>
          <SelectDropdown
            value={issueOfAppointmentLetters}
            onSelect={setIssueOfAppointmentLetters}
            options={yesNoOptions}
          />
          {errors.issue_of_appointment_letters_mw && (
            <ErrorText>{errors.issue_of_appointment_letters_mw}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>2. Issue of identity cards</Label>
          <SelectDropdown
            value={issueOfIdentityCard}
            onSelect={setIssueOfIdentityCard}
            options={yesNoOptions}
          />
          {errors.issue_of_identity_card_mw && (
            <ErrorText>{errors.issue_of_identity_card_mw}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>3. Issue of payslips</Label>
          <SelectDropdown
            value={issueOfPayslip}
            onSelect={setIssueOfPayslip}
            options={yesNoOptions}
          />
          {errors.issue_of_payslip_mw && (
            <ErrorText>{errors.issue_of_payslip_mw}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>4. Applicability of ESIC</Label>
          <SelectDropdown
            value={applicableOfESIC}
            onSelect={(val) => {
              setApplicableOfESIC(val);
              if (val !== "Yes") setEsicNoOfEmpl("");
            }}
            options={yesNoOptions}
          />
          {applicableOfESIC === "Yes" && (
            <TextInputField
              value={esicNoOfEmpl}
              onChangeText={setEsicNoOfEmpl}
              placeholder="Enter number of employees"
              keyboardType="numeric"
            />
          )}
          {errors.applicable_of_ESIC_mw && (
            <ErrorText>{errors.applicable_of_ESIC_mw}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>5. Maintenance of registers against each employee</Label>
          <SelectDropdown
            value={maintenanceOfRegisters}
            onSelect={setMaintenanceOfRegisters}
            options={yesNoOptions}
          />
          {errors.maintenance_of_registers_mw && (
            <ErrorText>{errors.maintenance_of_registers_mw}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>6. Whether annual return is submitted</Label>
          <SelectDropdown
            value={annualRepSubmitted}
            onSelect={setAnnualRepSubmitted}
            options={yesNoOptions}
          />
          {errors.whether_annual_rep_submitted_mw && (
            <ErrorText>{errors.whether_annual_rep_submitted_mw}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>7. Has any adolescent been employed?</Label>
          <SelectDropdown
            value={isAdolescentEmployed}
            onSelect={setIsAdolescentEmployed}
            options={yesNoOptions}
          />
          {errors.is_adolescent_employed_mw && (
            <ErrorText>{errors.is_adolescent_employed_mw}</ErrorText>
          )}
        </View>

        {/* ===== SECTION 2: Adolescent Worker Details ===== */}
        {isAdolescentEmployed === "Yes" && (
          <View style={styles.section}>
            <SectionTitle>Adolescent Worker Details</SectionTitle>
            {adolescentDetails.map((adolescent, index) => (
              <View key={index} style={styles.adolescentBlock}>
                <View style={styles.adolescentHeader}>
                  <Text style={styles.adolescentTitle}>
                    Adolescent Entry #{index + 1}
                  </Text>
                  {index > 0 && (
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeAdolescent(index)}
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Label required>
                    a. Whether intimation has been provided to Labour Office
                  </Label>
                  <SelectDropdown
                    value={adolescent.labour_office_intimation}
                    onSelect={(val) =>
                      updateAdolescent(index, "labour_office_intimation", val)
                    }
                    options={yesNoOptions}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>b. Name of the adolescent</Label>
                  <TextInputField
                    value={adolescent.name}
                    onChangeText={(val) => updateAdolescent(index, "name", val)}
                    placeholder="Enter name"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>c. Address of the adolescent</Label>
                  <TextInputField
                    value={adolescent.address}
                    onChangeText={(val) => updateAdolescent(index, "address", val)}
                    placeholder="Enter address"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>d. Age of the adolescent</Label>
                  <NumberInput
                    value={adolescent.age}
                    onChangeText={(val) => updateAdolescent(index, "age", val)}
                    placeholder="Enter age"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>e. Age proof (Upload document)</Label>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => pickAgeProofDocument(index)}
                  >
                    <Text style={styles.uploadBtnText}>
                      {adolescent.age_proof_name || "Choose File"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Label required>f. Whether engaged in hazardous occupations</Label>
                  <SelectDropdown
                    value={adolescent.hazardous_work}
                    onSelect={(val) => updateAdolescent(index, "hazardous_work", val)}
                    options={yesNoOptions}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>g. Working hours</Label>
                  <TextInputField
                    value={adolescent.working_hours}
                    onChangeText={(val) => updateAdolescent(index, "working_hours", val)}
                    placeholder="Enter working hours"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>h. Whether maintains register or not</Label>
                  <SelectDropdown
                    value={adolescent.maintain_register}
                    onSelect={(val) => updateAdolescent(index, "maintain_register", val)}
                    options={yesNoOptions}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>i. Wage paid to the adolescent</Label>
                  <NumberInput
                    value={adolescent.wage_amount}
                    onChangeText={(val) => updateAdolescent(index, "wage_amount", val)}
                    placeholder="Enter wage amount"
                  />
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addAdolescent}>
              <Text style={styles.addBtnText}>Add Another Adolescent</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ===== SECTION 3: A) Code of Wages Observations ===== */}
        <SectionTitle>A) Observations under Code of Wages</SectionTitle>

        <View style={styles.formGroup}>
          <Label required>1. Whether Muster-roll maintained? [Section 50]</Label>
          <SelectDropdown
            value={masterRollMaintained}
            onSelect={setMasterRollMaintained}
            options={yesNoOptions}
          />
          {errors.whether_master_roll_maintained && (
            <ErrorText>{errors.whether_master_roll_maintained}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>2. Whether Register of wages maintained? [Section 50]</Label>
          <SelectDropdown
            value={registerOfWagesMaintained}
            onSelect={setRegisterOfWagesMaintained}
            options={yesNoOptions}
          />
          {errors.whether_register_of_wages_maintained && (
            <ErrorText>{errors.whether_register_of_wages_maintained}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>3. Whether fine and deductions recorded in appropriate register?</Label>
          <SelectDropdown
            value={fineDeductionsRecorded}
            onSelect={setFineDeductionsRecorded}
            options={yesNoOptions}
          />
          {errors.whether_fine_deductions_recorded_appropriately && (
            <ErrorText>{errors.whether_fine_deductions_recorded_appropriately}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>4. Whether Wage Slips in prescribed form issued?</Label>
          <SelectDropdown
            value={wageSlipsPrescribed}
            onSelect={setWageSlipsPrescribed}
            options={yesNoOptions}
          />
          {errors.whether_wage_slips_prescribed && (
            <ErrorText>{errors.whether_wage_slips_prescribed}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>5. Whether Annual Return in Form III submitted?</Label>
          <SelectDropdown
            value={annualReturnForm3}
            onSelect={setAnnualReturnForm3}
            options={yesNoOptions}
          />
          {errors.whether_annual_return_form3_submitted && (
            <ErrorText>{errors.whether_annual_return_form3_submitted}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label>6. Number of employees where wages paid after statutory time limit</Label>
          <NumberInput
            value={employeesPaidAfterStatutory}
            onChangeText={setEmployeesPaidAfterStatutory}
            placeholder="0"
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>7. Whether Overtime Register maintained? [Section 50]</Label>
          <SelectDropdown
            value={overtimeRegistered}
            onSelect={setOvertimeRegistered}
            options={yesNoOptions}
          />
          {errors.whether_overtime_registered && (
            <ErrorText>{errors.whether_overtime_registered}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label>8. Number of cases where overtime wages were not paid as per Rule 25</Label>
          <NumberInput
            value={overtimeWagesNotPaid}
            onChangeText={setOvertimeWagesNotPaid}
            placeholder="0"
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>9. Whether weekly rest is allowed to workers? [Section 50]</Label>
          <SelectDropdown
            value={weeklyRestAllowed}
            onSelect={setWeeklyRestAllowed}
            options={yesNoOptions}
          />
          {errors.whether_weekly_rest_is_allowed && (
            <ErrorText>{errors.whether_weekly_rest_is_allowed}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>10. Whether notices are displayed (Abstract, Inspector, Schedule)?</Label>
          <SelectDropdown
            value={noticesDisplayed}
            onSelect={setNoticesDisplayed}
            options={yesNoOptions}
          />
          {errors.whether_notices_displayed_abstract_name_schedule && (
            <ErrorText>{errors.whether_notices_displayed_abstract_name_schedule}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>11. Whether minimum wages fixed by Govt. are being paid? [Section 5]</Label>
          <SelectDropdown
            value={minWagesGovtPaid}
            onSelect={setMinWagesGovtPaid}
            options={yesNoOptions}
          />
          {errors.whether_minimum_wages_fixed_by_govt_paid && (
            <ErrorText>{errors.whether_minimum_wages_fixed_by_govt_paid}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label>12. Number of employees paid wages less than minimum rate</Label>
          <NumberInput
            value={employeesPaidLesserRate}
            onChangeText={setEmployeesPaidLesserRate}
            placeholder="0"
          />
        </View>

        {/* ===== SECTION 4: B) Payment of Wages Act ===== */}
        <SectionTitle>B) Observations under Code On Wages (Payment of Wages)</SectionTitle>

        <View style={styles.formGroup}>
          <Label required>1. Whether Register of fines maintained? [Section 50]</Label>
          <SelectDropdown
            value={registerFinesMaintained}
            onSelect={setRegisterFinesMaintained}
            options={yesNoOptions}
          />
          {errors.whether_register_fines_maintained && (
            <ErrorText>{errors.whether_register_fines_maintained}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>2. Whether Register of Deduction for damage/loss maintained?</Label>
          <SelectDropdown
            value={registerDeductionDamage}
            onSelect={setRegisterDeductionDamage}
            options={yesNoOptions}
          />
          {errors.whether_register_deduction_for_damage_maintained && (
            <ErrorText>{errors.whether_register_deduction_for_damage_maintained}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>3. Whether Register of wages maintained? [Section 50]</Label>
          <SelectDropdown
            value={registerFinesRule5}
            onSelect={setRegisterFinesRule5}
            options={yesNoOptions}
          />
          {errors.whether_register_fines_maintained_rule5 && (
            <ErrorText>{errors.whether_register_fines_maintained_rule5}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>4. Whether wages are paid on time? [Section 17]</Label>
          <SelectDropdown
            value={wagesPaidOnTime}
            onSelect={setWagesPaidOnTime}
            options={yesNoOptions}
          />
          {errors.whether_wages_paid_on_time && (
            <ErrorText>{errors.whether_wages_paid_on_time}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>5. Whether salaries/wages paid in bank accounts?</Label>
          <SelectDropdown
            value={salariesInBank}
            onSelect={setSalariesInBank}
            options={yesNoOptions}
          />
          {errors.whether_salaries_paid_in_their_bank_accounts && (
            <ErrorText>{errors.whether_salaries_paid_in_their_bank_accounts}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>6. Whether Annual Return submitted in Form IV?</Label>
          <SelectDropdown
            value={annualReturnRule17}
            onSelect={setAnnualReturnRule17}
            options={yesNoOptions}
          />
          {errors.whether_annual_return_submitted_rule17 && (
            <ErrorText>{errors.whether_annual_return_submitted_rule17}</ErrorText>
          )}
        </View>

        {/* ===== SECTION 5: C) Equal Remuneration Act ===== */}
        <SectionTitle>C) Observations under Equal Remuneration</SectionTitle>

        <View style={styles.formGroup}>
          <Label required>1. Whether equal remuneration paid to men and women for same work?</Label>
          <SelectDropdown
            value={equalRemuneration}
            onSelect={setEqualRemuneration}
            options={yesNoOptions}
          />
          {errors.whether_equal_renumeration_paid_men_women_workers && (
            <ErrorText>{errors.whether_equal_renumeration_paid_men_women_workers}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>2. Whether register is maintained by employer? (Section 8)</Label>
          <SelectDropdown
            value={registerMaintainedSection8}
            onSelect={setRegisterMaintainedSection8}
            options={yesNoOptions}
          />
          {errors.whether_register_maintained_by_employes_section8 && (
            <ErrorText>{errors.whether_register_maintained_by_employes_section8}</ErrorText>
          )}
        </View>

        {/* ===== SECTION 6: Employee Details ===== */}
        <SectionTitle>D. General Details of Employees</SectionTitle>

        <EmployeeTable
          title="Permanent / Regular Workers"
          categories={["Unskilled", "Semi-Skilled", "Skilled", "Highly Skilled"]}
          data={permanentEmployees}
          onChange={(field, value) =>
            setPermanentEmployees({ ...permanentEmployees, [field]: value })
          }
          prefix="permanent_employees"
          showApprentice
          remarksValue={permanentRemarks}
          onRemarksChange={setPermanentRemarks}
        />

        <EmployeeTable
          title="Temporary / Casual Workers"
          categories={["Unskilled", "Semi-Skilled", "Skilled", "Highly Skilled"]}
          data={temporaryEmployees}
          onChange={(field, value) =>
            setTemporaryEmployees({ ...temporaryEmployees, [field]: value })
          }
          prefix="temporary_employees"
          remarksValue={temporaryRemarks}
          onRemarksChange={setTemporaryRemarks}
        />

        <EmployeeTable
          title="Contract Labour"
          categories={["Unskilled", "Semi-Skilled", "Skilled", "Highly Skilled"]}
          data={contractEmployees}
          onChange={(field, value) =>
            setContractEmployees({ ...contractEmployees, [field]: value })
          }
          prefix="contract_employees"
          remarksValue={contractRemarks}
          onRemarksChange={setContractRemarks}
        />

        {/* ===== SECTION 7: Individual Workers ===== */}
        <SectionTitle>Individual Workers</SectionTitle>
        {individualWorkers.map((worker, index) => (
          <View key={index} style={styles.adolescentBlock}>
            <View style={styles.adolescentHeader}>
              <Text style={styles.adolescentTitle}>Worker #{index + 1}</Text>
              {index > 0 && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeWorker(index)}
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formGroup}>
              <Label required>Name</Label>
              <TextInputField
                value={worker.name}
                onChangeText={(val) => updateWorker(index, "name", val)}
                placeholder="Enter name"
              />
            </View>

            <View style={styles.formGroup}>
              <Label required>Designation</Label>
              <TextInputField
                value={worker.designation}
                onChangeText={(val) => updateWorker(index, "designation", val)}
                placeholder="Enter designation"
              />
            </View>

            <View style={styles.formGroup}>
              <Label required>Date of Joining</Label>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setActiveDateIndex(index)}
              >
                <Text style={worker.doj ? styles.dateText : styles.datePlaceholder}>
                  {worker.doj || "Select Date"}
                </Text>
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
              {activeDateIndex === index && (
                <DateTimePicker
                  value={worker.doj ? new Date(worker.doj) : new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Label required>Wages Paid</Label>
              <NumberInput
                value={worker.wages}
                onChangeText={(val) => updateWorker(index, "wages", val)}
                placeholder="Enter wages"
              />
            </View>

            <View style={styles.formGroup}>
              <Label>Payslip Upload</Label>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickPayslip(index)}
              >
                <Text style={styles.uploadBtnText}>
                  {worker.payslip_name || "Choose File"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <TouchableOpacity style={styles.addBtn} onPress={addWorker}>
          <Text style={styles.addBtnText}>Add Another Worker</Text>
        </TouchableOpacity>

        {/* ===== SECTION 8: Directions ===== */}
        <SectionTitle>
          Directions <Text style={styles.required}>*</Text>
        </SectionTitle>
        {directions.map((direction, index) => (
          <View key={index} style={styles.directionRow}>
            <View style={{ flex: 1 }}>
              <TextInputField
                value={direction}
                onChangeText={(val) => updateDirection(index, val)}
                placeholder="Enter Direction"
              />
            </View>
            {index === 0 ? (
              <TouchableOpacity
                style={styles.addDirectionBtn}
                onPress={addDirection}
              >
                <Text style={styles.addDirectionBtnText}>Add</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.removeDirectionBtn}
                onPress={() => removeDirection(index)}
              >
                <Text style={styles.removeDirectionBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* ===== SECTION 9: Additional Remarks ===== */}
        <View style={styles.formGroup}>
          <Label required>Additional Remarks</Label>
          <TextInputField
            value={additionalRemarks}
            onChangeText={setAdditionalRemarks}
            placeholder="Enter Remarks"
            multiline
            numberOfLines={3}
          />
          {errors.additional_remarks3 && (
            <ErrorText>{errors.additional_remarks3}</ErrorText>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save & Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    margin: 10,
    marginTop: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    marginTop: 20,
    color: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 10,
    color: "#444",
  },
  section: {
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  label: {
    flex: 1,
    marginRight: 10,
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  required: {
    color: "#e53935",
    fontWeight: "bold",
  },
  formGroup: {
    marginBottom: 16,
  },
  errorText: {
    color: "#e53935",
    fontSize: 12,
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fafafa",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fafafa",
    width: 80,
    textAlign: "center",
  },
  dropdownButton: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 15,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  dropdownPlaceholder: {
    fontSize: 15,
    color: "#999",
    flex: 1,
    marginRight: 8,
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxHeight: "70%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  modalClose: {
    fontSize: 18,
    color: "#999",
    fontWeight: "600",
    padding: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  optionItemSelected: {
    backgroundColor: "#E3F2FD",
  },
  optionText: {
    fontSize: 15,
    color: "#333",
  },
  optionTextSelected: {
    color: "#1976D2",
    fontWeight: "600",
  },
  checkmark: {
    fontSize: 16,
    color: "#1976D2",
    fontWeight: "bold",
  },
  optionSeparator: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 18,
  },
  radioGroup: {
    flexDirection: "row",
    marginTop: 8,
    flexWrap: "wrap",
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#1976D2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  radioCircleSelected: {
    borderColor: "#1976D2",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1976D2",
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
  },
  tableContainer: {
    marginVertical: 12,
  },
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableHeaderCell: {
    fontWeight: "bold",
    color: "#555",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 6,
  },
  tableCell: {
    paddingHorizontal: 8,
    fontSize: 13,
    color: "#333",
    textAlign: "center",
  },
  adolescentBlock: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  adolescentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  adolescentTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  removeBtn: {
    backgroundColor: "#e53935",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  addBtn: {
    backgroundColor: "#1976D2",
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  uploadBtn: {
    borderWidth: 1,
    borderColor: "#1976D2",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  uploadBtnText: {
    color: "#1976D2",
    fontSize: 14,
    fontWeight: "500",
  },
  directionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  addDirectionBtn: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: "center",
  },
  addDirectionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  removeDirectionBtn: {
    backgroundColor: "#e53935",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: "center",
  },
  removeDirectionBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15,
  },
  backButton: {
    backgroundColor: "#757575",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fafafa",
    marginTop: 6,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
  },
  datePlaceholder: {
    fontSize: 14,
    color: "#999",
  },
  calendarIcon: {
    fontSize: 16,
  },
});