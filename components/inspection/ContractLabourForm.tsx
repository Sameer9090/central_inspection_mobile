import * as DocumentPicker from "expo-document-picker";
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

// ============================================
// REUSABLE COMPONENTS
// ============================================

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
  maxLength,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
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
    maxLength={maxLength}
  />
);

// Website Blade-aligned Contract Labour provisions (items 1–38).
const contractProvisionFields = [
  ["whether_license_obtained", "1. Whether License obtained while executing contract work through contract labour [Section 47]"],
  ["whether_contract_labour_numbering", "2. Whether contract labour exceeds maximum number specified in licence [Section 48]"],
  ["whether_notices_regarding_rates_of_wages", "3. Whether notices regarding rates of wages, hours of work, wage period etc. displayed [Section 31(1)]"],
  ["whether_copy_of_each_notice_displayed", "4. Whether copy of displayed notices sent to Inspector [Section 31(2)]"],
  ["electronic_wage_disbursement_and_digital_intimation_contract", "5. Whether electronic wage disbursement is maintained and intimated digitally to the Principal Employer with proof? [Section 55(2)]"],
  ["whether_intimation_of_commencement", "6. Whether intimation of commencement/completion submitted within 30 days [Section 5(1)]"],
  ["whether_half_yearly_return", "7. Whether Yearly Return in Form X submitted [Section 33(d)]"],
  ["whether_contractor_ensured_payment_of_wages", "8. Whether contractor ensured payment of wages within prescribed time [Section 55(1)]"],
  ["whether_register_of_person_maintained", "9. Whether register of persons employed maintained [Section 33(a)]"],
  ["whether_wage_register_maintained", "10. Whether wage register maintained [Section 33(a)]"],
  ["whether_welfare_facilities_regarding_drinking_water", "11. Whether welfare facilities provided (water, latrine, washing) [Section 53]"],
  ["whether_contractor_creche_facility", "12. Whether creche facility provided [Section 53]"],
  ["whether_contractor_provides_canteen_facility", "13. Whether canteen facility provided when 100+ contract labour employed [Section 53]"],
  ["whether_contractor_prvides_rest_rooms", "14. Whether rest rooms provided for night halt [Section 53]"],
  ["whether_first_aid_provided", "15. Whether first aid facilities provided [Section 53]"],
  ["issue_of_appointment_letters_contract", "16. Whether Letter of Appointment issued to each worker [Section 6(1)(f)]"],
  ["whether_contractor_issued_service_certificate", "17. Whether experience certificate issued on termination [Section 56]"],
  ["whether_wage_slips_formxix_issued", "18. Whether wage slips in Form XIX issued before wage disbursement [Section 33]"],
  ["safe_workplace_and_machinery_contract", "19. Whether safe workplace and machinery provided? [Section 6 and Section 18]"],
  ["ppe_provided_contract", "20. Whether PPE provided? [Section 82(d)]"],
  ["fire_prevention_measures_contract", "21. Whether fire safety and emergency arrangement provided? [Section 80, 84(4)]"],
  ["safety_instructions_and_training_contract", "22. Whether Safety instructions and training provided? [Section 6(2)(c)]"],
  ["cleanliness_workplace_contract", "23. Whether proper cleanliness and hygiene is maintained at the workplace? [Section 23(2)(i)]"],
  ["adequate_lighting_contract", "24. Whether adequate lighting is provided in all work areas? [Section 23(2)(vii)]"],
  ["proper_ventilation_contract", "25. Whether proper ventilation and suitable temperature are maintained for a healthy working environment? [Section 23(2)(ii)]"],
  ["issue_of_identity_card_contract", "26. Whether Identity Cards have been issued to all contract workers? [Section 33(a)]"],
  ["valid_establishment_registration_certificate_contract", "27. Whether the establishment has obtained a valid Establishment Registration Certificate? [Section 3(3)]"],
  ["contractor_work_order_intimation_to_principal_employer_contract", "28. Whether the Contractor has intimated the Principal Employer upon receiving the Work Order? [Section 50(1)]"],
  ["electronic_wage_payment_documentary_proof_contract", "29. Whether documentary proof (bank statements/NEFT records) of electronic wage payment is maintained? [Section 55(2)]"],
  ["leave_and_holiday_registers_maintained_contract", "30. Whether leave and holiday registers are maintained in the prescribed format? [Section 32 and Section 33(a)(v)]"],
  ["accident_injury_dangerous_occurrence_records_contract", "31. Whether accident, injury, and dangerous occurrence records are properly maintained? [Section 10 and Section 33(a)(v)]"],
  ["medical_examination_and_health_records_contract", "32. Whether medical examination and health records of workers are maintained, where applicable? [Section 6(1)(c) and Section 85(c)]"],
  ["is_adolescent_employed_contract", "33. Has any adolescent been employed, and if so, are the specific registers maintained? [Section 32(1)(ii) and Section 33(a)(vii)]"],
  ["wages_paid_at_applicable_rates_contract", "34. Whether wages paid at applicable rates? [Section 5 under Code on Wages, 2019]"],
  ["wages_paid_within_prescribed_time_code_wages_contract", "35. Whether wages paid within prescribed time? [Section 17 under Code on Wages, 2019]"],
  ["unauthorised_wage_deductions_contract", "36. Whether unauthorized/unlawful wage deductions happen? [Section 18 under Code on Wages, 2019]"],
  ["establishment_registered_and_covered_epfo_esic_contract", "37. Whether the establishment is registered and covered under EPFO and ESIC? [Section 3 read with the First Schedule]"],
  ["construction_workers_registered_bocw_welfare_board_contract", "38. Whether the construction workers are registered as beneficiaries under the BOCW Welfare Board? [Section 106]"],
] as const;

type AdolescentDetail = {
  labour_office_intimation: string;
  name: string;
  address: string;
  age: string;
  age_proof:
    | { uri: string; name: string; type: string; size?: number }
    | string
    | null;
  age_proof_name: string;
  hazardous_work: string;
  working_hours: string;
  maintain_register: string;
  wage_amount: string;
};

const createEmptyAdolescent = (): AdolescentDetail => ({
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
});

// ============================================
// MAIN COMPONENT
// ============================================

export default function ContractLabourForm({
  inspectionContract,
  user,
  onSave,
  onBack,
  currentStep,
  sectionsStatus,
  referenceNumber,
}: {
  inspectionContract: any;
  user: any;
  onSave?: (data: any) => void;
  onBack?: () => void;
  currentStep?: string;
  sectionsStatus?: Record<string, boolean>;
  referenceNumber?: string;
}) {
  // ===== SECTION 3: Adolescent Worker Details =====
  const [adolescentDetails, setAdolescentDetails] = useState<AdolescentDetail[]>(
    Array.isArray(inspectionContract?.adolescent_details_contract) && inspectionContract.adolescent_details_contract.length
      ? inspectionContract.adolescent_details_contract as AdolescentDetail[]
      : [createEmptyAdolescent()]
  );

  const addAdolescent = () => {
    setAdolescentDetails((previous) => [...previous, createEmptyAdolescent()]);
  };

  const removeAdolescent = (index: number) => {
    if (adolescentDetails.length > 1) {
      setAdolescentDetails(adolescentDetails.filter((_, i) => i !== index));
    }
  };

  const updateAdolescent = (index: number, field: string, value: any) => {
    setAdolescentDetails((prev) => {
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
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const file = result.assets[0];
        if (typeof file.size === "number" && file.size > 10 * 1024 * 1024) {
          Alert.alert("File Too Large", "Age-proof documents must not exceed 10 MB.");
          return;
        }

        setAdolescentDetails((prev) => {
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

  // Website Blade-aligned findings. These keys are persisted exactly as in the web form.
  const [contractProvisionValues, setContractProvisionValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(contractProvisionFields.map(([key]) => [key, inspectionContract?.[key] || ""]))
  );

  const updateContractProvision = (key: string, value: string) => {
    setContractProvisionValues((previous) => ({ ...previous, [key]: value }));
  };

  // ===== SECTION 5: Directions =====
  const [directions, setDirections] = useState<string[]>(
    Array.isArray(inspectionContract?.contract_directions) && inspectionContract.contract_directions.length
      ? inspectionContract.contract_directions
      : [""]
  );
  const [hasDirections, setHasDirections] = useState<string>(
    inspectionContract?.has_directions_contract === "Yes" || inspectionContract?.has_directions_contract === "No"
      ? inspectionContract.has_directions_contract
      : inspectionContract?.contract_has_directions === "Yes" || inspectionContract?.contract_has_directions === "No"
        ? inspectionContract.contract_has_directions
      : Array.isArray(inspectionContract?.contract_directions) && inspectionContract.contract_directions.some((item: any) => String(item ?? "").trim())
        ? "Yes"
        : ""
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

    if (hasDirections !== "Yes" && hasDirections !== "No") {
      newErrors.has_directions_contract = "Please select Yes or No for directions.";
    }

    if (hasDirections === "Yes") {
      const nonEmptyDirections = directions
        .map((item) => String(item ?? "").trim())
        .filter(Boolean);

      if (nonEmptyDirections.length === 0) {
        newErrors.contract_directions = "Please enter at least one direction.";
      }

      directions.forEach((item, index) => {
        if (String(item ?? "").trim().length > 255) {
          newErrors[`contract_directions_${index}`] = "Each direction must not exceed 255 characters.";
        }
      });
    }

    if (!additionalRemarks.trim()) {
      newErrors.additional_remarks2 = "Additional Remarks is required.";
    }

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
      inspection_type: "contract",

      // Adolescent details
      adolescent_details_contract: adolescentDetails,

      // Website Blade-aligned contract provisions (items 1–38)
      ...contractProvisionValues,
      // Directions
      has_directions_contract: hasDirections,
      contract_directions: hasDirections === "Yes"
        ? directions.map((item) => String(item ?? "").trim()).filter(Boolean)
        : [],

      // Remarks
      additional_remarks2: additionalRemarks,
    };

    onSave?.(formData);
  };

  const yesNoOptions = ["Yes", "No"];

  // ============================================
  // RENDER
  // ============================================

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        <Text style={styles.title}>Contract Labour Inspection</Text>

        {/* ===== Contract Labour Provisions: Questions 1–38 in sequence ===== */}
        <SectionTitle>
          Inspection Report on The Contract Labour (Under Occupational Safety, Health and Working Conditions Code, 2020)
        </SectionTitle>

        {contractProvisionFields.slice(0, 18).map(([key, label]) => (
          <View key={key} style={styles.formGroup}>
            <Label>{label}</Label>
            <SelectDropdown
              value={contractProvisionValues[key] || ""}
              onSelect={(value) => updateContractProvision(key, value)}
              options={yesNoOptions}
              placeholder="Select Yes or No"
            />
            {errors[key] && <ErrorText>{errors[key]}</ErrorText>}
          </View>
        ))}

        {/* Questions 19–25: Workplace Safety and Health Measures */}
        <SectionTitle>Workplace Safety and Health Measures</SectionTitle>
        {contractProvisionFields.slice(18, 25).map(([key, label]) => (
          <View key={key} style={styles.formGroup}>
            <Label>{label}</Label>
            <SelectDropdown
              value={contractProvisionValues[key] || ""}
              onSelect={(value) => updateContractProvision(key, value)}
              options={yesNoOptions}
              placeholder="Select Yes or No"
            />
            {errors[key] && <ErrorText>{errors[key]}</ErrorText>}
          </View>
        ))}

        {contractProvisionFields.slice(25).map(([key, label]) => (
          <View key={key} style={styles.formGroup}>
            <Label>{label}</Label>
            <SelectDropdown
              value={contractProvisionValues[key] || ""}
              onSelect={(value) => updateContractProvision(key, value)}
              options={yesNoOptions}
              placeholder="Select Yes or No"
            />
            {errors[key] && <ErrorText>{errors[key]}</ErrorText>}
          </View>
        ))}

        {/* ===== SECTION 3: Adolescent Worker Details ===== */}
        {contractProvisionValues.is_adolescent_employed_contract === "Yes" && (
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
                  <Label>
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
                  <Label>b. Name of the adolescent</Label>
                  <TextInputField
                    value={adolescent.name}
                    onChangeText={(val) => updateAdolescent(index, "name", val)}
                    placeholder="Enter name"
                    maxLength={255}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label>c. Address of the adolescent</Label>
                  <TextInputField
                    value={adolescent.address}
                    onChangeText={(val) =>
                      updateAdolescent(index, "address", val)
                    }
                    placeholder="Enter address"
                    maxLength={255}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label>d. Age of the adolescent</Label>
                  <NumberInput
                    value={adolescent.age}
                    onChangeText={(val) => updateAdolescent(index, "age", val)}
                    placeholder="Enter age"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label>e. Age proof (Upload document)</Label>
                  <TouchableOpacity
                    style={styles.uploadBtn}
                    onPress={() => pickAgeProofDocument(index)}
                  >
                    <Text style={styles.uploadBtnText}>
                      {adolescent.age_proof_name || (typeof adolescent.age_proof === "string" ? adolescent.age_proof.split("/").pop() : "Choose File")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                  <Label>
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
                  <Label>g. Working hours</Label>
                  <TextInputField
                    value={adolescent.working_hours}
                    onChangeText={(val) =>
                      updateAdolescent(index, "working_hours", val)
                    }
                    placeholder="Enter working hours"
                    maxLength={255}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label>h. Whether maintains register or not</Label>
                  <SelectDropdown
                    value={adolescent.maintain_register}
                    onSelect={(val) =>
                      updateAdolescent(index, "maintain_register", val)
                    }
                    options={yesNoOptions}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Label>i. Wage paid to the adolescent</Label>
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

        {/* ===== SECTION 5: Conditional Directions ===== */}
        <View style={styles.formGroup}>
          <Label required>Is there any directions to be mentioned?</Label>
          <SelectDropdown value={hasDirections} onSelect={setHasDirections} options={yesNoOptions} placeholder="Select Yes or No" />
          {errors.has_directions_contract && <ErrorText>{errors.has_directions_contract}</ErrorText>}
          {errors.contract_directions && <ErrorText>{errors.contract_directions}</ErrorText>}
        </View>
        {hasDirections === "Yes" && (
          <>
            <SectionTitle>Directions</SectionTitle>
            {directions.map((direction, index) => (
              <View key={index} style={styles.directionRow}>
                <View style={{ flex: 1 }}>
                  <TextInputField value={direction} onChangeText={(val) => updateDirection(index, val)} placeholder="Enter Direction" maxLength={255} />
                  {errors[`contract_directions_${index}`] && <ErrorText>{errors[`contract_directions_${index}`]}</ErrorText>}
                </View>
                {index === 0 ? (
                  <TouchableOpacity style={styles.addDirectionBtn} onPress={addDirection}>
                    <Text style={styles.addDirectionBtnText}>Add</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.removeDirectionBtn} onPress={() => removeDirection(index)}>
                    <Text style={styles.removeDirectionBtnText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}

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

// ============================================
// STYLES
// ============================================

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