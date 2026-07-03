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
  console.log(common);

  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  const isBusy = saving || gpsAcquiring;

  return (
    <View style={styles.container}>
      {/* ✅ FIXED: Single header with title + status badge */}
      <View style={styles.stepHeader}>
        <Text style={styles.sectionTitle}>Common Inspection Details</Text>
        <View style={[
          styles.statusBadge,
          isCompleted ? styles.statusBadgeCompleted : isCurrent ? styles.statusBadgeCurrent : styles.statusBadgePending
        ]}>
          <Text style={styles.statusBadgeText}>
            {isCompleted ? "✓ Completed" : isCurrent ? "● Current" : "○ Pending"}
          </Text>
        </View>
      </View>

      {/* ✅ REMOVED: Duplicate <Text style={styles.sectionTitle}>... was here */}

      {/* GPS Status Banner */}
      {gpsStatus === "waiting" && (
        <View style={styles.gpsWaitingBanner}>
          <ActivityIndicator size="small" color="#FF9800" />
          <Text style={styles.gpsWaitingText}>
            📡 Acquiring GPS location... Please wait
          </Text>
        </View>
      )}
      
      {gpsStatus === "failed" && (
        <View style={styles.gpsFailedBanner}>
          <Text style={styles.gpsFailedText}>
            ❌ GPS Required: Please enable GPS and try again
          </Text>
        </View>
      )}

      <Text style={styles.heading}>Inspector Details</Text>
      <Text style={styles.label}>Date of Inspection</Text>
      <TextInput
        style={styles.input}
        value={dateOfInspection}
        onChangeText={setDateOfInspection}
        placeholder="YYYY-MM-DD"
      />

      <Text style={styles.heading}>Employer Details</Text>
      <Text style={styles.label}>Employer first name</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />
      <Text style={styles.label}>Last Name</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
      />
      <Text style={styles.label}>Mobile Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
      />
      <Text style={styles.label}>Alternate Mobile Number</Text>
      <TextInput
        style={styles.input}
        keyboardType="phone-pad"
        value={alternateMobile}
        onChangeText={setAlternateMobile}
      />
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.heading}>Establishment Details</Text>
      <Text style={styles.label}>Address 1</Text>
      <TextInput
        style={styles.input}
        value={address1}
        onChangeText={setAddress1}
      />
      <Text style={styles.label}>Address 2</Text>
      <TextInput
        style={styles.input}
        value={address2}
        onChangeText={setAddress2}
      />
      <Text style={styles.label}>Address 3</Text>
      <TextInput
        style={styles.input}
        value={address3}
        onChangeText={setAddress3}
      />
      <Text style={styles.label}>Landmark</Text>
      <TextInput
        style={styles.input}
        value={landmark}
        onChangeText={setLandmark}
      />
      <Text style={styles.label}>District</Text>
      <TextInput
        style={styles.input}
        value={district}
        onChangeText={setDistrict}
      />
      <Text style={styles.label}>Ward No</Text>
      <TextInput style={styles.input} value={wardNo} onChangeText={setWardNo} />

      {district !== "Kamrup Metropolitan" && (
        <>
          <Text style={styles.label}>Panchayat</Text>
          <TextInput
            style={styles.input}
            value={panchayat}
            onChangeText={setPanchayat}
          />
        </>
      )}

      <Text style={styles.label}>Submission Location</Text>
      <TextInput
        style={styles.input}
        value={submissionLocation}
        onChangeText={setSubmissionLocation}
      />

      <Text style={styles.heading}>Inspection Types</Text>
      <View style={styles.switchRow}>
        <Text>ASE</Text>
        <Switch value={ase} onValueChange={setAse} />
      </View>
      <View style={styles.switchRow}>
        <Text>Contract Labour</Text>
        <Switch value={contract} onValueChange={setContract} />
      </View>
      <View style={styles.switchRow}>
        <Text>Minimum Wage</Text>
        <Switch value={minimumWage} onValueChange={setMinimumWage} />
      </View>

      <Text style={styles.heading}>Uploads</Text>
      <Text style={styles.heading}>Inspector Signature</Text>
      {user?.signature_base64 ? (
        <Image
          source={{
            uri: `data:image/png;base64,${user.signature_base64}`,
          }}
          style={styles.signatureImage}
          resizeMode="contain"
        />
      ) : (
        <Text>No Signature Available</Text>
      )}

      <TouchableOpacity style={styles.uploadBox}>
        <Text>Select Establishment Photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.uploadBox}>
        <Text>Select Employer Signature</Text>
      </TouchableOpacity>

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
        ) : gpsStatus === "failed" ? (
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  heading: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },
  label: {
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 8,
  },
  uploadBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#999",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
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
    marginBottom: 15,
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
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: "#E8F5E9",
  },
  statusBadgeCurrent: {
    backgroundColor: "#E3F2FD",
  },
  statusBadgePending: {
    backgroundColor: "#FFF3E0",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
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