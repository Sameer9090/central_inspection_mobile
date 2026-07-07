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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Reusable components
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
  required = false,
}: {
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  required?: boolean;
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

// Table Row Component for worker tables
const WorkerTable = ({
  title,
  categories,
  data,
  onChange,
  showApprentice = false,
}: {
  title: string;
  categories: string[];
  data: any;
  onChange: (field: string, value: string) => void;
  showApprentice?: boolean;
}) => (
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
            value={
              data[`${cat.toLowerCase().replace(/[-\s]/g, "_")}_male`] || ""
            }
            onChangeText={(val) =>
              onChange(`${cat.toLowerCase().replace(/[-\s]/g, "_")}_male`, val)
            }
            placeholder="0"
          />
          <NumberInput
            value={
              data[`${cat.toLowerCase().replace(/[-\s]/g, "_")}_female`] || ""
            }
            onChangeText={(val) =>
              onChange(
                `${cat.toLowerCase().replace(/[-\s]/g, "_")}_female`,
                val,
              )
            }
            placeholder="0"
          />
        </View>
      ))}
      {showApprentice && (
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 2 }]}>Apprentice</Text>
          <NumberInput
            value={data["apprentice_male"] || ""}
            onChangeText={(val) => onChange("apprentice_male", val)}
            placeholder="0"
          />
          <NumberInput
            value={data["apprentice_female"] || ""}
            onChangeText={(val) => onChange("apprentice_female", val)}
            placeholder="0"
          />
        </View>
      )}
    </View>
  </View>
);

export default function ASEForm({
  inspectionASE,
  user,
  onSave,
  onBack,
  currentStep,
  sectionsStatus,
  referenceNumber,
}: {
  inspectionASE: any;
  user: any;
  onSave?: (data: any) => void;
  onBack?: () => void;
  currentStep?: string;
  sectionsStatus?: Record<string, boolean>;
  referenceNumber?: string;
}) {
  // ===== SECTION 1: Workplace Safety and Health Measures =====
  const [cleanlinessWorkplace, setCleanlinessWorkplace] = useState(
    inspectionASE?.cleanliness_workplace_ase === "Yes",
  );
  const [adequateLighting, setAdequateLighting] = useState(
    inspectionASE?.adequate_lighting_ase === "Yes",
  );
  const [properVentilation, setProperVentilation] = useState(
    inspectionASE?.proper_ventilation_ase === "Yes",
  );
  const [firePreventionMeasures, setFirePreventionMeasures] = useState(
    inspectionASE?.fire_prevention_measures_ase === "Yes",
  );
  const [accidentPrevention, setAccidentPrevention] = useState(
    inspectionASE?.accident_prevention_ase === "Yes",
  );
  const [drinkingWater, setDrinkingWater] = useState(
    inspectionASE?.drinking_water_ase === "Yes",
  );
  const [latrineUrinal, setLatrineUrinal] = useState(
    inspectionASE?.latrine_urinal_ase === "Yes",
  );
  const [firstAid, setFirstAid] = useState(
    inspectionASE?.first_aid_ase === "Yes",
  );
  const [crecheFacility, setCrecheFacility] = useState(
    inspectionASE?.creche_facility_ase === "Yes",
  );
  const [canteen, setCanteen] = useState(inspectionASE?.canteen_ase === "Yes");

  // ===== SECTION 2: Inspection Table =====
  const [issueOfAppointmentLetters, setIssueOfAppointmentLetters] = useState(
    inspectionASE?.issue_of_appointment_letters_ase || "",
  );
  const [issueOfIdentityCard, setIssueOfIdentityCard] = useState(
    inspectionASE?.issue_of_identity_card_ase || "",
  );
  const [issueOfPayslip, setIssueOfPayslip] = useState(
    inspectionASE?.issue_of_payslip_ase || "",
  );
  const [applicableOfESIC, setApplicableOfESIC] = useState(
    inspectionASE?.applicable_of_ESIC_ase || "",
  );
  const [esicNoOfEmpl, setEsicNoOfEmpl] = useState(
    inspectionASE?.ESIC_ase_no_of_empl || "",
  );
  const [maintenanceOfRegisters, setMaintenanceOfRegisters] = useState(
    inspectionASE?.maintenance_of_registers_ase || "",
  );
  const [annualRepSubmitted, setAnnualRepSubmitted] = useState(
    inspectionASE?.whether_annual_rep_submitted_ase || "",
  );
  const [isAdolescentEmployed, setIsAdolescentEmployed] = useState(
    inspectionASE?.is_adolescent_employed_ase || "",
  );

  // ===== SECTION 3: Adolescent Worker Details =====
  const [adolescentDetails, setAdolescentDetails] = useState(
    inspectionASE?.adolescent_details_ase || [
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
    ],
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
    const updated = [...adolescentDetails];
    updated[index] = { ...updated[index], [field]: value };
    setAdolescentDetails(updated);
  };

  const pickAgeProofDocument = async (index: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled === false) {
        const file = result.assets[0];
        updateAdolescent(index, 'age_proof', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
          size: file.size,
        });
        updateAdolescent(index, 'age_proof_name', file.name);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };
  // ===== SECTION 4: Establishment / Employer Details =====
  const [nameAddressOfEmployer, setNameAddressOfEmployer] = useState(
    inspectionASE?.name_address_of_employer || "",
  );
  const [establishmentName, setEstablishmentName] = useState(
    inspectionASE?.establishment_name || "",
  );
  const [contactNumberEmail, setContactNumberEmail] = useState(
    inspectionASE?.contact_number_email || "",
  );
  const [dateOfCommencement, setDateOfCommencement] = useState(
    inspectionASE?.date_of_commencement || "",
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openingClosingHours, setOpeningClosingHours] = useState(
    inspectionASE?.opening_and_closing_hours || "",
  );
  const [certificateRegistrationDate, setCertificateRegistrationDate] =
    useState(inspectionASE?.certificate_registration_date || "");
  const [registrationNumber, setRegistrationNumber] = useState(
    inspectionASE?.registration_number || "",
  );
  const [certificateRenewalObtained, setCertificateRenewalObtained] = useState(
    inspectionASE?.certificate_renewal_obtained || "",
  );
  const [whetherCertificateDisplayed, setWhetherCertificateDisplayed] =
    useState(inspectionASE?.whether_certificate_displayed || "");

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      setDateOfCommencement(`${year}-${month}-${day}`);
    }
  };

  // ===== SECTION 5: Permanent Workers =====
  const [permanentWorkers, setPermanentWorkers] = useState({
    unskilled_male: inspectionASE?.permanent_unskilled_male || "",
    unskilled_female: inspectionASE?.permanent_unskilled_female || "",
    semiskilled_male: inspectionASE?.permanent_semiskilled_male || "",
    semiskilled_female: inspectionASE?.permanent_semiskilled_female || "",
    skilled_male: inspectionASE?.permanent_skilled_male || "",
    skilled_female: inspectionASE?.permanent_skilled_female || "",
  });

  // ===== SECTION 6: Temporary/Casual Workers =====
  const [temporaryWorkers, setTemporaryWorkers] = useState({
    unskilled_male: inspectionASE?.temporary_unskilled_male || "",
    unskilled_female: inspectionASE?.temporary_unskilled_female || "",
    semiskilled_male: inspectionASE?.temporary_semiskilled_male || "",
    semiskilled_female: inspectionASE?.temporary_semiskilled_female || "",
    skilled_male: inspectionASE?.temporary_skilled_male || "",
    skilled_female: inspectionASE?.temporary_skilled_female || "",
    apprentice_male: inspectionASE?.temporary_apprentice_male || "",
    apprentice_female: inspectionASE?.temporary_apprentice_female || "",
  });

  // ===== SECTION 7: Contract Labour =====
  const [contractLabour, setContractLabour] = useState({
    unskilled_male: inspectionASE?.contract_unskilled_male || "",
    unskilled_female: inspectionASE?.contract_unskilled_female || "",
    semiskilled_male: inspectionASE?.contract_semiskilled_male || "",
    semiskilled_female: inspectionASE?.contract_semiskilled_female || "",
    skilled_male: inspectionASE?.contract_skilled_male || "",
    skilled_female: inspectionASE?.contract_skilled_female || "",
  });

  // ===== SECTION 8: Rate of Wages Paid =====
  const [wagesPaid, setWagesPaid] = useState({
    unskilled_male: inspectionASE?.wages_paid_unskilled_male || "",
    unskilled_female: inspectionASE?.wages_paid_unskilled_female || "",
    semiskilled_male: inspectionASE?.wages_paid_semiskilled_male || "",
    semiskilled_female: inspectionASE?.wages_paid_semiskilled_female || "",
    skilled_male: inspectionASE?.wages_paid_skilled_male || "",
    skilled_female: inspectionASE?.wages_paid_skilled_female || "",
  });

  // ===== SECTION 9: Additional Compliance =====
  const [whetherNotifiedWagesPaid, setWhetherNotifiedWagesPaid] = useState(
    inspectionASE?.whether_notified_wages_paid || "",
  );
  const [hoursOfWorkADay, setHoursOfWorkADay] = useState(
    inspectionASE?.hours_of_work_a_day || "",
  );
  const [workingHoursOfFemale, setWorkingHoursOfFemale] = useState(
    inspectionASE?.working_hours_of_female || "",
  );
  const [whetherWeeklyHolidaysProvided, setWhetherWeeklyHolidaysProvided] =
    useState(inspectionASE?.whether_weekly_holidays_provided || "");
  const [whetherPrescribedRegMaintained, setWhetherPrescribedRegMaintained] =
    useState(inspectionASE?.wheather_prescribed_reg_maintained || "");
  const [registerOfHoursOfWork, setRegisterOfHoursOfWork] = useState(
    inspectionASE?.register_of_hours_of_work || "",
  );
  const [registerOfOvertime, setRegisterOfOvertime] = useState(
    inspectionASE?.register_of_overtime || "",
  );
  const [registerOfEmployment, setRegisterOfEmployment] = useState(
    inspectionASE?.register_of_employment || "",
  );
  const [registerOfLeave, setRegisterOfLeave] = useState(
    inspectionASE?.register_of_leave || "",
  );
  const [violationOfProvisions, setViolationOfProvisions] = useState(
    inspectionASE?.violation_of_provisions || "",
  );
  const [directions, setDirections] = useState(
    inspectionASE?.ase_directions || [""],
  );
  const [additionalRemarks, setAdditionalRemarks] = useState(
    inspectionASE?.additional_remarks || "",
  );

  const addDirection = () => {
    setDirections([...directions, ""]);
  };

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

  // ===== VALIDATION & SAVE =====
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nameAddressOfEmployer.trim())
      newErrors.name_address_of_employer = "This field is required";
    if (!establishmentName.trim())
      newErrors.establishment_name = "This field is required";
    if (!contactNumberEmail.trim())
      newErrors.contact_number_email = "This field is required";
    else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const mobilePattern = /^\d{10}$/;
      const hasEmail = emailPattern.test(contactNumberEmail);
      const hasMobile = mobilePattern.test(contactNumberEmail.replace(/\D/g, ""));
      if (!hasEmail && !hasMobile) {
        newErrors.contact_number_email = "Please enter a valid email or 10-digit mobile number";
      }
    }
    if (!openingClosingHours.trim())
      newErrors.opening_and_closing_hours = "This field is required";
    if (!certificateRegistrationDate)
      newErrors.certificate_registration_date = "This field is required";
    if (!registrationNumber.trim())
      newErrors.registration_number = "This field is required";
    if (!certificateRenewalObtained)
      newErrors.certificate_renewal_obtained = "This field is required";
    if (!whetherCertificateDisplayed.trim())
      newErrors.whether_certificate_displayed = "This field is required";
    if (!whetherNotifiedWagesPaid)
      newErrors.whether_notified_wages_paid = "This field is required";
    if (!hoursOfWorkADay)
      newErrors.hours_of_work_a_day = "This field is required";
    if (!workingHoursOfFemale)
      newErrors.working_hours_of_female = "This field is required";
    if (!whetherWeeklyHolidaysProvided.trim())
      newErrors.whether_weekly_holidays_provided = "This field is required";
    if (!whetherPrescribedRegMaintained)
      newErrors.wheather_prescribed_reg_maintained = "This field is required";
    if (!registerOfHoursOfWork)
      newErrors.register_of_hours_of_work = "This field is required";
    if (!registerOfOvertime)
      newErrors.register_of_overtime = "This field is required";
    if (!registerOfEmployment)
      newErrors.register_of_employment = "This field is required";
    if (!registerOfLeave)
      newErrors.register_of_leave = "This field is required";
    if (!violationOfProvisions)
      newErrors.violation_of_provisions = "This field is required";
    if (!additionalRemarks.trim())
      newErrors.additional_remarks = "This field is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      Alert.alert("Validation Error", "Please fill all required fields");
      return;
    }

    const formData = {
      // Meta fields for API
      reference_number: referenceNumber || "",
      inspection_type: "ase",

      // Safety measures
      cleanliness_workplace_ase: cleanlinessWorkplace ? "Yes" : "No",
      adequate_lighting_ase: adequateLighting ? "Yes" : "No",
      proper_ventilation_ase: properVentilation ? "Yes" : "No",
      fire_prevention_measures_ase: firePreventionMeasures ? "Yes" : "No",
      accident_prevention_ase: accidentPrevention ? "Yes" : "No",
      drinking_water_ase: drinkingWater ? "Yes" : "No",
      latrine_urinal_ase: latrineUrinal ? "Yes" : "No",
      first_aid_ase: firstAid ? "Yes" : "No",
      creche_facility_ase: crecheFacility ? "Yes" : "No",
      canteen_ase: canteen ? "Yes" : "No",

      // Inspection table
      issue_of_appointment_letters_ase: issueOfAppointmentLetters,
      issue_of_identity_card_ase: issueOfIdentityCard,
      issue_of_payslip_ase: issueOfPayslip,
      applicable_of_ESIC_ase: applicableOfESIC,
      ESIC_ase_no_of_empl: esicNoOfEmpl,
      maintenance_of_registers_ase: maintenanceOfRegisters,
      whether_annual_rep_submitted_ase: annualRepSubmitted,
      is_adolescent_employed_ase: isAdolescentEmployed,

      // Adolescent details
      adolescent_details_ase: adolescentDetails,

      // Employer details
      name_address_of_employer: nameAddressOfEmployer,
      establishment_name: establishmentName,
      contact_number_email: contactNumberEmail,
      date_of_commencement: dateOfCommencement,
      opening_and_closing_hours: openingClosingHours,
      certificate_registration_date: certificateRegistrationDate,
      registration_number: registrationNumber,
      certificate_renewal_obtained: certificateRenewalObtained,
      whether_certificate_displayed: whetherCertificateDisplayed,

      // Workers
      permanent_unskilled_male: permanentWorkers.unskilled_male,
      permanent_unskilled_female: permanentWorkers.unskilled_female,
      permanent_semiskilled_male: permanentWorkers.semiskilled_male,
      permanent_semiskilled_female: permanentWorkers.semiskilled_female,
      permanent_skilled_male: permanentWorkers.skilled_male,
      permanent_skilled_female: permanentWorkers.skilled_female,

      temporary_unskilled_male: temporaryWorkers.unskilled_male,
      temporary_unskilled_female: temporaryWorkers.unskilled_female,
      temporary_semiskilled_male: temporaryWorkers.semiskilled_male,
      temporary_semiskilled_female: temporaryWorkers.semiskilled_female,
      temporary_skilled_male: temporaryWorkers.skilled_male,
      temporary_skilled_female: temporaryWorkers.skilled_female,
      temporary_apprentice_male: temporaryWorkers.apprentice_male,
      temporary_apprentice_female: temporaryWorkers.apprentice_female,

      contract_unskilled_male: contractLabour.unskilled_male,
      contract_unskilled_female: contractLabour.unskilled_female,
      contract_semiskilled_male: contractLabour.semiskilled_male,
      contract_semiskilled_female: contractLabour.semiskilled_female,
      contract_skilled_male: contractLabour.skilled_male,
      contract_skilled_female: contractLabour.skilled_female,

      // Wages
      wages_paid_unskilled_male: wagesPaid.unskilled_male,
      wages_paid_unskilled_female: wagesPaid.unskilled_female,
      wages_paid_semiskilled_male: wagesPaid.semiskilled_male,
      wages_paid_semiskilled_female: wagesPaid.semiskilled_female,
      wages_paid_skilled_male: wagesPaid.skilled_male,
      wages_paid_skilled_female: wagesPaid.skilled_female,

      // Additional compliance
      whether_notified_wages_paid: whetherNotifiedWagesPaid,
      hours_of_work_a_day: hoursOfWorkADay,
      working_hours_of_female: workingHoursOfFemale,
      whether_weekly_holidays_provided: whetherWeeklyHolidaysProvided,
      wheather_prescribed_reg_maintained: whetherPrescribedRegMaintained,
      register_of_hours_of_work: registerOfHoursOfWork,
      register_of_overtime: registerOfOvertime,
      register_of_employment: registerOfEmployment,
      register_of_leave: registerOfLeave,
      violation_of_provisions: violationOfProvisions,
      ase_directions: directions,
      additional_remarks: additionalRemarks,
    };

    onSave?.(formData);
  };

  const hoursOptions = Array.from({ length: 15 }, (_, i) => String(i + 1));
  const yesNoOptions = ["Yes", "No"];
  const yesNoDataOptions = ["Yes", "No", "Data not available"];

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>ASE Inspection</Text>

        {/* ===== SECTION 1: Workplace Safety and Health Measures ===== */}
        <SectionTitle>Workplace Safety and Health Measures</SectionTitle>

        <Row>
          <Label>Ensuring proper cleanliness in the workplace</Label>
          <Switch
            value={cleanlinessWorkplace}
            onValueChange={setCleanlinessWorkplace}
          />
        </Row>

        <Row>
          <Label>Providing adequate lighting in all work areas</Label>
          <Switch
            value={adequateLighting}
            onValueChange={setAdequateLighting}
          />
        </Row>

        <Row>
          <Label>
            Maintaining proper ventilation to ensure a healthy working
            environment
          </Label>
          <Switch
            value={properVentilation}
            onValueChange={setProperVentilation}
          />
        </Row>

        <Row>
          <Label>
            Taking necessary measures for prevention of fire, including safety
            arrangements and emergency preparedness
          </Label>
          <Switch
            value={firePreventionMeasures}
            onValueChange={setFirePreventionMeasures}
          />
        </Row>

        <Row>
          <Label>
            Taking all necessary preventive measures to avoid accidents at the
            workplace
          </Label>
          <Switch
            value={accidentPrevention}
            onValueChange={setAccidentPrevention}
          />
        </Row>

        <Row>
          <Label>Drinking Water (Section 18)</Label>
          <Switch value={drinkingWater} onValueChange={setDrinkingWater} />
        </Row>

        <Row>
          <Label>Latrine & Urinal (Section 19)</Label>
          <Switch value={latrineUrinal} onValueChange={setLatrineUrinal} />
        </Row>

        <Row>
          <Label>First Aid (Section 19)</Label>
          <Switch value={firstAid} onValueChange={setFirstAid} />
        </Row>

        <Row>
          <Label>Creche Facility (Section 20)</Label>
          <Switch value={crecheFacility} onValueChange={setCrecheFacility} />
        </Row>

        <Row>
          <Label>Canteen (Section 22)</Label>
          <Switch value={canteen} onValueChange={setCanteen} />
        </Row>

        {/* ===== SECTION 2: Inspection Table ===== */}
        <SectionTitle>Inspection Criteria</SectionTitle>

        <View style={styles.formGroup}>
          <Label required>1. Issue of appointment letters (Section 16)</Label>
          <SelectDropdown
            value={issueOfAppointmentLetters}
            onSelect={setIssueOfAppointmentLetters}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>2. Issue of identity cards (Section 16)</Label>
          <SelectDropdown
            value={issueOfIdentityCard}
            onSelect={setIssueOfIdentityCard}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>3. Issue of payslips</Label>
          <SelectDropdown
            value={issueOfPayslip}
            onSelect={setIssueOfPayslip}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            4. Applicability of ESIC to the establishment as per the Employees'
            State Insurance Act, 1948
          </Label>
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
        </View>

        <View style={styles.formGroup}>
          <Label required>
            5. Maintenance of registers against each employee (Section 25)
          </Label>
          <SelectDropdown
            value={maintenanceOfRegisters}
            onSelect={setMaintenanceOfRegisters}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            6. Whether annual return is submitted or not? (Section 26)
          </Label>
          <SelectDropdown
            value={annualRepSubmitted}
            onSelect={setAnnualRepSubmitted}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>7. Has any adolescent been employed?</Label>
          <SelectDropdown
            value={isAdolescentEmployed}
            onSelect={setIsAdolescentEmployed}
            options={yesNoOptions}
          />
        </View>

        {/* ===== SECTION 3: Adolescent Worker Details ===== */}
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
                    a. Whether intimation has been provided to the concerned
                    Labour Office
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
                    onChangeText={(val) =>
                      updateAdolescent(index, "address", val)
                    }
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
                  <Label required>
                    f. Whether engaged in hazardous occupations
                  </Label>
                  <SelectDropdown
                    value={adolescent.hazardous_work}
                    onSelect={(val) =>
                      updateAdolescent(index, "hazardous_work", val)
                    }
                    options={yesNoOptions}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>g. Working hours</Label>
                  <TextInputField
                    value={adolescent.working_hours}
                    onChangeText={(val) =>
                      updateAdolescent(index, "working_hours", val)
                    }
                    placeholder="Enter working hours"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>h. Whether maintains register or not</Label>
                  <SelectDropdown
                    value={adolescent.maintain_register}
                    onSelect={(val) =>
                      updateAdolescent(index, "maintain_register", val)
                    }
                    options={yesNoOptions}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label required>i. Wage paid to the adolescent</Label>
                  <NumberInput
                    value={adolescent.wage_amount}
                    onChangeText={(val) =>
                      updateAdolescent(index, "wage_amount", val)
                    }
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

        {/* ===== SECTION 4: Establishment / Employer Details ===== */}
        <SectionTitle>Establishment / Employer Details</SectionTitle>

        <View style={styles.formGroup}>
          <Label required>
            Name and address of Employer / Proprietor / Managing Director /
            Partner / Manager / Contractor
          </Label>
          <TextInputField
            value={nameAddressOfEmployer}
            onChangeText={setNameAddressOfEmployer}
            placeholder="Enter Details"
            maxLength={255}
          />
          {errors.name_address_of_employer && (
            <ErrorText>{errors.name_address_of_employer}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>Name and Address of the Establishment</Label>
          <TextInputField
            value={establishmentName}
            onChangeText={setEstablishmentName}
            placeholder="Enter Details"
            maxLength={255}
          />
          {errors.establishment_name && (
            <ErrorText>{errors.establishment_name}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>Contact Number and e-mail</Label>
          <TextInputField
            value={contactNumberEmail}
            onChangeText={setContactNumberEmail}
            placeholder="Enter Details"
            maxLength={255}
          />
          {errors.contact_number_email && (
            <ErrorText>{errors.contact_number_email}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label>Date of Commencement of business</Label>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={dateOfCommencement ? styles.dateText : styles.datePlaceholder}>
              {dateOfCommencement || "Select Date"}
            </Text>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateOfCommencement ? new Date(dateOfCommencement) : new Date()}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>Opening and closing hours (under Sec-34)</Label>
          <TextInputField
            value={openingClosingHours}
            onChangeText={setOpeningClosingHours}
            placeholder="Enter Details"
            maxLength={255}
          />
          {errors.opening_and_closing_hours && (
            <ErrorText>{errors.opening_and_closing_hours}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            Certificate of Registration and Date of Registration (Obtained / Not
            obtained)
          </Label>
          <RadioGroup
            options={yesNoOptions}
            selected={certificateRegistrationDate}
            onSelect={setCertificateRegistrationDate}
            required
          />
          {errors.certificate_registration_date && (
            <ErrorText>{errors.certificate_registration_date}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>Registration Number</Label>
          <TextInputField
            value={registrationNumber}
            onChangeText={setRegistrationNumber}
            placeholder="Enter Details"
            maxLength={255}
          />
          {errors.registration_number && (
            <ErrorText>{errors.registration_number}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            Certificate of Renewal of Registration under Sec-7 (Obtained / Not
            obtained)
          </Label>
          <RadioGroup
            options={yesNoOptions}
            selected={certificateRenewalObtained}
            onSelect={setCertificateRenewalObtained}
            required
          />
          {errors.certificate_renewal_obtained && (
            <ErrorText>{errors.certificate_renewal_obtained}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            Whether Registration / Renewal Certificate displayed or not (under
            Sec-6)
          </Label>
          <TextInputField
            value={whetherCertificateDisplayed}
            onChangeText={setWhetherCertificateDisplayed}
            placeholder="Enter Details"
            maxLength={255}
          />
          {errors.whether_certificate_displayed && (
            <ErrorText>{errors.whether_certificate_displayed}</ErrorText>
          )}
        </View>

        {/* ===== SECTION 5: Permanent Workers ===== */}
        <WorkerTable
          title="Number of workers employed (Permanent / Regular Workers)"
          categories={["Unskilled", "Semi-Skilled", "Skilled"]}
          data={permanentWorkers}
          onChange={(field, value) =>
            setPermanentWorkers({ ...permanentWorkers, [field]: value })
          }
        />

        {/* ===== SECTION 6: Temporary/Casual Workers ===== */}
        <WorkerTable
          title="Number of workers employed (Temporary/Casual worker)"
          categories={["Unskilled", "Semi-Skilled", "Skilled"]}
          data={temporaryWorkers}
          onChange={(field, value) =>
            setTemporaryWorkers({ ...temporaryWorkers, [field]: value })
          }
          showApprentice
        />

        {/* ===== SECTION 7: Contract Labour ===== */}
        <WorkerTable
          title="Number of workers employed (Contract labour)"
          categories={["Unskilled", "Semi-Skilled", "Skilled"]}
          data={contractLabour}
          onChange={(field, value) =>
            setContractLabour({ ...contractLabour, [field]: value })
          }
        />

        {/* ===== SECTION 8: Rate of Wages Paid ===== */}
        <WorkerTable
          title="Rate of wages paid"
          categories={["Unskilled", "Semi-Skilled", "Skilled"]}
          data={wagesPaid}
          onChange={(field, value) =>
            setWagesPaid({ ...wagesPaid, [field]: value })
          }
        />

        {/* ===== SECTION 9: Additional Compliance ===== */}
        <SectionTitle>Additional Compliance Details</SectionTitle>

        <View style={styles.formGroup}>
          <Label required>
            Whether the notified wages have been paid (Yes/No)
          </Label>
          <RadioGroup
            options={yesNoDataOptions}
            selected={whetherNotifiedWagesPaid}
            onSelect={setWhetherNotifiedWagesPaid}
          />
          {errors.whether_notified_wages_paid && (
            <ErrorText>{errors.whether_notified_wages_paid}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            Hours of Work in a day of the workers (under Sec-13)
          </Label>
          <SelectDropdown
            value={hoursOfWorkADay}
            onSelect={setHoursOfWorkADay}
            options={hoursOptions}
            placeholder="Select Hours"
          />
          {errors.hours_of_work_a_day && (
            <ErrorText>{errors.hours_of_work_a_day}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            Working hours of female employees under Sec 11(2)
          </Label>
          <SelectDropdown
            value={workingHoursOfFemale}
            onSelect={setWorkingHoursOfFemale}
            options={hoursOptions}
            placeholder="Select Hours"
          />
          {errors.working_hours_of_female && (
            <ErrorText>{errors.working_hours_of_female}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            Whether weekly holidays provided to employees under Sec-15(2)
          </Label>
          <TextInputField
            value={whetherWeeklyHolidaysProvided}
            onChangeText={setWhetherWeeklyHolidaysProvided}
            placeholder="Enter Details"
            maxLength={255}
          />
          {errors.whether_weekly_holidays_provided && (
            <ErrorText>{errors.whether_weekly_holidays_provided}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            Whether prescribed registers are maintained under Sec-25
          </Label>
          <RadioGroup
            options={yesNoOptions}
            selected={whetherPrescribedRegMaintained}
            onSelect={setWhetherPrescribedRegMaintained}
          />
          {errors.wheather_prescribed_reg_maintained && (
            <ErrorText>{errors.wheather_prescribed_reg_maintained}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            (a) Register of hours of work and interval of rest
          </Label>
          <RadioGroup
            options={yesNoOptions}
            selected={registerOfHoursOfWork}
            onSelect={setRegisterOfHoursOfWork}
          />
          {errors.register_of_hours_of_work && (
            <ErrorText>{errors.register_of_hours_of_work}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>(b) Register of overtime</Label>
          <RadioGroup
            options={yesNoOptions}
            selected={registerOfOvertime}
            onSelect={setRegisterOfOvertime}
          />
          {errors.register_of_overtime && (
            <ErrorText>{errors.register_of_overtime}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>(c) Register of employment</Label>
          <RadioGroup
            options={yesNoOptions}
            selected={registerOfEmployment}
            onSelect={setRegisterOfEmployment}
          />
          {errors.register_of_employment && (
            <ErrorText>{errors.register_of_employment}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>(d) Register of Leave</Label>
          <RadioGroup
            options={yesNoOptions}
            selected={registerOfLeave}
            onSelect={setRegisterOfLeave}
          />
          {errors.register_of_leave && (
            <ErrorText>{errors.register_of_leave}</ErrorText>
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            Any other violation of the provisions of the Act noticed
          </Label>
          <RadioGroup
            options={yesNoOptions}
            selected={violationOfProvisions}
            onSelect={setViolationOfProvisions}
          />
          {errors.violation_of_provisions && (
            <ErrorText>{errors.violation_of_provisions}</ErrorText>
          )}
        </View>

        {/* Directions */}
        <SectionTitle>Directions <Text style={styles.required}>*</Text></SectionTitle>
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

        {/* Remarks */}
        <View style={styles.formGroup}>
          <Label required>Additional Remarks</Label>
          <TextInputField
            value={additionalRemarks}
            onChangeText={setAdditionalRemarks}
            placeholder="Enter Remarks"
            multiline
            numberOfLines={3}
          />
          {errors.additional_remarks && (
            <ErrorText>{errors.additional_remarks}</ErrorText>
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