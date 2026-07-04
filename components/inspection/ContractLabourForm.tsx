import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
}) => (
  <TextInput
    style={[styles.textInput, multiline && styles.textArea]}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#999"
    multiline={multiline}
    numberOfLines={numberOfLines}
  />
);

export default function ContractLabourForm({
  inspectionContract,
  user,
  onSave,
  onBack,
  currentStep,
  sectionsStatus,
}: {
  inspectionContract: any;
  user: any;
  onSave?: (data: any) => void;
  onBack?: () => void;
  currentStep?: string;
  sectionsStatus?: Record<string, boolean>;
}) {
  // ===== SECTION 1: Workplace Safety and Health Measures =====
  const [cleanlinessWorkplace, setCleanlinessWorkplace] = useState(
    inspectionContract?.cleanliness_workplace_contract === "Yes"
  );
  const [adequateLighting, setAdequateLighting] = useState(
    inspectionContract?.adequate_lighting_contract === "Yes"
  );
  const [properVentilation, setProperVentilation] = useState(
    inspectionContract?.proper_ventilation_contract === "Yes"
  );
  const [firePreventionMeasures, setFirePreventionMeasures] = useState(
    inspectionContract?.fire_prevention_measures_contract === "Yes"
  );
  const [accidentPrevention, setAccidentPrevention] = useState(
    inspectionContract?.accident_prevention_contract === "Yes"
  );

  // ===== SECTION 2: Inspection Criteria Table =====
  const [issueOfAppointmentLetters, setIssueOfAppointmentLetters] = useState(
    inspectionContract?.issue_of_appointment_letters_contract || ""
  );
  const [issueOfIdentityCard, setIssueOfIdentityCard] = useState(
    inspectionContract?.issue_of_identity_card_contract || ""
  );
  const [issueOfPayslip, setIssueOfPayslip] = useState(
    inspectionContract?.issue_of_payslip_contract || ""
  );
  const [applicableOfESIC, setApplicableOfESIC] = useState(
    inspectionContract?.applicable_of_ESIC_contract || ""
  );
  const [esicNoOfEmpl, setEsicNoOfEmpl] = useState(
    inspectionContract?.ESIC_contract_no_of_empl || ""
  );
  const [maintenanceOfRegisters, setMaintenanceOfRegisters] = useState(
    inspectionContract?.maintenance_of_registers_contract || ""
  );
  const [annualRepSubmitted, setAnnualRepSubmitted] = useState(
    inspectionContract?.whether_annual_rep_submitted_contract || ""
  );
  const [isAdolescentEmployed, setIsAdolescentEmployed] = useState(
    inspectionContract?.is_adolescent_employed_contract || ""
  );

  // ===== SECTION 3: Adolescent Worker Details =====
  const [adolescentDetails, setAdolescentDetails] = useState(
    inspectionContract?.adolescent_details_contract || [
      {
        labour_office_intimation: "",
        name: "",
        address: "",
        age: "",
        age_proof: null,
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

  // ===== SECTION 4: Contract Labour Provisions Table =====
  const [whetherLicenseObtained, setWhetherLicenseObtained] = useState(
    inspectionContract?.whether_license_obtained || ""
  );
  const [whetherContractLabourNumbering, setWhetherContractLabourNumbering] = useState(
    inspectionContract?.whether_contract_labour_numbering || ""
  );
  const [whetherNoticesRegardingRatesOfWages, setWhetherNoticesRegardingRatesOfWages] = useState(
    inspectionContract?.whether_notices_regarding_rates_of_wages || ""
  );
  const [whetherNoticeRegardingNames, setWhetherNoticeRegardingNames] = useState(
    inspectionContract?.whether_notice_regarding_names || ""
  );
  const [whetherCopyOfEachNoticeDisplayed, setWhetherCopyOfEachNoticeDisplayed] = useState(
    inspectionContract?.whether_copy_of_each_notice_displayed || ""
  );
  const [whetherNoticesShowingWagePeriod, setWhetherNoticesShowingWagePeriod] = useState(
    inspectionContract?.whether_notices_showing_wage_period || ""
  );
  const [whetherIntimationOfCommencement, setWhetherIntimationOfCommencement] = useState(
    inspectionContract?.whether_intimation_of_commencement || ""
  );
  const [whetherHalfYearlyReturn, setWhetherHalfYearlyReturn] = useState(
    inspectionContract?.whether_half_yearly_return || ""
  );
  const [whetherContractorHasEnsuredPresenceOfRepresentative, setWhetherContractorHasEnsuredPresenceOfRepresentative] = useState(
    inspectionContract?.whether_contractor_has_ensured_presence_of_representative || ""
  );
  const [whetherContractorEnsuredPaymentOfWages, setWhetherContractorEnsuredPaymentOfWages] = useState(
    inspectionContract?.whether_contractor_ensured_payment_of_wages || ""
  );
  const [whetherRegisterOfPersonMaintained, setWhetherRegisterOfPersonMaintained] = useState(
    inspectionContract?.whether_register_of_person_maintained || ""
  );
  const [whetherWageRegisterMaintained, setWhetherWageRegisterMaintained] = useState(
    inspectionContract?.whether_wage_register_maintained || ""
  );
  const [whetherContractorObtainedSigThumbImpression, setWhetherContractorObtainedSigThumbImpression] = useState(
    inspectionContract?.whether_contractor_obtained_sig_thumb_impression || ""
  );
  const [whetherWelfareFacilitiesRegardingDrinkingWater, setWhetherWelfareFacilitiesRegardingDrinkingWater] = useState(
    inspectionContract?.whether_welfare_facilities_regarding_drinking_water || ""
  );
  const [whetherContractorCrecheFacility, setWhetherContractorCrecheFacility] = useState(
    inspectionContract?.whether_contractor_creche_facility || ""
  );
  const [whetherContractorProvidesCanteenFacility, setWhetherContractorProvidesCanteenFacility] = useState(
    inspectionContract?.whether_contractor_provides_canteen_facility || ""
  );
  const [whetherContractorProvidesRestRooms, setWhetherContractorProvidesRestRooms] = useState(
    inspectionContract?.whether_contractor_prvides_rest_rooms || ""
  );
  const [whetherFirstAidProvided, setWhetherFirstAidProvided] = useState(
    inspectionContract?.whether_first_aid_provided || ""
  );
  const [whetherContractorIssuedEmploymentCard, setWhetherContractorIssuedEmploymentCard] = useState(
    inspectionContract?.whether_contractor_issued_employment_card || ""
  );
  const [whetherDateMaintainedInEmploymentCard, setWhetherDateMaintainedInEmploymentCard] = useState(
    inspectionContract?.whether_date_maintained_in_employment_card || ""
  );
  const [whetherContractorIssuedServiceCertificate, setWhetherContractorIssuedServiceCertificate] = useState(
    inspectionContract?.whether_contractor_issued_service_certificate || ""
  );
  const [whetherWageSlipsFormXIXIssued, setWhetherWageSlipsFormXIXIssued] = useState(
    inspectionContract?.whether_wage_slips_formxix_issued || ""
  );

  // ===== SECTION 5: Directions =====
  const [directions, setDirections] = useState(
    inspectionContract?.contract_directions || [""]
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

  // ===== SECTION 6: Additional Remarks =====
  const [additionalRemarks, setAdditionalRemarks] = useState(
    inspectionContract?.additional_remarks2 || ""
  );

  // ===== VALIDATION & SAVE =====
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!issueOfAppointmentLetters)
      newErrors.issue_of_appointment_letters_contract = "This field is required";
    if (!issueOfIdentityCard)
      newErrors.issue_of_identity_card_contract = "This field is required";
    if (!issueOfPayslip)
      newErrors.issue_of_payslip_contract = "This field is required";
    if (!applicableOfESIC)
      newErrors.applicable_of_ESIC_contract = "This field is required";
    if (!maintenanceOfRegisters)
      newErrors.maintenance_of_registers_contract = "This field is required";
    if (!annualRepSubmitted)
      newErrors.whether_annual_rep_submitted_contract = "This field is required";
    if (!isAdolescentEmployed)
      newErrors.is_adolescent_employed_contract = "This field is required";
    if (!whetherLicenseObtained)
      newErrors.whether_license_obtained = "This field is required";
    if (!whetherContractLabourNumbering)
      newErrors.whether_contract_labour_numbering = "This field is required";
    if (!whetherNoticesRegardingRatesOfWages)
      newErrors.whether_notices_regarding_rates_of_wages = "This field is required";
    if (!whetherNoticeRegardingNames)
      newErrors.whether_notice_regarding_names = "This field is required";
    if (!whetherCopyOfEachNoticeDisplayed)
      newErrors.whether_copy_of_each_notice_displayed = "This field is required";
    if (!whetherNoticesShowingWagePeriod)
      newErrors.whether_notices_showing_wage_period = "This field is required";
    if (!whetherIntimationOfCommencement)
      newErrors.whether_intimation_of_commencement = "This field is required";
    if (!whetherHalfYearlyReturn)
      newErrors.whether_half_yearly_return = "This field is required";
    if (!whetherContractorHasEnsuredPresenceOfRepresentative)
      newErrors.whether_contractor_has_ensured_presence_of_representative = "This field is required";
    if (!whetherContractorEnsuredPaymentOfWages)
      newErrors.whether_contractor_ensured_payment_of_wages = "This field is required";
    if (!whetherRegisterOfPersonMaintained)
      newErrors.whether_register_of_person_maintained = "This field is required";
    if (!whetherWageRegisterMaintained)
      newErrors.whether_wage_register_maintained = "This field is required";
    if (!whetherContractorObtainedSigThumbImpression)
      newErrors.whether_contractor_obtained_sig_thumb_impression = "This field is required";
    if (!whetherWelfareFacilitiesRegardingDrinkingWater)
      newErrors.whether_welfare_facilities_regarding_drinking_water = "This field is required";
    if (!whetherContractorCrecheFacility)
      newErrors.whether_contractor_creche_facility = "This field is required";
    if (!whetherContractorProvidesCanteenFacility)
      newErrors.whether_contractor_provides_canteen_facility = "This field is required";
    if (!whetherContractorProvidesRestRooms)
      newErrors.whether_contractor_prvides_rest_rooms = "This field is required";
    if (!whetherFirstAidProvided)
      newErrors.whether_first_aid_provided = "This field is required";
    if (!whetherContractorIssuedEmploymentCard)
      newErrors.whether_contractor_issued_employment_card = "This field is required";
    if (!whetherDateMaintainedInEmploymentCard)
      newErrors.whether_date_maintained_in_employment_card = "This field is required";
    if (!whetherContractorIssuedServiceCertificate)
      newErrors.whether_contractor_issued_service_certificate = "This field is required";
    if (!whetherWageSlipsFormXIXIssued)
      newErrors.whether_wage_slips_formxix_issued = "This field is required";
    if (!additionalRemarks.trim())
      newErrors.additional_remarks2 = "This field is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      Alert.alert("Validation Error", "Please fill all required fields");
      return;
    }

    const formData = {
      // Safety measures
      cleanliness_workplace_contract: cleanlinessWorkplace ? "Yes" : "No",
      adequate_lighting_contract: adequateLighting ? "Yes" : "No",
      proper_ventilation_contract: properVentilation ? "Yes" : "No",
      fire_prevention_measures_contract: firePreventionMeasures ? "Yes" : "No",
      accident_prevention_contract: accidentPrevention ? "Yes" : "No",

      // Inspection criteria
      issue_of_appointment_letters_contract: issueOfAppointmentLetters,
      issue_of_identity_card_contract: issueOfIdentityCard,
      issue_of_payslip_contract: issueOfPayslip,
      applicable_of_ESIC_contract: applicableOfESIC,
      ESIC_contract_no_of_empl: esicNoOfEmpl,
      maintenance_of_registers_contract: maintenanceOfRegisters,
      whether_annual_rep_submitted_contract: annualRepSubmitted,
      is_adolescent_employed_contract: isAdolescentEmployed,

      // Adolescent details
      adolescent_details_contract: adolescentDetails,

      // Contract labour provisions
      whether_license_obtained: whetherLicenseObtained,
      whether_contract_labour_numbering: whetherContractLabourNumbering,
      whether_notices_regarding_rates_of_wages: whetherNoticesRegardingRatesOfWages,
      whether_notice_regarding_names: whetherNoticeRegardingNames,
      whether_copy_of_each_notice_displayed: whetherCopyOfEachNoticeDisplayed,
      whether_notices_showing_wage_period: whetherNoticesShowingWagePeriod,
      whether_intimation_of_commencement: whetherIntimationOfCommencement,
      whether_half_yearly_return: whetherHalfYearlyReturn,
      whether_contractor_has_ensured_presence_of_representative: whetherContractorHasEnsuredPresenceOfRepresentative,
      whether_contractor_ensured_payment_of_wages: whetherContractorEnsuredPaymentOfWages,
      whether_register_of_person_maintained: whetherRegisterOfPersonMaintained,
      whether_wage_register_maintained: whetherWageRegisterMaintained,
      whether_contractor_obtained_sig_thumb_impression: whetherContractorObtainedSigThumbImpression,
      whether_welfare_facilities_regarding_drinking_water: whetherWelfareFacilitiesRegardingDrinkingWater,
      whether_contractor_creche_facility: whetherContractorCrecheFacility,
      whether_contractor_provides_canteen_facility: whetherContractorProvidesCanteenFacility,
      whether_contractor_prvides_rest_rooms: whetherContractorProvidesRestRooms,
      whether_first_aid_provided: whetherFirstAidProvided,
      whether_contractor_issued_employment_card: whetherContractorIssuedEmploymentCard,
      whether_date_maintained_in_employment_card: whetherDateMaintainedInEmploymentCard,
      whether_contractor_issued_service_certificate: whetherContractorIssuedServiceCertificate,
      whether_wage_slips_formxix_issued: whetherWageSlipsFormXIXIssued,

      // Directions
      contract_directions: directions,

      // Remarks
      additional_remarks2: additionalRemarks,
    };

    onSave?.(formData);
  };

  const yesNoOptions = ["Yes", "No"];

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Contract Labour Inspection</Text>

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
            Maintaining proper ventilation to ensure a healthy working environment
          </Label>
          <Switch
            value={properVentilation}
            onValueChange={setProperVentilation}
          />
        </Row>

        <Row>
          <Label>
            Taking necessary measures for prevention of fire, including safety arrangements and emergency preparedness
          </Label>
          <Switch
            value={firePreventionMeasures}
            onValueChange={setFirePreventionMeasures}
          />
        </Row>

        <Row>
          <Label>
            Taking all necessary preventive measures to avoid accidents at the workplace
          </Label>
          <Switch
            value={accidentPrevention}
            onValueChange={setAccidentPrevention}
          />
        </Row>

        {/* ===== SECTION 2: Inspection Criteria ===== */}
        <SectionTitle>Inspection Criteria</SectionTitle>

        <View style={styles.formGroup}>
          <Label required>1. Issue of appointment letters</Label>
          <SelectDropdown
            value={issueOfAppointmentLetters}
            onSelect={setIssueOfAppointmentLetters}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>2. Issue of identity cards</Label>
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
            4. Applicability of ESIC to the establishment as per the Employees' State Insurance Act, 1948
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
            />
          )}
        </View>

        <View style={styles.formGroup}>
          <Label required>
            5. Maintenance of registers against each employee
          </Label>
          <SelectDropdown
            value={maintenanceOfRegisters}
            onSelect={setMaintenanceOfRegisters}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            6. Whether annual return is submitted or not?
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
                    a. Whether intimation has been provided to the concerned Labour Office
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
                  <TouchableOpacity style={styles.uploadBtn}>
                    <Text style={styles.uploadBtnText}>Choose File</Text>
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

        {/* ===== SECTION 4: Contract Labour Provisions ===== */}
        <SectionTitle>
          Inspection Report on The Contract Labour (Under Occupational Safety, Health and Working Conditions Code, 2000)
        </SectionTitle>

        <View style={styles.formGroup}>
          <Label required>
            1. Whether License obtained while executing contract work through contract labour [Section 47]
          </Label>
          <SelectDropdown
            value={whetherLicenseObtained}
            onSelect={setWhetherLicenseObtained}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            2. Whether contract labour exceeds maximum number specified in licence [Section 48]
          </Label>
          <SelectDropdown
            value={whetherContractLabourNumbering}
            onSelect={setWhetherContractLabourNumbering}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            3. Whether notices regarding rates of wages, hours of work, wage period etc. displayed [Section 31(1)]
          </Label>
          <SelectDropdown
            value={whetherNoticesRegardingRatesOfWages}
            onSelect={setWhetherNoticesRegardingRatesOfWages}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            4. Whether notice of Inspector's name & address displayed [Rule 81(i)]
          </Label>
          <SelectDropdown
            value={whetherNoticeRegardingNames}
            onSelect={setWhetherNoticeRegardingNames}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            5. Whether copy of displayed notices sent to Inspector [Section 31(2)]
          </Label>
          <SelectDropdown
            value={whetherCopyOfEachNoticeDisplayed}
            onSelect={setWhetherCopyOfEachNoticeDisplayed}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            6. Whether wage period & disbursement notices informed digitally to Principal Employer [Section 55(2)]
          </Label>
          <SelectDropdown
            value={whetherNoticesShowingWagePeriod}
            onSelect={setWhetherNoticesShowingWagePeriod}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            7. Whether intimation of commencement/completion submitted within 30 days [Section 5(1)]
          </Label>
          <SelectDropdown
            value={whetherIntimationOfCommencement}
            onSelect={setWhetherIntimationOfCommencement}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            8. Whether Yearly Return in Form X submitted [Section 33(d)]
          </Label>
          <SelectDropdown
            value={whetherHalfYearlyReturn}
            onSelect={setWhetherHalfYearlyReturn}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            9. Whether authorised representative present during wage disbursement [Section 55(2)]
          </Label>
          <SelectDropdown
            value={whetherContractorHasEnsuredPresenceOfRepresentative}
            onSelect={setWhetherContractorHasEnsuredPresenceOfRepresentative}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            10. Whether contractor ensured payment of wages within prescribed time [Section 55(2)]
          </Label>
          <SelectDropdown
            value={whetherContractorEnsuredPaymentOfWages}
            onSelect={setWhetherContractorEnsuredPaymentOfWages}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            11. Whether register of persons employed maintained [Section 33(a)]
          </Label>
          <SelectDropdown
            value={whetherRegisterOfPersonMaintained}
            onSelect={setWhetherRegisterOfPersonMaintained}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            12. Whether wage register maintained [Section 33(a)]
          </Label>
          <SelectDropdown
            value={whetherWageRegisterMaintained}
            onSelect={setWhetherWageRegisterMaintained}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            13. Whether signature/thumb impression obtained on wage register [Section 33(a)]
          </Label>
          <SelectDropdown
            value={whetherContractorObtainedSigThumbImpression}
            onSelect={setWhetherContractorObtainedSigThumbImpression}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            14. Whether welfare facilities provided (water, latrine, washing) [Section 53]
          </Label>
          <SelectDropdown
            value={whetherWelfareFacilitiesRegardingDrinkingWater}
            onSelect={setWhetherWelfareFacilitiesRegardingDrinkingWater}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            15. Whether creche facility provided when 20+ women employed [Section 53]
          </Label>
          <SelectDropdown
            value={whetherContractorCrecheFacility}
            onSelect={setWhetherContractorCrecheFacility}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            16. Whether canteen facility provided when 100+ contract labour employed [Section 53]
          </Label>
          <SelectDropdown
            value={whetherContractorProvidesCanteenFacility}
            onSelect={setWhetherContractorProvidesCanteenFacility}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            17. Whether rest rooms provided for night halt [Section 53]
          </Label>
          <SelectDropdown
            value={whetherContractorProvidesRestRooms}
            onSelect={setWhetherContractorProvidesRestRooms}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            18. Whether first aid facilities provided [Section 53]
          </Label>
          <SelectDropdown
            value={whetherFirstAidProvided}
            onSelect={setWhetherFirstAidProvided}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            19. Whether employment id issued to each worker [Section 6(1)(f)]
          </Label>
          <SelectDropdown
            value={whetherContractorIssuedEmploymentCard}
            onSelect={setWhetherContractorIssuedEmploymentCard}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            20. Whether employment card maintained up to date [Section 6(1)(f)]
          </Label>
          <SelectDropdown
            value={whetherDateMaintainedInEmploymentCard}
            onSelect={setWhetherDateMaintainedInEmploymentCard}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            21. Whether experience certificate issued on termination [Section 56]
          </Label>
          <SelectDropdown
            value={whetherContractorIssuedServiceCertificate}
            onSelect={setWhetherContractorIssuedServiceCertificate}
            options={yesNoOptions}
          />
        </View>

        <View style={styles.formGroup}>
          <Label required>
            22. Whether wage slips in Form XIX issued before wage disbursement [Section 33(c)]
          </Label>
          <SelectDropdown
            value={whetherWageSlipsFormXIXIssued}
            onSelect={setWhetherWageSlipsFormXIXIssued}
            options={yesNoOptions}
          />
        </View>

        {/* ===== SECTION 5: Directions ===== */}
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

        {/* ===== SECTION 6: Additional Remarks ===== */}
        <View style={styles.formGroup}>
          <Label required>Additional Remarks</Label>
          <TextInputField
            value={additionalRemarks}
            onChangeText={setAdditionalRemarks}
            placeholder="Enter Remarks"
            multiline
            numberOfLines={3}
          />
          {errors.additional_remarks2 && (
            <ErrorText>{errors.additional_remarks2}</ErrorText>
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
});