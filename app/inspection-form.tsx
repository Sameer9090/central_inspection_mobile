import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator, 
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";

import OtpModal from "@/components/inspection/OtpModal";
import NetInfo from "@react-native-community/netinfo";
import ASEForm from "../components/inspection/ASEForm";
import CommonForm from "../components/inspection/CommonForm";
import ContractLabourForm from "../components/inspection/ContractLabourForm";
import MWForm from "../components/inspection/MWForm";
import PreviewForm from "../components/inspection/PreviewForm";
import { API } from "../services/api";
// import { getOfflineDatabase } from "../services/offlineDatabase";
import {
  deleteInspectionDrafts,
  deleteInspectionDraftsForSection,
  getCachedApplication,
  getCompletedInspection,
  getPendingInspection,
  getInspectionDraft,
  saveCachedApplication,
  saveCompletedInspection,
  savePendingInspection,
  saveInspectionDraft,
} from "../services/offlineStorage";
import { getCurrentLocation } from "../utils/location";
import { saveDebugLog } from "../services/debugLogger";
import ScrollNavigation from "../components/ScrollNavigation";


export default function InspectionFormScreen() {
  const [submittingInspection, setSubmittingInspection] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
  const scrollViewRef = useRef<ScrollView>(null);
  const submitTapLock = useRef(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);
  // Step tracking from backend
  const [currentStep, setCurrentStep] = useState<string>("common");
  const [sectionsStatus, setSectionsStatus] = useState<Record<string, boolean>>({});
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [eodbCommon, setEodbCommon] = useState<string[]>([]);
  const [eodbAse, setEodbAse] = useState<string[]>([]);
  useEffect(() => {
    loadApplication();
  }, []);
  useEffect(() => {
    saveDebugLog(
      "INSPECTION OTP: Visibility state changed",
      { otpVisible }
    );
  }, [otpVisible]);




  const loadApplication = async () => {
    const referenceNumber = String(refNo || "").trim();

    if (!referenceNumber) {
      Alert.alert("Error", "Application reference number is missing.");
      setLoading(false);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const offlineMode = await AsyncStorage.getItem("offline_mode");

      // 1. Retrieve all locally saved inspection data.
      const [
        completedInspection,
        pendingInspection,
        commonDraft,
        aseDraft,
        contractDraft,
        mwDraft,
      ] = await Promise.all([
        getCompletedInspection(referenceNumber),
        getPendingInspection(referenceNumber),
        getInspectionDraft(referenceNumber, "COMMON"),
        getInspectionDraft(referenceNumber, "ASE"),
        getInspectionDraft(referenceNumber, "CONTRACT"),
        getInspectionDraft(referenceNumber, "MINIMUMWAGE"),
      ]);

      setIsSubmitted(!!completedInspection);

      console.log("INSPECTION DRAFT RESTORATION:", {
        referenceNumber,
        completed: !!completedInspection,
        pending: !!pendingInspection,
        common: !!commonDraft,
        ase: !!aseDraft,
        contract: !!contractDraft,
        minimumWage: !!mwDraft,
      });

      // 2. Restore inspection data from API or SQLite.
      const restoreInspectionData = (data: any) => {
        if (!data) return;

        setApplication(data.application || null);
        setEodbCommon(data.eodb_common || []);
        setEodbAse(data.eodb || []);
        setUser(data.user || null);

        // Pending inspection data takes priority over cached server data.
        const baseCommon =
          pendingInspection?.common ||
          data.common ||
          {};

        const baseCommonData = baseCommon.common_data || {};

        // 3. Restore COMMON form.
        const restoredCommon = commonDraft
          ? {
            ...baseCommon,

            current_step:
              commonDraft.current_step ||
              baseCommon.current_step ||
              "common",

            selected_types:
              commonDraft.form_selector ||
              baseCommon.selected_types ||
              [],

            common_data: {
              ...baseCommonData,

              inspector: {
                ...(baseCommonData.inspector || {}),
                name:
                  commonDraft.name_of_inspector ??
                  baseCommonData.inspector?.name,
                date:
                  commonDraft.date_of_inspection ??
                  baseCommonData.inspector?.date,
              },

              employer: {
                ...(baseCommonData.employer || {}),
                first_name:
                  commonDraft.empl_first_name ??
                  baseCommonData.employer?.first_name,
                last_name:
                  commonDraft.empl_last_name ??
                  baseCommonData.employer?.last_name,
                mobile:
                  commonDraft.empl_mobile_no ??
                  baseCommonData.employer?.mobile,
                alt_mobile:
                  commonDraft.empl_alt_mobile_no ??
                  baseCommonData.employer?.alt_mobile,
                email:
                  commonDraft.empl_email ??
                  baseCommonData.employer?.email,
              },

              establishment: {
                ...(baseCommonData.establishment || {}),
                address_1:
                  commonDraft.est_address_1 ??
                  baseCommonData.establishment?.address_1,
                address_2:
                  commonDraft.est_address_2 ??
                  baseCommonData.establishment?.address_2,
                address_3:
                  commonDraft.est_address_3 ??
                  baseCommonData.establishment?.address_3,
                landmark:
                  commonDraft.est_landmark ??
                  baseCommonData.establishment?.landmark,
                state:
                  commonDraft.est_state ??
                  baseCommonData.establishment?.state,
                district:
                  commonDraft.est_district ??
                  baseCommonData.establishment?.district,
                pincode:
                  commonDraft.est_pincode ??
                  commonDraft.pincode ??
                  baseCommonData.establishment?.pincode ??
                  "",
                ward_no:
                  commonDraft.est_ward_no ??
                  baseCommonData.establishment?.ward_no,
                panchayat:
                  commonDraft.panchayat ??
                  baseCommonData.establishment?.panchayat,
              },

              submission_location:
                commonDraft.submission_location ??
                baseCommonData.submission_location,

              gps_location: {
                ...(baseCommonData.gps_location || {}),
                latitude:
                  commonDraft.latitude ??
                  baseCommonData.gps_location?.latitude,
                longitude:
                  commonDraft.longitude ??
                  baseCommonData.gps_location?.longitude,
              },

              files: {
                ...(baseCommonData.files || {}),

                est_photo:
                  commonDraft.inspection_photo_local_path ||
                  commonDraft.inspection_photo_path ||
                  baseCommonData.files?.est_photo,

                est_photo_local:
                  commonDraft.inspection_photo_local_path ||
                  baseCommonData.files?.est_photo_local ||
                  "",

                empl_sign:
                  commonDraft.empl_sign_local_path ||
                  commonDraft.empl_sign_path ||
                  baseCommonData.files?.empl_sign,

                empl_sign_local:
                  commonDraft.empl_sign_local_path ||
                  baseCommonData.files?.empl_sign_local ||
                  "",

                inspector_sign:
                  commonDraft.inspector_sign_path ||
                  baseCommonData.files?.inspector_sign,
              },
            },
          }
          : baseCommon;

        setCommon(restoredCommon);

        // 4. Restore inspection sections.
        const ase = data.inspections?.find(
          (item: any) => item.inspection_type === "ASE"
        );

        const contract = data.inspections?.find(
          (item: any) => item.inspection_type === "CONTRACT"
        );

        const mw = data.inspections?.find(
          (item: any) => item.inspection_type === "MINIMUMWAGE"
        );

        setinspectionASE(
          aseDraft ??
          pendingInspection?.ase ??
          ase?.inspection_data ??
          {}
        );

        setinspectionContract(
          contractDraft ??
          pendingInspection?.contract ??
          contract?.inspection_data ??
          {}
        );

        setinspectionMW(
          mwDraft ??
          pendingInspection?.minimumWage ??
          mw?.inspection_data ??
          {}
        );

        setSectionsStatus(baseCommon.sections_status || {});

        // 5. Restore selected inspection types.
        const draftTypes = Array.isArray(commonDraft?.form_selector)
          ? commonDraft.form_selector
          : [];

        const pendingTypes = Array.isArray(
          pendingInspection?.selectedTypes
        )
          ? pendingInspection.selectedTypes
          : [];

        const baseTypes = Array.isArray(baseCommon.selected_types)
          ? baseCommon.selected_types
          : [];

        const restoredTypes =
          (draftTypes.length ? draftTypes :
            pendingTypes.length ? pendingTypes :
              baseTypes).map((type: string) =>
                String(type).toLowerCase()
              );

        setSelectedTypes(restoredTypes);

        // 6. Restore current form step.
        setCurrentStep(
          pendingInspection
            ? "preview"
            : commonDraft?.current_step ||
            baseCommon.current_step ||
            "common"
        );

        // 7. Completed inspection always takes priority.
        if (completedInspection) {
          setCommon(
            completedInspection.common || restoredCommon
          );

          setinspectionASE(completedInspection.ase || {});
          setinspectionContract(completedInspection.contract || {});
          setinspectionMW(completedInspection.minimumWage || {});

          setSelectedTypes(
            completedInspection.selectedTypes || []
          );

          setCurrentStep("preview");
          setIsSubmitted(true);
        }

        console.log("INSPECTION DATA RESTORED:", {
          referenceNumber,
          selectedTypes: restoredTypes,
          completed: !!completedInspection,
          pending: !!pendingInspection,
          aseFields: Object.keys(
            aseDraft ||
            pendingInspection?.ase ||
            ase?.inspection_data ||
            {}
          ).length,
          contractFields: Object.keys(
            contractDraft ||
            pendingInspection?.contract ||
            contract?.inspection_data ||
            {}
          ).length,
          mwFields: Object.keys(
            mwDraft ||
            pendingInspection?.minimumWage ||
            mw?.inspection_data ||
            {}
          ).length,
        });
      };

      // 8. Offline login: load exclusively from SQLite.

      // Check actual internet connectivity instead of relying
      // only on the saved offline-login flag.
      const network = await NetInfo.fetch();

      const isActuallyOffline =
        network.isConnected === false ||
        network.isInternetReachable === false;

      console.log("INSPECTION FORM CONNECTION CHECK:", {
        offlineMode,
        tokenExists: !!token,
        isConnected: network.isConnected,
        isInternetReachable: network.isInternetReachable,
        isActuallyOffline,
      });

      // Use SQLite when internet is unavailable or no token exists.

      if (isActuallyOffline || !token) {
        try {
          const cachedData = await getCachedApplication(referenceNumber);

          if (!cachedData) {
            Alert.alert(
              "Offline Form Unavailable",
              "This inspection form has not been downloaded successfully. Connect to the internet and download it before opening it offline."
            );
            return;
          }

          restoreInspectionData(cachedData);
          return;
        } catch (error: any) {
          Alert.alert(
            "SQLite Error",
            error?.message || "Unable to retrieve cached inspection."
          );
          return;
        }
      }


      // 9. Online login: try the live API.
      try {
        const encodedRefNo = encodeURIComponent(referenceNumber);

        const response = await API.get(
          `/inspection-form/${encodedRefNo}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = response.data;

        if (
          !data ||
          data.success !== true ||
          !Object.prototype.hasOwnProperty.call(data, "application") ||
          !Array.isArray(data.inspections)
        ) {
          throw new Error(
            data?.message || "The inspection form API returned an unexpected response."
          );
        }

        // Update cached server data without deleting local drafts.
        try {
          await saveCachedApplication(referenceNumber, data);

          console.log(
            "Inspection form cached successfully:",
            referenceNumber
          );
        } catch (cacheError) {
          console.log(
            "Inspection form cache save error:",
            cacheError
          );
        }

        restoreInspectionData(data);

        console.log("Inspection form loaded from live API.");

      } catch (apiError: any) {
        console.log(
          "Inspection API Error:",
          apiError?.message
        );

        // 10. API failure: fall back to SQLite.
        const cachedData = await getCachedApplication(referenceNumber);

        if (cachedData) {
          restoreInspectionData(cachedData);

          Alert.alert(
            "Offline Mode",
            "Unable to reach the server. Inspection form loaded from saved data, including your locally saved drafts."
          );
        } else {
          Alert.alert(
            "Connection Error",
            "Unable to reach the server, and no downloaded inspection form was found on this device."
          );
        }
      }

    } catch (error: any) {
      console.log("INSPECTION FORM LOADING ERROR:", {
        message: error?.message,
        referenceNumber,
      });

      Alert.alert(
        "Error",
        "Unable to load the inspection form or its saved drafts."
      );

    } finally {
      setLoading(false);
    }
  };




  useEffect(() => {
    setScrollY(0);

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: 0,
        animated: true,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep]);



  const handleCommonFormSave = async (
    formData: Record<string, any>
  ) => {
    setGpsAcquiring(true);
    let latitude = formData.latitude;
    let longitude = formData.longitude;
    let payload: Record<string, any> = { ...formData };

    try {

      if (
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude))
      ) {
        try {
          const gps = await getCurrentLocation(60000);
          latitude = gps.latitude;
          longitude = gps.longitude;
        } catch {
          throw new Error("GPS_REQUIRED");
        }
      }

      payload = {
        ...formData,
        application_ref_no: String(refNo),
        est_pincode: formData.est_pincode ?? formData.pincode,
        latitude,
        longitude,
      };

      // Always retain a local copy until the server confirms saving.
      await saveInspectionDraft(
        String(refNo),
        "COMMON",
        payload
      );

      const selectedSections = Array.isArray(payload.form_selector)
        ? payload.form_selector.map((type: string) =>
          type.toLowerCase()
        )
        : [];

      // Check actual connectivity, not whether image paths are local.
      // Check both offline login mode and actual network connectivity.
      const offlineMode = await AsyncStorage.getItem("offline_mode");
      const network = await NetInfo.fetch();

      const isOffline =
        offlineMode === "true" ||
        network.isConnected === false ||
        network.isInternetReachable === false;

      if (isOffline) {
        setSelectedTypes(selectedSections);

        setCommon((prev: any) => ({
          ...(prev || {}),
          current_step: selectedSections[0] || "preview",
          selected_types: selectedSections,
          common_data: {
            ...(prev?.common_data || {}),
            inspector: {
              ...(prev?.common_data?.inspector || {}),
              name: payload.name_of_inspector,
              date: payload.date_of_inspection,
            },
            employer: {
              ...(prev?.common_data?.employer || {}),
              first_name: payload.empl_first_name,
              last_name: payload.empl_last_name,
              mobile: payload.empl_mobile_no,
              alt_mobile: payload.empl_alt_mobile_no,
              email: payload.empl_email,
            },
            establishment: {
              ...(prev?.common_data?.establishment || {}),
              address_1: payload.est_address_1,
              address_2: payload.est_address_2,
              address_3: payload.est_address_3,
              landmark: payload.est_landmark,
              state: payload.est_state,
              district: payload.est_district,
              pincode: payload.est_pincode,
              ward_no: payload.est_ward_no,
              panchayat: payload.panchayat,
            },
            submission_location: payload.submission_location,
            gps_location: {
              latitude,
              longitude,
            },
            files: {
              ...(prev?.common_data?.files || {}),
              est_photo: payload.inspection_photo_local_path || payload.inspection_photo_path,
              est_photo_local: payload.inspection_photo_local_path || "",
              empl_sign: payload.empl_sign_local_path || payload.empl_sign_path,
              empl_sign_local: payload.empl_sign_local_path || "",
              inspector_sign: payload.inspector_sign_path,
            },
          },
        }));

        setCurrentStep(selectedSections[0] || "preview");

        Alert.alert(
          "Offline Draft Saved",
          "Common Form and images have been saved on this device. Synchronization is pending. You can continue with the next section when ready."
        );

        return {
          status: true,
          offline: true,
        };
      }

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      // Multipart upload supports local camera image paths.
      const response = await syncCommonInspection(payload, token);

      if (!response?.status) {
        throw new Error(
          response?.message || "Unable to save Common Form."
        );
      }

      // Delete the local draft only after the server confirms saving.
      await deleteInspectionDraftsForSection(
        String(refNo),
        "COMMON"
      );

      const nextStep =
        response.data?.next_step ||
        selectedSections[0] ||
        "preview";

      setSelectedTypes(selectedSections);

      setCommon((prev: any) => ({
        ...(prev || {}),
        current_step: nextStep,
        selected_types: selectedSections,
        common_data: {
          ...(prev?.common_data || {}),
          inspector: {
            ...(prev?.common_data?.inspector || {}),
            name: payload.name_of_inspector,
            date: payload.date_of_inspection,
          },
          employer: {
            ...(prev?.common_data?.employer || {}),
            first_name: payload.empl_first_name,
            last_name: payload.empl_last_name,
            mobile: payload.empl_mobile_no,
            alt_mobile: payload.empl_alt_mobile_no,
            email: payload.empl_email,
          },
          establishment: {
            ...(prev?.common_data?.establishment || {}),
            address_1: payload.est_address_1,
            address_2: payload.est_address_2,
            address_3: payload.est_address_3,
            landmark: payload.est_landmark,
            state: payload.est_state,
            district: payload.est_district,
            pincode: payload.est_pincode,
            ward_no: payload.est_ward_no,
            panchayat: payload.panchayat,
          },
          submission_location: payload.submission_location,
          gps_location: {
            latitude,
            longitude,
          },
          files: {
            ...(prev?.common_data?.files || {}),
            est_photo:
              response.files?.inspection_photo_path ||
              payload.inspection_photo_path || payload.inspection_photo_local_path,
            est_photo_local: payload.inspection_photo_local_path || "",
            empl_sign:
              response.files?.empl_sign_path ||
              payload.empl_sign_path || payload.empl_sign_local_path,
            empl_sign_local: payload.empl_sign_local_path || "",
            inspector_sign:
              response.files?.inspector_sign_path || payload.inspector_sign_path,
          },
        },
      }));

      // Move forward using the server's next_step response.
      setCurrentStep(nextStep);

      Alert.alert(
        "Success",
        "Common Form saved successfully. You can continue with the next inspection section."
      );

      return response.data;

    } catch (error: any) {
      if (error?.message === "GPS_REQUIRED") {
        throw error;
      }

      if (error?.isAxiosError && !error?.response) {
        const selectedSections = Array.isArray(payload.form_selector)
          ? payload.form_selector.map((type: string) => type.toLowerCase())
          : [];

        setSelectedTypes(selectedSections);
        setCommon((prev: any) => ({
          ...(prev || {}),
          current_step: selectedSections[0] || "preview",
          selected_types: selectedSections,
          common_data: {
            ...(prev?.common_data || {}),
            inspector: {
              ...(prev?.common_data?.inspector || {}),
              name: payload.name_of_inspector,
              date: payload.date_of_inspection,
            },
            employer: {
              ...(prev?.common_data?.employer || {}),
              first_name: payload.empl_first_name,
              last_name: payload.empl_last_name,
              mobile: payload.empl_mobile_no,
              alt_mobile: payload.empl_alt_mobile_no,
              email: payload.empl_email,
            },
            establishment: {
              ...(prev?.common_data?.establishment || {}),
              address_1: payload.est_address_1,
              address_2: payload.est_address_2,
              address_3: payload.est_address_3,
              landmark: payload.est_landmark,
              state: payload.est_state,
              district: payload.est_district,
              pincode: payload.est_pincode,
              ward_no: payload.est_ward_no,
              panchayat: payload.panchayat,
            },
            submission_location: payload.submission_location,
            gps_location: { latitude, longitude },
            files: {
              ...(prev?.common_data?.files || {}),
              est_photo: payload.inspection_photo_local_path || payload.inspection_photo_path,
              est_photo_local: payload.inspection_photo_local_path || "",
              empl_sign: payload.empl_sign_local_path || payload.empl_sign_path,
              empl_sign_local: payload.empl_sign_local_path || "",
              inspector_sign: payload.inspector_sign_path,
            },
          },
        }));
        setCurrentStep(selectedSections[0] || "preview");

        Alert.alert(
          "Offline Draft Saved",
          "The server could not be reached. Your Common Form and images are retained locally. Synchronization is pending."
        );

        return { status: true, offline: true };
      }

      Alert.alert(
        "Save Failed",
        error?.response?.data?.message ||
        error?.message ||
        "Unable to save Common Form."
      );

      throw error;
    } finally {
      setGpsAcquiring(false);
    }
  };


  const handleSectionSave = async (sectionType: string, formData: any) => {
    try {
      // Keep a durable local draft until the server confirms this section save.
      await saveInspectionDraft(
        String(refNo),
        sectionType.toUpperCase(),
        formData
      );

      const offlineMode = await AsyncStorage.getItem("offline_mode");
      const network = await NetInfo.fetch();

      const isOffline =
        offlineMode === "true" ||
        network.isConnected === false ||
        network.isInternetReachable === false;
      if (isOffline) {
        if (sectionType === "ase") {
          setinspectionASE(formData);
        } else if (sectionType === "contract") {
          setinspectionContract(formData);
        } else if (sectionType === "minimumwage") {
          setinspectionMW(formData);
        }

        const sectionOrder = ["ase", "contract", "minimumwage"].filter(
          (section) => selectedTypes.includes(section)
        );

        const currentIndex = sectionOrder.indexOf(sectionType);
        const nextStep = sectionOrder[currentIndex + 1] || "preview";

        setCurrentStep(nextStep);

        Alert.alert(
          "Offline Draft Saved",
          `${sectionType.toUpperCase()} details have been saved locally. You can continue with ${nextStep.toUpperCase()}. Your data has not yet been submitted.`
        );

        return {
          status: true,
          offline: true,
        };
      }
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
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

      if (!response.data?.status) {
        throw new Error(
          response.data?.message || "Unable to save inspection section."
        );
      }

      // Remove the local draft only after an explicit server success.
      await deleteInspectionDraftsForSection(
        String(refNo),
        sectionType.toUpperCase()
      );

      Alert.alert(
        "Success",
        `${sectionType.toUpperCase()} saved successfully`
      );

      setCurrentStep(response.data.data?.next_step || "preview");
      await loadApplication();
      return response.data;
    } catch (error: any) {
      console.error("Save error:", error?.response?.data || error);

      if (error?.isAxiosError && !error?.response) {
        try {
          await saveInspectionDraft(
            String(refNo),
            sectionType.toUpperCase(),
            formData
          );

          if (sectionType === "ase") setinspectionASE(formData);
          else if (sectionType === "contract") setinspectionContract(formData);
          else if (sectionType === "minimumwage") setinspectionMW(formData);

          const sectionOrder = ["ase", "contract", "minimumwage"].filter(
            (section) => selectedTypes.includes(section)
          );
          const currentIndex = sectionOrder.indexOf(sectionType);
          const nextStep = sectionOrder[currentIndex + 1] || "preview";
          setCurrentStep(nextStep);

          Alert.alert(
            "Offline Draft Saved",
            `${sectionType.toUpperCase()} details have been saved on this device. They are not yet submitted.`
          );

          return {
            status: true,
            offline: true,
          };
        } catch (draftError: any) {
          console.error("Section draft save error:", draftError);

          Alert.alert(
            "Error",
            `Unable to save ${sectionType} draft locally.`
          );

          throw draftError;
        }
      }

      Alert.alert(
        "Error",
        `Failed to save ${sectionType}: ${error?.response?.data?.message || error.message
        }`
      );

      throw error;
    }
  };


  const syncInspectionSection = async (
    sectionType: string,
    formData: any,
    token: string
  ) => {
    const payload = new FormData();

    payload.append("reference_number", String(refNo));
    payload.append("inspection_type", sectionType);

    Object.entries(formData).forEach(([key, value]: [string, any]) => {
      if (
        key === "inspection_type" ||
        key === "reference_number" ||
        key === "adolescent_details_ase" ||
        key === "adolescent_details_contract" ||
        key === "adolescent_details_minimumwage" ||
        key === "workers_detail_mw"
      ) {
        return;
      }

      if (value === null || value === undefined) return;

      if (Array.isArray(value)) {
        value.forEach((item) => payload.append(`${key}[]`, String(item)));
      } else if (
        typeof value === "object" &&
        value.uri
      ) {
        payload.append(key, {
          uri: value.uri,
          name: value.name || `${key}.jpg`,
          type: value.type || "application/octet-stream",
        } as any);
      } else {
        payload.append(key, String(value));
      }
    });

    const adolescentKey = `adolescent_details_${sectionType}`;
    const adolescents = formData[adolescentKey] || [];

    adolescents.forEach((ado: any, index: number) => {
      payload.append(
        `labour_office_intimation_${sectionType}[${index}]`,
        ado.labour_office_intimation || ""
      );
      payload.append(
        `adolescent_name_${sectionType}[${index}]`,
        ado.name || ""
      );
      payload.append(
        `adolescent_address_${sectionType}[${index}]`,
        ado.address || ""
      );
      payload.append(
        `adolescent_age_${sectionType}[${index}]`,
        ado.age || ""
      );
      payload.append(
        `hazardous_work_${sectionType}[${index}]`,
        ado.hazardous_work || ""
      );
      payload.append(
        `working_hours_${sectionType}[${index}]`,
        ado.working_hours || ""
      );
      payload.append(
        `wage_amount_${sectionType}[${index}]`,
        ado.wage_amount || ""
      );
      payload.append(
        `maintain_register_${sectionType}[${index}]`,
        ado.maintain_register || ""
      );

      if (ado.age_proof?.uri) {
        payload.append(
          `age_proof_${sectionType}[${index}]`,
          {
            uri: ado.age_proof.uri,
            name: ado.age_proof.name || `age_proof_${index}.pdf`,
            type: ado.age_proof.type || "application/pdf",
          } as any
        );
      }
    });

    if (sectionType === "minimumwage") {
      (formData.workers_detail_mw || []).forEach(
        (worker: any, index: number) => {
          payload.append(`worker_name_mw[${index}]`, worker.name || "");
          payload.append(
            `worker_designation_mw[${index}]`,
            worker.designation || ""
          );
          payload.append(`worker_doj_mw[${index}]`, worker.doj || "");
          payload.append(`worker_wages_mw[${index}]`, worker.wages || "");

          if (worker.payslip?.uri) {
            payload.append(`worker_payslip[${index}]`, {
              uri: worker.payslip.uri,
              name: worker.payslip.name || `payslip_${index}.pdf`,
              type: worker.payslip.type || "application/pdf",
            } as any);
          }
        }
      );
    }

    const response = await API.post("/section/save", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data.status) {
      throw new Error(response.data.message || `${sectionType} synchronization failed`);
    }

    return response.data;
  };


  const syncCommonInspection = async (
    formData: any,
    token: string
  ) => {
    const payload = {
      application_ref_no: formData.application_ref_no || String(refNo),

      name_of_the_establishment:
        formData.name_of_the_establishment ||
        application.name_of_the_establishment,

      name_of_inspector: formData.name_of_inspector,
      date_of_inspection: formData.date_of_inspection,

      empl_first_name: formData.empl_first_name,
      empl_last_name: formData.empl_last_name,
      empl_mobile_no: formData.empl_mobile_no,
      empl_alt_mobile_no: formData.empl_alt_mobile_no,
      empl_email: formData.empl_email,

      est_address_1: formData.est_address_1,
      est_address_2: formData.est_address_2,
      est_address_3: formData.est_address_3,
      est_landmark: formData.est_landmark,

      est_state: formData.est_state,
      est_district: formData.est_district,
      est_pincode:
        formData.est_pincode ??
        formData.pincode ??
        "",
      est_ward_no: formData.est_ward_no,
      panchayat: formData.panchayat,

      submission_location: formData.submission_location,

      latitude: formData.latitude,
      longitude: formData.longitude,

      form_selector: formData.form_selector,
      ubin: formData.ubin || application.ubin,
    };

    const multipartPayload = new FormData();
    console.log("PINCODE BEING SENT TO LARAVEL:", payload.est_pincode);


    Object.entries(payload).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === "form_selector" && Array.isArray(value)) {
          value.forEach((item) =>
            multipartPayload.append("form_selector[]", item)
          );
        } else {
          multipartPayload.append(key, String(value));
        }
      }
    });

    const attachments = [
      {
        field: "inspection_photo_path",
        file: formData.inspection_photo_path || formData.inspection_photo_local_path,
        name: "inspection_photo.jpg",
      },
      {
        field: "empl_sign_path",
        file: formData.empl_sign_path || formData.empl_sign_local_path,
        name: "employer_signature.jpg",
      },
      {
        field: "inspector_sign_path",
        file: formData.inspector_sign_path,
        name: "inspector_signature.jpg",
      },
    ];

    console.log(
      "COMMON ATTACHMENTS:",
      attachments.map(({ field, file }) => ({
        field,
        fileType: typeof file,
        uri: typeof file === "string" ? file : file?.uri,
      }))
    );

    attachments.forEach(({ field, file, name }) => {
      if (!file) return;

      // Case 1: File object with URI
      if (typeof file === "object" && file.uri) {
        multipartPayload.append(field, {
          uri: file.uri,
          name: file.name || name,
          type: file.type || "image/jpeg",
        } as any);

        return;
      }

      // Case 2: Local file path stored as a string
      if (typeof file === "string" && file.startsWith("file://")) {
        const extension = file.split("?")[0].split(".").pop()?.toLowerCase();

        const mimeType =
          extension === "png" ? "image/png" : "image/jpeg";

        multipartPayload.append(field, {
          uri: file,
          name,
          type: mimeType,
        } as any);

        return;
      }

      // Case 3: Already-uploaded server-side file path
      if (typeof file === "string") {
        multipartPayload.append(field, file);
      }
    });

    const response = await API.post("/common/save", multipartPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.data.status) {
      throw new Error(
        response.data.message || "Common inspection sync failed"
      );
    }

    // Return the server-side file paths for final submission.
    return {
      ...response.data,
      files: response.data.data?.files,
    };
  };



  const saveCurrentInspectionLocally = async () => {
    const referenceNumber = String(refNo || "").trim();

    if (!referenceNumber) {
      throw new Error("Application reference number is missing.");
    }

    // 1. Retrieve all locally saved inspection drafts.
    const [commonDraft, aseDraft, contractDraft, mwDraft] =
      await Promise.all([
        getInspectionDraft(referenceNumber, "COMMON"),
        getInspectionDraft(referenceNumber, "ASE"),
        getInspectionDraft(referenceNumber, "CONTRACT"),
        getInspectionDraft(referenceNumber, "MINIMUMWAGE"),
      ]);

    // 2. Resolve selected inspection types.
    const draftTypes = Array.isArray(commonDraft?.form_selector)
      ? commonDraft.form_selector.map(
        (type: string) => String(type).toLowerCase()
      )
      : [];

    const resolvedTypes = selectedTypes.length
      ? selectedTypes
      : draftTypes.length
        ? draftTypes
        : (
          common?.selected_types ||
          common?.common_data?.selected_types ||
          []
        );

    // 3. Preserve existing data and merge the latest COMMON draft.
    const existingCommonData = common?.common_data || {};

    const commonFromDraft = {
      ...(common || {}),
      current_step: "preview",
      selected_types: resolvedTypes,

      common_data: {
        ...existingCommonData,

        inspector: {
          ...(existingCommonData.inspector || {}),
          name:
            commonDraft?.name_of_inspector ??
            existingCommonData.inspector?.name,
          date:
            commonDraft?.date_of_inspection ??
            existingCommonData.inspector?.date,
        },

        employer: {
          ...(existingCommonData.employer || {}),
          first_name:
            commonDraft?.empl_first_name ??
            existingCommonData.employer?.first_name,
          last_name:
            commonDraft?.empl_last_name ??
            existingCommonData.employer?.last_name,
          mobile:
            commonDraft?.empl_mobile_no ??
            existingCommonData.employer?.mobile,
          alt_mobile:
            commonDraft?.empl_alt_mobile_no ??
            existingCommonData.employer?.alt_mobile,
          email:
            commonDraft?.empl_email ??
            existingCommonData.employer?.email,
        },

        establishment: {
          ...(existingCommonData.establishment || {}),
          address_1:
            commonDraft?.est_address_1 ??
            existingCommonData.establishment?.address_1,
          address_2:
            commonDraft?.est_address_2 ??
            existingCommonData.establishment?.address_2,
          address_3:
            commonDraft?.est_address_3 ??
            existingCommonData.establishment?.address_3,
          landmark:
            commonDraft?.est_landmark ??
            existingCommonData.establishment?.landmark,
          state:
            commonDraft?.est_state ??
            existingCommonData.establishment?.state,
          district:
            commonDraft?.est_district ??
            existingCommonData.establishment?.district,
          pincode:
            commonDraft?.est_pincode ??
            commonDraft?.pincode ??
            existingCommonData.establishment?.pincode ??
            "",
          ward_no:
            commonDraft?.est_ward_no ??
            existingCommonData.establishment?.ward_no,
          panchayat:
            commonDraft?.panchayat ??
            existingCommonData.establishment?.panchayat,
        },

        submission_location:
          commonDraft?.submission_location ??
          existingCommonData.submission_location,

        gps_location: {
          ...(existingCommonData.gps_location || {}),
          latitude:
            commonDraft?.latitude ??
            existingCommonData.gps_location?.latitude,
          longitude:
            commonDraft?.longitude ??
            existingCommonData.gps_location?.longitude,
        },

        files: {
          ...(existingCommonData.files || {}),

          est_photo:
            commonDraft?.inspection_photo_local_path ||
            commonDraft?.inspection_photo_path ||
            existingCommonData.files?.est_photo,

          est_photo_local:
            commonDraft?.inspection_photo_local_path ||
            existingCommonData.files?.est_photo_local ||
            "",

          empl_sign:
            commonDraft?.empl_sign_local_path ||
            commonDraft?.empl_sign_path ||
            existingCommonData.files?.empl_sign,

          empl_sign_local:
            commonDraft?.empl_sign_local_path ||
            existingCommonData.files?.empl_sign_local ||
            "",

          inspector_sign:
            commonDraft?.inspector_sign_path ||
            existingCommonData.files?.inspector_sign,
        },
      },
    };

    // 4. Assemble the complete pending inspection payload.
    const pendingPayload = {
      common: commonFromDraft,
      ase: aseDraft ?? inspectionASE ?? {},
      contract: contractDraft ?? inspectionContract ?? {},
      minimumWage: mwDraft ?? inspectionMW ?? {},
      selectedTypes: resolvedTypes,
    };

    // 5. Save pending inspection locally.
    await savePendingInspection(referenceNumber, pendingPayload);

    // 6. Record debug information.
    await saveDebugLog(
      "INSPECTION SAVED LOCALLY - PENDING SUBMISSION",
      {
        referenceNumber,
        selectedTypes: pendingPayload.selectedTypes,
        commonDraftFound: !!commonDraft,
        aseDraftFound: !!aseDraft,
        contractDraftFound: !!contractDraft,
        mwDraftFound: !!mwDraft,
      }
    ).catch((error) =>
      console.warn("Debug logging failed:", error)
    );

    console.log(
      "PENDING INSPECTION BACKUP COMPLETED:",
      referenceNumber
    );

    return pendingPayload;
  };




  const handleFinalSubmit = async () => {
    if (submitTapLock.current || sendingOtp || requestingOtp || submitting) {
      return;
    }

    if (isSubmitted) {
      Alert.alert(
        "Already Submitted",
        "This inspection has already been submitted."
      );
      return;
    }

    submitTapLock.current = true;
    setSubmittingInspection(true);

    // Save the inspection locally before deciding whether to request OTP.
    // The OTP modal should only appear when an internet connection is available.

    try {
      // STEP 1: Save the complete inspection locally first.
      console.log("FINAL SUBMIT: Saving local inspection backup.");

      try {
        await saveCurrentInspectionLocally();

        console.log("FINAL SUBMIT: Local backup successful.");
      } catch (saveError: any) {
        console.error("LOCAL SAVE FAILED:", saveError);

        Alert.alert(
          "Local Save Failed",
          saveError?.message ||
          "Unable to save this inspection on the device. Please try again and do not close the form."
        );
        return;
      }

      // STEP 2: Check internet connectivity.
      const network = await NetInfo.fetch();

      console.log("FINAL SUBMIT: Network status:", {
        isConnected: network.isConnected,
        isInternetReachable: network.isInternetReachable,
        type: network.type,
      });

      // No internet: do not attempt OTP or final submission.
      if (
        network.isConnected !== true ||
        network.isInternetReachable === false
      ) {
        setOtpVisible(false);

        Alert.alert(
          "Inspection Saved Locally",
          "Your inspection form is successfully saved locally. Kindly connect to the internet for final submission."
        );

        return;
      }

      // STEP 3: Verify that the CIS server is actually reachable.
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        setOtpVisible(false);

        Alert.alert(
          "Inspection Saved Locally",
          "Your inspection has been saved on this device, but your authentication session is unavailable. The inspection has NOT been submitted. Please log in online and verify its status before retrying."
        );

        return;
      }

      // The OTP request below will confirm server reachability.
      // Avoid making a separate preliminary API request here.

      // STEP 4: Internet is available and a session token exists.
      // Now show the OTP modal and request the OTP.
      setOtpVisible(true);
      setSendingOtp(true);
      setRequestingOtp(true);

      const response = await API.post(
        "/office/send-otp-inspection",
        {
          username: user?.username,
        },
        {
          timeout: 30000,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.data?.status) {
        throw new Error(
          response.data?.message || "Unable to send OTP."
        );
      }

      console.log("INSPECTION OTP REQUEST SUCCESSFUL");

    } catch (error: any) {
      console.error("FINAL SUBMISSION PREPARATION FAILED:", {
        message: error?.message,
        status: error?.response?.status,
        response: error?.response?.data,
      });

      setOtpVisible(false);

      if (error?.isAxiosError && !error?.response) {
        Alert.alert(
          "Inspection Saved Locally",
          "Your inspection has been saved on this device. The server could not be reached, so submission has NOT been confirmed. Please reconnect and verify the submission status before retrying."
        );
      } else {
        Alert.alert(
          "OTP Error",
          error?.response?.data?.message ||
          error?.message ||
          "Unable to send OTP. Your inspection backup remains saved locally."
        );
      }

    } finally {
      setRequestingOtp(false);
      setSendingOtp(false);
      setSubmittingInspection(false);
      submitTapLock.current = false;
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

      // Keep the OTP modal visible while the final inspection submission runs.
      // The modal displays the submission progress message during this step.
      // FINAL SUBMIT
      await submitInspection();
      setOtpVisible(false);

    } catch (e: any) {
      if (e?.isAxiosError && !e?.response) {
        try {
          await saveCurrentInspectionLocally();
          setOtpVisible(false);

          Alert.alert(
            "Inspection Saved Locally",
            "The network connection was lost during OTP verification. Your inspection data has been retained on this device. Please reconnect to the internet and reopen the inspection to complete OTP verification and final submission."
          );
        } catch (saveError) {
          Alert.alert(
            "Local Save Failed",
            "The network connection was lost and the inspection could not be saved locally. Please do not close the application."
          );
        }

        return;
      }

      Alert.alert(
        "Verification Failed",
        e?.response?.data?.msg ||
        e?.response?.data?.message ||
        e?.message ||
        "OTP verification failed. Please try again."
      );
    } finally {

      setSubmitting(false);

    }

  };

  const handleResendOtp = async () => {

    try {

      const token = await AsyncStorage.getItem("token");

      const response = await API.post(
        "/office/resend-otp-sms-report",
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
    if (isSubmitted) {
      Alert.alert(
        "Already Submitted",
        "This inspection has already been submitted."
      );
      return;
    }

    console.log("FINAL SUBMISSION: submitInspection() started");

    try {
      setSubmittingInspection(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Authentication token not found. Please log in again."
        );
      }

      // 1. Retrieve COMMON draft and normalize its PIN-code field.
      let syncedCommonFiles: any = null;

      const savedCommonDraft = await getInspectionDraft(
        String(refNo),
        "COMMON"
      );

      const commonDraft = savedCommonDraft
        ? {
          ...savedCommonDraft,
          est_pincode:
            savedCommonDraft.est_pincode ??
            savedCommonDraft.pincode ??
            common?.common_data?.establishment?.pincode ??
            "",
        }
        : null;

      console.log("========== OFFLINE COMMON DRAFT ==========");
      console.log("PIN CODE:", JSON.stringify(commonDraft?.est_pincode));
      console.log("STATE:", JSON.stringify(commonDraft?.est_state));
      console.log("FULL DRAFT:", JSON.stringify(commonDraft, null, 2));
      console.log("===========================================");

      if (commonDraft) {
        try {
          const commonSyncResponse = await syncCommonInspection(
            commonDraft,
            token
          );

          console.log("COMMON SYNC RESPONSE:", commonSyncResponse);

          syncedCommonFiles = commonSyncResponse.files;
        } catch (error: any) {
          console.log("COMMON SYNC FAILED:", {
            url: error.config?.url,
            status: error.response?.status,
            response: error.response?.data,
            message: error.message,
          });

          throw error;
        }
      }

      // 2. Sync each selected section draft, if available.
      const typesToSync = selectedTypes.length
        ? selectedTypes
        : (commonDraft?.form_selector || []).map(
          (type: string) => String(type).toLowerCase()
        );

      for (const sectionType of typesToSync) {
        console.log(`SECTION SYNC STARTED: ${sectionType}`);

        const sectionDraft = await getInspectionDraft(
          String(refNo),
          sectionType.toUpperCase()
        );

        if (sectionDraft) {
          try {
            const sectionResponse = await syncInspectionSection(
              sectionType,
              sectionDraft,
              token
            );

            console.log(
              `SECTION SYNC SUCCESS: ${sectionType}`,
              sectionResponse
            );
          } catch (error: any) {
            console.log(`SECTION SYNC FAILED: ${sectionType}`, {
              url: error.config?.url,
              status: error.response?.status,
              response: error.response?.data,
              message: error.message,
            });

            throw error;
          }
        } else {
          console.log(`SECTION DRAFT NOT FOUND: ${sectionType}`);
        }
      }

      // 3. Prepare final COMMON data.
      const finalCommonData = commonDraft
        ? {
          inspector: {
            name: commonDraft.name_of_inspector,
            date: commonDraft.date_of_inspection,
          },

          employer: {
            first_name: commonDraft.empl_first_name,
            last_name: commonDraft.empl_last_name,
            mobile: commonDraft.empl_mobile_no,
            alt_mobile: commonDraft.empl_alt_mobile_no,
            email: commonDraft.empl_email,
          },

          establishment: {
            address_1: commonDraft.est_address_1,
            address_2: commonDraft.est_address_2,
            landmark: commonDraft.est_landmark,
            district: commonDraft.est_district,
            ward_no: commonDraft.est_ward_no,
            panchayat: commonDraft.panchayat,
            state: commonDraft.est_state,
            pincode:
              commonDraft.est_pincode ||
              common?.common_data?.establishment?.pincode ||
              "",
          },

          submission_location: commonDraft.submission_location,

          files: {
            est_photo:
              syncedCommonFiles?.inspection_photo_path ||
              commonDraft.inspection_photo_path ||
              common?.common_data?.files?.est_photo,

            est_photo_local:
              commonDraft.inspection_photo_local_path ||
              common?.common_data?.files?.est_photo_local ||
              "",

            empl_sign:
              syncedCommonFiles?.empl_sign_path ||
              commonDraft.empl_sign_path ||
              common?.common_data?.files?.empl_sign,

            empl_sign_local:
              commonDraft.empl_sign_local_path ||
              common?.common_data?.files?.empl_sign_local ||
              "",

            inspector_sign:
              syncedCommonFiles?.inspector_sign_path ||
              commonDraft.inspector_sign_path ||
              common?.common_data?.files?.inspector_sign,
          },
        }
        : common?.common_data;

      if (!finalCommonData) {
        throw new Error(
          "Common inspection data is unavailable. Please reopen the inspection form."
        );
      }

      // 4. Prepare final submission payload.
      const payload = {
        application_ref_no: application.appl_ref_no,

        name_of_inspector: finalCommonData.inspector.name,
        date_of_inspection: finalCommonData.inspector.date,

        empl_first_name: finalCommonData.employer.first_name,
        empl_last_name: finalCommonData.employer.last_name,
        empl_mobile_no: finalCommonData.employer.mobile,
        empl_alt_mobile_no: finalCommonData.employer.alt_mobile,
        empl_email: finalCommonData.employer.email,

        est_address_1: finalCommonData.establishment.address_1,
        est_address_2: finalCommonData.establishment.address_2,
        est_landmark: finalCommonData.establishment.landmark,

        est_district: finalCommonData.establishment.district,
        est_ward_no: finalCommonData.establishment.ward_no,
        panchayat: finalCommonData.establishment.panchayat,

        est_state: finalCommonData.establishment.state,
        est_pincode: finalCommonData.establishment.pincode,

        submission_location: finalCommonData.submission_location,

        inspection_photo_path: finalCommonData.files.est_photo,
        empl_sign_path: finalCommonData.files.empl_sign,
        inspector_sign_path: finalCommonData.files.inspector_sign,

        form_selector: typesToSync,

        ubin: application.ubin,
        name_of_the_establishment:
          application.name_of_the_establishment,
      };

      console.log("FINAL API: Sending /inspection-submit");

      const response = await API.post(
        "/inspection-submit",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("FINAL API RESPONSE:", {
        status: response.status,
        data: response.data,
      });

      console.log("PINCODE DEBUG:", {
        draftPincode: commonDraft?.est_pincode,
        commonStatePincode:
          common?.common_data?.establishment?.pincode,
        finalPincode: finalCommonData?.establishment?.pincode,
        payloadPincode: payload.est_pincode,
      });

      // 5. Handle confirmed successful submission.
      if (response.data.status) {
        setIsSubmitted(true);
        setOtpVisible(false);

        try {
          // Archive the completed inspection locally.
          await saveCompletedInspection(String(refNo), {
            common: {
              ...(common || {}),
              common_data: finalCommonData,
              selected_types: typesToSync,
            },
            ase: inspectionASE,
            contract: inspectionContract,
            minimumWage: inspectionMW,
            selectedTypes: typesToSync,
          });
        } catch (localError) {
          console.error(
            "LOCAL ARCHIVE FAILED AFTER SERVER SUBMISSION:",
            localError
          );

          Alert.alert(
            "Submission Successful",
            "The server has confirmed your inspection submission, but the local completion record could not be saved. Please verify the submission online. Do not submit it again.",
            [
              {
                text: "OK",
                onPress: () => router.replace("/dashboard"),
              },
            ]
          );

          return;
        }

        // Delete drafts only after successful local archival.
        try {
          await deleteInspectionDrafts(String(refNo));
        } catch (cleanupError) {
          console.error(
            "DRAFT CLEANUP FAILED:",
            cleanupError
          );
        }

        Alert.alert(
          "Success",
          "Inspection Form Submitted Successfully!",
          [
            {
              text: "OK",
              onPress: () => router.replace("/dashboard"),
            },
          ]
        );
      } else {
        throw new Error(
          response.data.message ||
          "The server did not confirm the inspection submission."
        );
      }

    } catch (e: any) {
      console.log("INSPECTION SUBMISSION FAILED:", {
        message: e.message,
        url: e.config?.url,
        status: e.response?.status,
        response: e.response?.data,
      });

      // 6. Server confirms that this inspection was already submitted.
      if (
        e.response?.status === 409 &&
        e.response?.data?.already_submitted === true
      ) {
        setIsSubmitted(true);
        setOtpVisible(false);
        setCurrentStep("preview");

        try {
          // Preserve the existing pending inspection data, if available.
          const existingPending = await getPendingInspection(
            String(refNo)
          );

          await saveCompletedInspection(String(refNo), {
            common:
              existingPending?.common ??
              common ??
              {},

            ase:
              existingPending?.ase ??
              inspectionASE,

            contract:
              existingPending?.contract ??
              inspectionContract,

            minimumWage:
              existingPending?.minimumWage ??
              inspectionMW,

            selectedTypes:
              existingPending?.selectedTypes ??
              selectedTypes,
          });

          // Do not delete drafts in this situation.

          Alert.alert(
            "Already Submitted",
            "The server confirms that this inspection has already been submitted. It is now locked and cannot be submitted again."
          );

        } catch (localError) {
          console.error(
            "LOCAL ARCHIVE FAILED FOR ALREADY SUBMITTED INSPECTION:",
            localError
          );

          Alert.alert(
            "Already Submitted",
            "The server confirms that this inspection has already been submitted. Editing and resubmission are disabled for this session, but the local completion record could not be saved. Please reopen the application online to verify its status."
          );
        }

        return;
      }

      // 7. Network failure: retain inspection data locally.
      if (e?.isAxiosError && !e?.response) {
        try {
          await saveCurrentInspectionLocally();

          Alert.alert(
            "Inspection Saved Locally",
            "The network connection was lost during final submission. Your inspection data has been retained on this device. The server submission could not be confirmed. Please reconnect and check the submission status before retrying."
          );

        } catch (saveError) {
          console.error(
            "LOCAL PENDING SAVE FAILED:",
            saveError
          );

          Alert.alert(
            "Submission Status Unconfirmed",
            "The network connection was lost and the local backup could not be verified. Please do not close the application. Contact support if the issue persists."
          );
        }

        return;
      }

      // 8. Other submission errors.
      Alert.alert(
        "Submission Error",
        e.response?.data?.message ||
        e.message ||
        "Submission failed."
      );

    } finally {
      setSubmittingInspection(false);
    }
  };

  // FIXED: Navigate back to previous step

  const handleBack = () => {
    const stepOrder = ["common", ...selectedTypes, "preview"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  // FIXED: Correct component mapping for each step
  const renderCurrentForm = () => {
    switch (currentStep) {
      case "common":
        return (
          <CommonForm
            application={application}
            common={common}
            eodbCommon={eodbCommon}
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
            eodbAse={eodbAse}
            eodbCommon={eodbCommon}
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
        console.log("PREVIEW STATE CHECK:", JSON.stringify({
          common,
          selectedTypes,
          currentStep,
        }, null, 2));
        return (
          <PreviewForm
            application={application}
            common={common}
            inspectionASE={inspectionASE}
            inspectionContract={inspectionContract}
            inspectionMW={inspectionMW}
            selectedTypes={selectedTypes}
            onEdit={(step: string) => {
              if (!isSubmitted) {
                setCurrentStep(step);
              }
            }}
            onSubmit={handleFinalSubmit}
            loading={submittingInspection || sendingOtp || submitting}
            readOnly={isSubmitted}
          />
        );
      default:
        return (
          <CommonForm
            application={application}
            common={common}
            eodbCommon={eodbCommon}
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
  // Do not replace the whole screen while an inspection is being prepared.
  // The OTP modal is rendered at the bottom of this screen and must remain
  // mounted so it can appear immediately while the local backup is saved.
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f5f5f5" }}
      edges={["left", "right", "bottom"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />
      <AppHeader />

      <View style={{ flex: 1 }}>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          scrollEventThrottle={16}
          onScroll={(event) => {
            setScrollY(event.nativeEvent.contentOffset.y);
          }}
          onContentSizeChange={(width, height) => {
            setContentHeight(height);
          }}
          onLayout={(event) => {
            setScrollViewHeight(event.nativeEvent.layout.height);
          }}
        >
          <StepProgressIndicator
            currentStep={currentStep}
            sectionsStatus={sectionsStatus}
            selectedTypes={selectedTypes}
          />

          <View style={styles.currentStepBanner}>
            <Text style={styles.currentStepLabel}>Current Step:</Text>
            <Text style={styles.currentStepValue}>
              {getStepLabel(currentStep)}
            </Text>
          </View>

          {renderCurrentForm()}
        </ScrollView>

        <ScrollNavigation
          scrollY={scrollY}
          contentHeight={contentHeight}
          scrollViewHeight={scrollViewHeight}
          onScrollToTop={() => {
            scrollViewRef.current?.scrollTo({
              y: 0,
              animated: true,
            });
          }}
          onScrollToBottom={() => {
            scrollViewRef.current?.scrollToEnd({
              animated: true,
            });
          }}
        />

      </View>

      <OtpModal
        visible={otpVisible}
        mobileNumber={user?.phone}
        loading={submitting}
        requestingOtp={requestingOtp}
        submittingInspection={submittingInspection}
        onClose={() => {
          if (!requestingOtp && !submitting && !submittingInspection) {
            setOtpVisible(false);
          }
        }}
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
  scrollNavigationContainer: {
    position: "absolute",
    right: 15,
    bottom: 35,
    zIndex: 999,
    alignItems: "center",
    gap: 12,
  },

  scrollNavigationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#1a1a4e",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  scrollNavigationText: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "bold",
    lineHeight: 32,
  },
});

