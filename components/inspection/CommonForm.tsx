import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CommonForm({
  application,
  common,
  user,
  onSave,
  gpsAcquiring,
  currentStep,
  sectionsStatus,
}: {
  application: any;
  common: any;
  user: any;
  onSave: (formData: any) => Promise<any>;
  gpsAcquiring?: boolean;
  currentStep?: string;
  sectionsStatus?: Record<string, boolean>;
}) {
  const commonData = common?.common_data || {};

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState<string>("");

  const isCompleted = sectionsStatus?.common === true;
  const isCurrent = currentStep === "common";

  // ─── All existing state (unchanged) ───
  const [firstName, setFirstName] = useState(
    common?.common_data?.employer?.first_name || "",
  );
  const [lastName, setLastName] = useState(
    common?.common_data?.employer?.last_name || "",
  );
  const [mobile, setMobile] = useState(
    common?.common_data?.employer?.mobile || "",
  );
  const [alternateMobile, setAlternateMobile] = useState(
    common?.common_data?.employer?.alt_mobile || "",
  );
  const [email, setEmail] = useState(
    common?.common_data?.employer?.email || "",
  );
  const [address1, setAddress1] = useState(
    common?.common_data?.establishment?.address_1 || "",
  );
  const [address2, setAddress2] = useState(
    common?.common_data?.establishment?.address_2 || "",
  );
  const [address3, setAddress3] = useState(
    common?.common_data?.establishment?.address_3 || "",
  );
  const [landmark, setLandmark] = useState(
    common?.common_data?.establishment?.landmark || "",
  );
  const [district, setDistrict] = useState(
    common?.common_data?.establishment?.district || "",
  );
  const [wardNo, setWardNo] = useState(
    common?.common_data?.establishment?.ward_no || "",
  );
  const [ase, setAse] = useState(
    common?.selected_types?.includes("ase") || false,
  );
  const [contract, setContract] = useState(
    common?.selected_types?.includes("contract") || false,
  );
  const [minimumWage, setMinimumWage] = useState(
    common?.selected_types?.includes("minimumwage") || false,
  );

  const [dateOfInspection, setDateOfInspection] = useState(
    common?.common_data?.inspector?.date ||
      new Date().toISOString().split("T")[0],
  );
  const [panchayat, setPanchayat] = useState(
    common?.common_data?.establishment?.panchayat || "",
  );
  const [submissionLocation, setSubmissionLocation] = useState(
    common?.common_data?.submission_location ||
      application?.submission_location ||
      "",
  );

  const [photoPath] = useState(common?.common_data?.files?.est_photo || "");
  const [emplSignPath] = useState(common?.common_data?.files?.empl_sign || "");
  const [inspectorSignPath] = useState(
    common?.common_data?.files?.inspector_sign || "",
  );

  const [gpsStatus, setGpsStatus] = useState<"idle" | "waiting" | "success" | "failed">("idle");

  // Helper to get first error message for a field
  const getFieldError = (fieldName: string): string => {
    return errors[fieldName]?.[0] || "";
  };

  // Helper to check if field has error
  const hasFieldError = (fieldName: string): boolean => {
    return !!errors[fieldName]?.length;
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    setApiError("");
    setGpsStatus("waiting");

    try {
      const formSelector: string[] = [];
      if (ase) formSelector.push("ase");
      if (contract) formSelector.push("contract");
      if (minimumWage) formSelector.push("minimumwage");

      const payload = {
        application_ref_no: application?.appl_ref_no,
        name_of_the_establishment: application?.name_of_the_establishment,
        name_of_inspector:
          `${user?.firstname || ""} ${user?.lastname || ""}`.trim(),
        date_of_inspection: dateOfInspection,
        empl_first_name: firstName,
        empl_last_name: lastName,
        empl_mobile_no: mobile,
        empl_alt_mobile_no: alternateMobile,
        empl_email: email,
        est_address_1: address1,
        est_address_2: address2,
        est_address_3: address3,
        est_landmark: landmark,
        form_selector: formSelector,
        est_district: district,
        est_ward_no: district === "Kamrup Metropolitan" ? wardNo : "",
        panchayat: district !== "Kamrup Metropolitan" ? panchayat : "",
        submission_location: submissionLocation,
        inspection_photo_path: photoPath,
        empl_sign_path: emplSignPath,
        inspector_sign_path: inspectorSignPath,
        ubin: application?.ubin,
      };

      await onSave(payload);
      setGpsStatus("success");
    } catch (error: any) {
      setGpsStatus("failed");

      // Handle validation errors from backend
      if (error?.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      if (error?.response?.data?.message) {
        setApiError(error.response.data.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const isBusy = saving || gpsAcquiring;

  return (
    <View style={styles.container}>
      {/* Header with title + status badge */}
      <View style={styles.stepHeader}>
        <Text style={styles.sectionTitle}>Common Inspection Details</Text>
        <View style={[
          styles.statusBadge,
          isCompleted ? styles.statusBadgeCompleted : isCurrent ? styles.statusBadgeCurrent : styles.statusBadgePending
        ]}>
          <Text style={[
            styles.statusBadgeText,
            isCompleted ? styles.statusBadgeTextCompleted : isCurrent ? styles.statusBadgeTextCurrent : styles.statusBadgeTextPending
          ]}>
            {isCompleted ? "✓ Completed" : isCurrent ? "● Current" : "○ Pending"}
          </Text>
        </View>
      </View>

      {/* API Error Banner */}
      {apiError ? (
        <View style={styles.apiErrorBanner}>
          <Text style={styles.apiErrorText}>⚠ {apiError}</Text>
        </View>
      ) : null}

      {/* GPS Status Banner */}
      {gpsStatus === "waiting" && (
        <View style={styles.gpsWaitingBanner}>
          <ActivityIndicator size="small" color="#FF9800" />
          <Text style={styles.gpsWaitingText}>
            📡 Acquiring GPS location... Please wait
          </Text>
        </View>
      )}

      {gpsStatus === "failed" && !Object.keys(errors).length && (
        <View style={styles.gpsFailedBanner}>
          <Text style={styles.gpsFailedText}>
            ❌ GPS Required: Please enable GPS and try again
          </Text>
        </View>
      )}

      <Text style={styles.heading}>Inspector Details</Text>

      <Text style={styles.label}>Date of Inspection</Text>
      <TextInput
        style={[styles.input, hasFieldError("date_of_inspection") && styles.inputError]}
        value={dateOfInspection}
        onChangeText={setDateOfInspection}
        placeholder="YYYY-MM-DD"
      />
      {getFieldError("date_of_inspection") ? (
        <Text style={styles.fieldError}>{getFieldError("date_of_inspection")}</Text>
      ) : null}

      <Text style={styles.heading}>Employer Details</Text>

      <Text style={styles.label}>Employer first name <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("empl_first_name") && styles.inputError]}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Enter first name"
      />
      {getFieldError("empl_first_name") ? (
        <Text style={styles.fieldError}>{getFieldError("empl_first_name")}</Text>
      ) : null}

      <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("empl_last_name") && styles.inputError]}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Enter last name"
      />
      {getFieldError("empl_last_name") ? (
        <Text style={styles.fieldError}>{getFieldError("empl_last_name")}</Text>
      ) : null}

      <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("empl_mobile_no") && styles.inputError]}
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        placeholder="Enter mobile number"
        maxLength={10}
      />
      {getFieldError("empl_mobile_no") ? (
        <Text style={styles.fieldError}>{getFieldError("empl_mobile_no")}</Text>
      ) : null}

      <Text style={styles.label}>Alternate Mobile Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={alternateMobile}
        onChangeText={setAlternateMobile}
        placeholder="Enter alternate mobile"
        maxLength={10}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter email"
      />

      <Text style={styles.heading}>Establishment Details</Text>

      <Text style={styles.label}>Address 1 <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("est_address_1") && styles.inputError]}
        value={address1}
        onChangeText={setAddress1}
        placeholder="Enter address line 1"
      />
      {getFieldError("est_address_1") ? (
        <Text style={styles.fieldError}>{getFieldError("est_address_1")}</Text>
      ) : null}

      <Text style={styles.label}>Address 2 <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("est_address_2") && styles.inputError]}
        value={address2}
        onChangeText={setAddress2}
        placeholder="Enter address line 2"
      />
      {getFieldError("est_address_2") ? (
        <Text style={styles.fieldError}>{getFieldError("est_address_2")}</Text>
      ) : null}

      <Text style={styles.label}>Address 3</Text>
      <TextInput
        style={styles.input}
        value={address3}
        onChangeText={setAddress3}
        placeholder="Enter address line 3"
      />

      <Text style={styles.label}>Landmark <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("est_landmark") && styles.inputError]}
        value={landmark}
        onChangeText={setLandmark}
        placeholder="Enter landmark"
      />
      {getFieldError("est_landmark") ? (
        <Text style={styles.fieldError}>{getFieldError("est_landmark")}</Text>
      ) : null}

      <Text style={styles.label}>District <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("est_district") && styles.inputError]}
        value={district}
        onChangeText={setDistrict}
        placeholder="Enter district"
      />
      {getFieldError("est_district") ? (
        <Text style={styles.fieldError}>{getFieldError("est_district")}</Text>
      ) : null}

      {district === "Kamrup Metropolitan" ? (
        <>
          <Text style={styles.label}>Ward No <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, hasFieldError("est_ward_no") && styles.inputError]}
            value={wardNo}
            onChangeText={setWardNo}
            placeholder="Enter ward number"
          />
          {getFieldError("est_ward_no") ? (
            <Text style={styles.fieldError}>{getFieldError("est_ward_no")}</Text>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.label}>Panchayat <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, hasFieldError("panchayat") && styles.inputError]}
            value={panchayat}
            onChangeText={setPanchayat}
            placeholder="Enter panchayat"
          />
          {getFieldError("panchayat") ? (
            <Text style={styles.fieldError}>{getFieldError("panchayat")}</Text>
          ) : null}
        </>
      )}

      <Text style={styles.label}>Submission Location <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("submission_location") && styles.inputError]}
        value={submissionLocation}
        onChangeText={setSubmissionLocation}
        placeholder="Enter submission location"
      />
      {getFieldError("submission_location") ? (
        <Text style={styles.fieldError}>{getFieldError("submission_location")}</Text>
      ) : null}

      <Text style={styles.heading}>Inspection Types <Text style={styles.required}>*</Text></Text>
      <View style={[styles.switchRow, hasFieldError("form_selector") && styles.switchRowError]}>
        <Text>ASE</Text>
        <Switch value={ase} onValueChange={setAse} />
      </View>
      <View style={[styles.switchRow, hasFieldError("form_selector") && styles.switchRowError]}>
        <Text>Contract Labour</Text>
        <Switch value={contract} onValueChange={setContract} />
      </View>
      <View style={[styles.switchRow, hasFieldError("form_selector") && styles.switchRowError]}>
        <Text>Minimum Wage</Text>
        <Switch value={minimumWage} onValueChange={setMinimumWage} />
      </View>
      {getFieldError("form_selector") ? (
        <Text style={styles.fieldError}>{getFieldError("form_selector")}</Text>
      ) : null}

      <Text style={styles.heading}>Uploads</Text>

      <Text style={styles.label}>Inspector Signature <Text style={styles.required}>*</Text></Text>
      {user?.signature_base64 ? (
        <>
          <Image
            source={{
              uri: `data:image/png;base64,${user.signature_base64}`,
            }}
            style={[
              styles.signatureImage,
              hasFieldError("inspector_sign_path") && styles.imageError,
            ]}
            resizeMode="contain"
          />
          {getFieldError("inspector_sign_path") ? (
            <Text style={styles.fieldError}>{getFieldError("inspector_sign_path")}</Text>
          ) : null}
        </>
      ) : (
        <>
          <View style={[styles.noSignatureBox, hasFieldError("inspector_sign_path") && styles.inputError]}>
            <Text style={styles.noSignatureText}>No Signature Available</Text>
          </View>
          {getFieldError("inspector_sign_path") ? (
            <Text style={styles.fieldError}>{getFieldError("inspector_sign_path")}</Text>
          ) : null}
        </>
      )}

      <Text style={styles.label}>Establishment Photo <Text style={styles.required}>*</Text></Text>
      <TouchableOpacity style={[styles.uploadBox, hasFieldError("inspection_photo_path") && styles.inputError]}>
        <Text style={photoPath ? styles.uploadBoxTextSelected : styles.uploadBoxText}>
          {photoPath ? "✓ Photo Selected" : "Select Establishment Photo"}
        </Text>
      </TouchableOpacity>
      {getFieldError("inspection_photo_path") ? (
        <Text style={styles.fieldError}>{getFieldError("inspection_photo_path")}</Text>
      ) : null}

      <Text style={styles.label}>Employer Signature <Text style={styles.required}>*</Text></Text>
      <TouchableOpacity style={[styles.uploadBox, hasFieldError("empl_sign_path") && styles.inputError]}>
        <Text style={emplSignPath ? styles.uploadBoxTextSelected : styles.uploadBoxText}>
          {emplSignPath ? "✓ Signature Selected" : "Select Employer Signature"}
        </Text>
      </TouchableOpacity>
      {getFieldError("empl_sign_path") ? (
        <Text style={styles.fieldError}>{getFieldError("empl_sign_path")}</Text>
      ) : null}

      {/* Save button with GPS status */}
      <TouchableOpacity
        style={[
          styles.saveButton,
          isBusy && { opacity: 0.6 },
          gpsStatus === "failed" && styles.saveButtonFailed,
        ]}
        onPress={handleSave}
        disabled={isBusy}
      >
        {isBusy ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.saveText}>Getting GPS...</Text>
          </View>
        ) : gpsStatus === "failed" && !Object.keys(errors).length ? (
          <Text style={styles.saveText}>Retry with GPS</Text>
        ) : (
          <Text style={styles.saveText}>Save Common Details</Text>
        )}
      </TouchableOpacity>

      {/* Next step hint */}
      {isCompleted && currentStep !== "common" && (
        <View style={styles.nextStepHint}>
          <Text style={styles.nextStepText}>
            → Next: Fill {currentStep?.toUpperCase()} section
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    marginBottom: 20,
  },
  stepHeader: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1a1a4e",
    letterSpacing: 0.3,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBadgeCompleted: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  statusBadgeCurrent: {
    backgroundColor: "#E3F2FD",
    borderColor: "#1976D2",
  },
  statusBadgePending: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF9800",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  statusBadgeTextCompleted: {
    color: "#2E7D32",
  },
  statusBadgeTextCurrent: {
    color: "#1565C0",
  },
  statusBadgeTextPending: {
    color: "#E65100",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
    color: "#333",
  },
  label: {
    marginBottom: 5,
    fontWeight: "500",
    color: "#444",
    fontSize: 14,
  },
  required: {
    color: "#E53935",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    fontSize: 14,
    color: "#333",
    backgroundColor: "#fafafa",
  },
  inputError: {
    borderColor: "#E53935",
    borderWidth: 1.5,
    backgroundColor: "#FFEBEE",
  },
  fieldError: {
    color: "#E53935",
    fontSize: 12,
    marginBottom: 10,
    marginTop: 2,
    fontWeight: "500",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#fafafa",
  },
  switchRowError: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#E53935",
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#999",
    padding: 15,
    borderRadius: 8,
    marginBottom: 4,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  uploadBoxText: {
    color: "#666",
    fontSize: 14,
  },
  uploadBoxTextSelected: {
    color: "#2E7D32",
    fontWeight: "600",
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: "#1976D2",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  saveButtonFailed: {
    backgroundColor: "#E74C3C",
  },
  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signatureImage: {
    width: "100%",
    height: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 4,
  },
  imageError: {
    borderColor: "#E53935",
    borderWidth: 1.5,
  },
  noSignatureBox: {
    width: "100%",
    padding: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 4,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  noSignatureText: {
    color: "#999",
    fontSize: 14,
  },
  gpsWaitingBanner: {
    backgroundColor: "#FFF3E0",
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  gpsWaitingText: {
    color: "#E65100",
    fontSize: 14,
    fontWeight: "500",
  },
  gpsFailedBanner: {
    backgroundColor: "#FFEBEE",
    borderLeftWidth: 4,
    borderLeftColor: "#E74C3C",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  gpsFailedText: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "500",
  },
  apiErrorBanner: {
    backgroundColor: "#FFEBEE",
    borderLeftWidth: 4,
    borderLeftColor: "#E53935",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  apiErrorText: {
    color: "#C62828",
    fontSize: 14,
    fontWeight: "600",
  },
  nextStepHint: {
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#1976D2",
  },
  nextStepText: {
    color: "#1976D2",
    fontSize: 13,
    fontWeight: "600",
  },
});