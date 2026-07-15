import { API, BASE_URL } from "@/services/api";
import { extractGPSFromImage } from "@/utils/exifLocation";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import CameraWithGPS from "../CameraWithGPS";

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
  const [emplSignPath, setEmplSignPath] = useState(
    common?.common_data?.files?.empl_sign || "",
  );
  const [emplSignPreview, setEmplSignPreview] = useState("");
  const [photoPath, setPhotoPath] = useState(
    common?.common_data?.files?.est_photo || "",
  );
  const [photoPreview, setPhotoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [apiError, setApiError] = useState<string>("");

  const [cameraVisible, setCameraVisible] = useState(false);
  const [extractedGps, setExtractedGps] = useState<{ latitude: number; longitude: number } | null>(null);

  const isCompleted = sectionsStatus?.common === true;
  const isCurrent = currentStep === "common";

  // ─── Form state (unchanged) ───
  const [firstName, setFirstName] = useState(common?.common_data?.employer?.first_name || "");
  const [lastName, setLastName] = useState(common?.common_data?.employer?.last_name || "");
  const [mobile, setMobile] = useState(common?.common_data?.employer?.mobile || "");
  const [alternateMobile, setAlternateMobile] = useState(common?.common_data?.employer?.alt_mobile || "");
  const [email, setEmail] = useState(common?.common_data?.employer?.email || "");
  const [address1, setAddress1] = useState(common?.common_data?.establishment?.address_1 || "");
  const [address2, setAddress2] = useState(common?.common_data?.establishment?.address_2 || "");
  const [address3, setAddress3] = useState(common?.common_data?.establishment?.address_3 || "");
  const [landmark, setLandmark] = useState(common?.common_data?.establishment?.landmark || "");
  const [district, setDistrict] = useState(common?.common_data?.establishment?.district || "");
  const [wardNo, setWardNo] = useState(common?.common_data?.establishment?.ward_no || "");
  const [ase, setAse] = useState(common?.selected_types?.includes("ase") || false);
  const [contract, setContract] = useState(common?.selected_types?.includes("contract") || false);
  const [minimumWage, setMinimumWage] = useState(common?.selected_types?.includes("minimumwage") || false);
  const [dateOfInspection, setDateOfInspection] = useState(
    common?.common_data?.inspector?.date || new Date().toISOString().split("T")[0],
  );
  const [panchayat, setPanchayat] = useState(common?.common_data?.establishment?.panchayat || "");
  const [submissionLocation, setSubmissionLocation] = useState(
    common?.common_data?.submission_location || application?.submission_location || "",
  );

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingSign, setUploadingSign] = useState(false);
  const [inspectorSignPath] = useState(
    common?.common_data?.files?.inspector_sign || user?.signature || "",
  );

  const [gpsStatus, setGpsStatus] = useState<"idle" | "waiting" | "success" | "failed" | "no_gps_in_photo">("idle");

  // ─── Load existing previews on mount ───
  useEffect(() => {
    const loadData = async () => {
      // Load establishment photo
      if (photoPath) {
        if (photoPath.startsWith("temp/")) {
          setPhotoPreview(`${BASE_URL}/storage/${photoPath}`);
        } else {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await API.get("/private-file-base64", {
              params: { path: photoPath },
              headers: { Authorization: `Bearer ${token}` },
            });
            setPhotoPreview(`data:${res.data.mime};base64,${res.data.base64}`);
          } catch (e) {
            console.log("Establishment photo load failed");
          }
        }
      }

      // Load employer signature
      if (emplSignPath) {
        if (emplSignPath.startsWith("temp/")) {
          setEmplSignPreview(`${BASE_URL}/storage/${emplSignPath}`);
        } else {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await API.get("/private-file-base64", {
              params: { path: emplSignPath },
              headers: { Authorization: `Bearer ${token}` },
            });
            setEmplSignPreview(`data:${res.data.mime};base64,${res.data.base64}`);
          } catch (e) {
            console.log("Employer signature load failed");
          }
        }
      }

      // ─── NEW: Restore GPS from common.common_data.gps_location ───
      const gps = common?.common_data?.gps_location;
      if (gps?.latitude && gps?.longitude) {
        setExtractedGps({
          latitude: parseFloat(gps.latitude),
          longitude: parseFloat(gps.longitude),
        });
        setGpsStatus("success");
      }
    };

    loadData();
  }, []);

  const loadPrivateFile = async (path: string, setPreview: (uri: string) => void) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await API.get("/private-file-base64", {
        params: { path },
        headers: { Authorization: `Bearer ${token}` },
      });
      setPreview(`data:${res.data.mime};base64,${res.data.base64}`);
    } catch (e) {
      console.log("File load failed");
    }
  };

  // ─── Upload helper ───
  const uploadToTemp = async (uri: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", {
      uri: uri,
      type: "image/jpeg",
      name: "upload.jpg",
    } as any);

    const token = await AsyncStorage.getItem("token");
    const res = await API.post("/upload/temp", formData, {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data.data.path;
  };

  // ─── Photo captured from camera ───
  const handlePhotoCaptured = async (photoUri: string, gpsLocation: { latitude: number; longitude: number }) => {
    setCameraVisible(false);
    setUploadingPhoto(true);
    setGpsStatus("waiting");

    try {
      // Verify GPS is actually in the EXIF
      const exifGps = await extractGPSFromImage(photoUri);

      if (!exifGps) {
        Alert.alert(
          "GPS Not Found",
          "The captured photo does not contain GPS location data. Please ensure location services are enabled and try again.",
          [{ text: "OK" }]
        );
        setGpsStatus("no_gps_in_photo");
        setUploadingPhoto(false);
        return;
      }

      setExtractedGps({
        latitude: exifGps.latitude,
        longitude: exifGps.longitude,
      });

      setPhotoPreview(photoUri);
      setGpsStatus("success");

      const serverPath = await uploadToTemp(photoUri);
      setPhotoPath(serverPath);

      if (errors["inspection_photo_path"]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next["inspection_photo_path"];
          return next;
        });
      }
    } catch (err: any) {
      console.error("Photo processing error:", err);
      setApiError("Failed to process photo. Please try again.");
      setGpsStatus("failed");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // ─── Signature gallery picker ───
  const handlePickSignature = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Permission to access media library is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      setUploadingSign(true);
      setEmplSignPreview(asset.uri);

      const serverPath = await uploadToTemp(asset.uri);
      setEmplSignPath(serverPath);

      if (errors["empl_sign_path"]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next["empl_sign_path"];
          return next;
        });
      }
    } catch (err: any) {
      console.error("Signature upload error:", err);
      setApiError("Signature upload failed. Please try again.");
    } finally {
      setUploadingSign(false);
    }
  };

  // ─── Save ───
  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    setApiError("");

    if (!extractedGps) {
      setSaving(false);
      Alert.alert(
        "GPS Location Required",
        "Please capture the establishment photo using the camera to include GPS location data.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      const formSelector: string[] = [];
      if (ase) formSelector.push("ase");
      if (contract) formSelector.push("contract");
      if (minimumWage) formSelector.push("minimumwage");

      const payload = {
        application_ref_no: application?.appl_ref_no,
        name_of_the_establishment: application?.name_of_the_establishment,
        name_of_inspector: `${user?.firstname || ""} ${user?.lastname || ""}`.trim(),
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
        latitude: extractedGps.latitude,
        longitude: extractedGps.longitude,
        gps_source: 'photo_exif',
      };

      await onSave(payload);
    } catch (error: any) {
      if (error?.response?.status === 422) {
        setErrors(error.response.data.errors || {});
        Alert.alert("Validation Error", error.response.data.message);
      } else {
        setApiError(error?.response?.data?.message || "Something went wrong.");
        Alert.alert("Error", error?.response?.data?.message || "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  const isBusy = saving || gpsAcquiring || uploadingPhoto || uploadingSign;

  const getFieldError = (fieldName: string): string => errors[fieldName]?.[0] || "";
  const hasFieldError = (fieldName: string): boolean => !!errors[fieldName]?.length;

  return (
    <View style={styles.container}>
      {/* Camera Modal */}
      <Modal visible={cameraVisible} animationType="slide" presentationStyle="fullScreen">
        <CameraWithGPS
          onPhotoCaptured={handlePhotoCaptured}
          onCancel={() => setCameraVisible(false)}
        />
      </Modal>

      {/* Header */}
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

      {apiError ? (
        <View style={styles.apiErrorBanner}>
          <Text style={styles.apiErrorText}>⚠ {apiError}</Text>
        </View>
      ) : null}

      {gpsStatus === "waiting" && (
        <View style={styles.gpsWaitingBanner}>
          <ActivityIndicator size="small" color="#FF9800" />
          <Text style={styles.gpsWaitingText}>📡 Processing photo GPS data...</Text>
        </View>
      )}

      {gpsStatus === "no_gps_in_photo" && (
        <View style={styles.gpsFailedBanner}>
          <Text style={styles.gpsFailedText}>
            ❌ Photo has no GPS. Please retake photo with location enabled.
          </Text>
        </View>
      )}

      {gpsStatus === "failed" && !Object.keys(errors).length && (
        <View style={styles.gpsFailedBanner}>
          <Text style={styles.gpsFailedText}>❌ GPS Error. Please try again.</Text>
        </View>
      )}

      {gpsStatus === "success" && extractedGps && (
        <View style={styles.gpsSuccessBanner}>
          <Text style={styles.gpsSuccessText}>
            ✅ GPS Captured: {extractedGps.latitude.toFixed(6)}, {extractedGps.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Inspector Details */}
      <Text style={styles.heading}>Inspector Details</Text>
      <Text style={styles.label}>Date of Inspection</Text>
      <TextInput
        style={[styles.input, hasFieldError("date_of_inspection") && styles.inputError]}
        value={dateOfInspection}
        onChangeText={setDateOfInspection}
        placeholder="YYYY-MM-DD"
      />
      {getFieldError("date_of_inspection") ? <Text style={styles.fieldError}>{getFieldError("date_of_inspection")}</Text> : null}

      {/* Employer Details */}
      <Text style={styles.heading}>Employer Details</Text>
      <Text style={styles.label}>Employer first name <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("empl_first_name") && styles.inputError]}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Enter first name"
      />
      {getFieldError("empl_first_name") ? <Text style={styles.fieldError}>{getFieldError("empl_first_name")}</Text> : null}

      <Text style={styles.label}>Last Name <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("empl_last_name") && styles.inputError]}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Enter last name"
      />
      {getFieldError("empl_last_name") ? <Text style={styles.fieldError}>{getFieldError("empl_last_name")}</Text> : null}

      <Text style={styles.label}>Mobile Number <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("empl_mobile_no") && styles.inputError]}
        keyboardType="phone-pad"
        value={mobile}
        onChangeText={setMobile}
        placeholder="Enter mobile number"
        maxLength={10}
      />
      {getFieldError("empl_mobile_no") ? <Text style={styles.fieldError}>{getFieldError("empl_mobile_no")}</Text> : null}

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

      {/* Establishment Details */}
      <Text style={styles.heading}>Establishment Details</Text>
      <Text style={styles.label}>Address 1 <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("est_address_1") && styles.inputError]}
        value={address1}
        onChangeText={setAddress1}
        placeholder="Enter address line 1"
      />
      {getFieldError("est_address_1") ? <Text style={styles.fieldError}>{getFieldError("est_address_1")}</Text> : null}

      <Text style={styles.label}>Address 2 <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("est_address_2") && styles.inputError]}
        value={address2}
        onChangeText={setAddress2}
        placeholder="Enter address line 2"
      />
      {getFieldError("est_address_2") ? <Text style={styles.fieldError}>{getFieldError("est_address_2")}</Text> : null}

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
      {getFieldError("est_landmark") ? <Text style={styles.fieldError}>{getFieldError("est_landmark")}</Text> : null}

      <Text style={styles.label}>District <Text style={styles.required}>*</Text></Text>
      <View style={[styles.input, hasFieldError("est_district") && styles.inputError, { padding: 0 }]}>
        <Picker
          selectedValue={district}
          onValueChange={(value) => {
            setDistrict(value);
            if (value === "Kamrup Metropolitan") setPanchayat("");
            else setWardNo("");
          }}
        >
          <Picker.Item label="Select District" value="" />
          <Picker.Item label="Baksa" value="Baksa" />
          <Picker.Item label="Bajali" value="Bajali" />
          <Picker.Item label="Barpeta" value="Barpeta" />
          <Picker.Item label="Biswanath" value="Biswanath" />
          <Picker.Item label="Bongaigaon" value="Bongaigaon" />
          <Picker.Item label="Cachar" value="Cachar" />
          <Picker.Item label="Charaideo" value="Charaideo" />
          <Picker.Item label="Chirang" value="Chirang" />
          <Picker.Item label="Darrang" value="Darrang" />
          <Picker.Item label="Dhemaji" value="Dhemaji" />
          <Picker.Item label="Dhubri" value="Dhubri" />
          <Picker.Item label="Dibrugarh" value="Dibrugarh" />
          <Picker.Item label="Dima Hasao" value="Dima Hasao" />
          <Picker.Item label="Goalpara" value="Goalpara" />
          <Picker.Item label="Golaghat" value="Golaghat" />
          <Picker.Item label="Hailakandi" value="Hailakandi" />
          <Picker.Item label="Hojai" value="Hojai" />
          <Picker.Item label="Jorhat" value="Jorhat" />
          <Picker.Item label="Kamrup" value="Kamrup" />
          <Picker.Item label="Kamrup Metropolitan" value="Kamrup Metropolitan" />
          <Picker.Item label="Karbi Anglong" value="Karbi Anglong" />
          <Picker.Item label="Karimganj" value="Karimganj" />
          <Picker.Item label="Kokrajhar" value="Kokrajhar" />
          <Picker.Item label="Lakhimpur" value="Lakhimpur" />
          <Picker.Item label="Majuli" value="Majuli" />
          <Picker.Item label="Morigaon" value="Morigaon" />
          <Picker.Item label="Nagaon" value="Nagaon" />
          <Picker.Item label="Nalbari" value="Nalbari" />
          <Picker.Item label="Sivasagar" value="Sivasagar" />
          <Picker.Item label="Sonitpur" value="Sonitpur" />
          <Picker.Item label="South Salmara-Mankachar" value="South Salmara-Mankachar" />
          <Picker.Item label="Tamulpur" value="Tamulpur" />
          <Picker.Item label="Tinsukia" value="Tinsukia" />
          <Picker.Item label="Udalguri" value="Udalguri" />
          <Picker.Item label="West Karbi Anglong" value="West Karbi Anglong" />
        </Picker>
      </View>
      {getFieldError("est_district") ? <Text style={styles.fieldError}>{getFieldError("est_district")}</Text> : null}

      {district === "Kamrup Metropolitan" ? (
        <>
          <Text style={styles.label}>Ward No <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, hasFieldError("est_ward_no") && styles.inputError]}
            value={wardNo}
            onChangeText={setWardNo}
            placeholder="Enter ward number"
          />
          {getFieldError("est_ward_no") ? <Text style={styles.fieldError}>{getFieldError("est_ward_no")}</Text> : null}
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
          {getFieldError("panchayat") ? <Text style={styles.fieldError}>{getFieldError("panchayat")}</Text> : null}
        </>
      )}

      <Text style={styles.label}>Submission Location <Text style={styles.required}>*</Text></Text>
      <TextInput
        style={[styles.input, hasFieldError("submission_location") && styles.inputError]}
        value={submissionLocation}
        onChangeText={setSubmissionLocation}
        placeholder="Enter submission location"
      />
      {getFieldError("submission_location") ? <Text style={styles.fieldError}>{getFieldError("submission_location")}</Text> : null}

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
      {getFieldError("form_selector") ? <Text style={styles.fieldError}>{getFieldError("form_selector")}</Text> : null}

      <Text style={styles.heading}>Uploads</Text>

      {/* Inspector Signature */}
      <Text style={styles.label}>Inspector Signature <Text style={styles.required}>*</Text></Text>
      {user?.signature_base64 ? (
        <>
          <Image
            source={{ uri: `data:image/png;base64,${user.signature_base64}` }}
            style={[styles.signatureImage, hasFieldError("inspector_sign_path") && styles.imageError]}
            resizeMode="contain"
          />
          {getFieldError("inspector_sign_path") ? <Text style={styles.fieldError}>{getFieldError("inspector_sign_path")}</Text> : null}
        </>
      ) : (
        <>
          <View style={[styles.noSignatureBox, hasFieldError("inspector_sign_path") && styles.inputError]}>
            <Text style={styles.noSignatureText}>No Signature Available</Text>
          </View>
          {getFieldError("inspector_sign_path") ? <Text style={styles.fieldError}>{getFieldError("inspector_sign_path")}</Text> : null}
        </>
      )}

      {/* ─── ESTABLISHMENT PHOTO: CAMERA ONLY ─── */}
      <Text style={styles.label}>Establishment Photo <Text style={styles.required}>*</Text></Text>
      <Text style={styles.photoHint}>
        📷 You must take a photo from the camera. GPS location will be embedded automatically.
      </Text>

      {!photoPreview ? (
        <TouchableOpacity
          style={[styles.uploadBox, hasFieldError("inspection_photo_path") && styles.inputError]}
          onPress={() => setCameraVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.uploadBoxText}>📷 Open Camera & Take Photo</Text>
          <Text style={styles.uploadBoxSubtext}>GPS location will be captured</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.photoPreviewContainer}>
          <Image source={{ uri: photoPreview }} style={styles.uploadPreview} resizeMode="cover" />
          <TouchableOpacity
            style={styles.retakeButton}
            onPress={() => {
              setPhotoPreview("");
              setPhotoPath("");
              setExtractedGps(null);
              setGpsStatus("idle");
              setCameraVisible(true);
            }}
          >
            <Text style={styles.retakeButtonText}>🔄 Retake Photo</Text>
          </TouchableOpacity>
          {extractedGps && (
            <View style={styles.gpsInfoBox}>
              <Text style={styles.gpsInfoText}>📍 Lat: {extractedGps.latitude.toFixed(6)}</Text>
              <Text style={styles.gpsInfoText}>📍 Lng: {extractedGps.longitude.toFixed(6)}</Text>
            </View>
          )}
        </View>
      )}
      {getFieldError("inspection_photo_path") ? <Text style={styles.fieldError}>{getFieldError("inspection_photo_path")}</Text> : null}

      {/* ─── EMPLOYER SIGNATURE: GALLERY PICKER ─── */}
      <Text style={styles.label}>Employer Signature <Text style={styles.required}>*</Text></Text>
      <TouchableOpacity
        style={[styles.uploadBox, emplSignPath ? styles.uploadBoxHasImage : null, hasFieldError("empl_sign_path") && styles.inputError]}
        onPress={handlePickSignature}
        activeOpacity={0.7}
        disabled={uploadingSign}
      >
        {uploadingSign ? (
          <ActivityIndicator size="small" color="#1976D2" />
        ) : emplSignPreview ? (
          <Image source={{ uri: emplSignPreview }} style={styles.uploadPreview} resizeMode="contain" />
        ) : (
          <Text style={styles.uploadBoxText}>✍️ Select Employer Signature from Gallery</Text>
        )}
        {emplSignPreview && !uploadingSign && (
          <View style={styles.retakeOverlay}>
            <Text style={styles.retakeText}>Tap to change</Text>
          </View>
        )}
      </TouchableOpacity>
      {getFieldError("empl_sign_path") ? <Text style={styles.fieldError}>{getFieldError("empl_sign_path")}</Text> : null}

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, (isBusy || !extractedGps) && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isBusy || !extractedGps}
      >
        {isBusy ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.saveText}>{uploadingPhoto ? "Processing Photo..." : "Saving..."}</Text>
          </View>
        ) : !extractedGps ? (
          <Text style={styles.saveText}>Take Photo with GPS First</Text>
        ) : (
          <Text style={styles.saveText}>Save Common Details</Text>
        )}
      </TouchableOpacity>
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
  statusBadgeTextCompleted: { color: "#2E7D32" },
  statusBadgeTextCurrent: { color: "#1565C0" },
  statusBadgeTextPending: { color: "#E65100" },
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
  uploadBoxHasImage: {
    borderStyle: "solid",
    borderColor: "#1976D2",
    backgroundColor: "#fff",
    padding: 0,
    overflow: "hidden",
  },
  uploadBoxText: {
    color: "#666",
    fontSize: 14,
  },
  uploadBoxSubtext: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  uploadPreview: {
    width: "100%",
    height: 180,
    borderRadius: 8,
  },
  retakeOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 6,
    alignItems: "center",
  },
  retakeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#1976D2",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#9E9E9E",
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
  gpsSuccessBanner: {
    backgroundColor: "#E8F5E9",
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  gpsSuccessText: {
    color: "#2E7D32",
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
  photoHint: {
    color: "#666",
    fontSize: 12,
    marginBottom: 8,
    fontStyle: "italic",
  },
  photoPreviewContainer: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#1976D2",
  },
  retakeButton: {
    backgroundColor: "#1976D2",
    paddingVertical: 10,
    alignItems: "center",
  },
  retakeButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  gpsInfoBox: {
    backgroundColor: "#E8F5E9",
    padding: 10,
    alignItems: "center",
  },
  gpsInfoText: {
    color: "#2E7D32",
    fontSize: 12,
    fontWeight: "500",
  },
});
