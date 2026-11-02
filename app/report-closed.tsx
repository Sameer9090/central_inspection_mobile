
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../components/AppHeader";
import { API } from "../services/api";

export default function ReportClosedScreen() {
    const { refNo } = useLocalSearchParams<{ refNo: string }>();

    const cameraRef = useRef<CameraView>(null);
    const submittingRef = useRef(false);
    const [cameraPermission, requestCameraPermission] =
        useCameraPermissions();

    const [cameraOpen, setCameraOpen] = useState(false);
    const [photo, setPhoto] = useState<any>(null);
    const [remarks, setRemarks] = useState("");
    const [location, setLocation] = useState<Location.LocationObject | null>(
        null
    );
    const [capturedAt, setCapturedAt] = useState("");
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    const getCurrentLocation = async () => {
        try {
            setLocationLoading(true);

            const permission =
                await Location.requestForegroundPermissionsAsync();

            if (!permission.granted) {
                Alert.alert(
                    "Permission Required",
                    "Location permission is required to report an establishment as closed."
                );
                return null;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setLocation(currentLocation);
            return currentLocation;
        } catch (error) {
            Alert.alert("Location Error", "Unable to capture GPS location.");
            return null;
        } finally {
            setLocationLoading(false);
        }
    };

    const openCamera = async () => {
        if (!cameraPermission?.granted) {
            const permission = await requestCameraPermission();

            if (!permission.granted) {
                Alert.alert(
                    "Camera Permission Required",
                    "Please allow camera access to capture the establishment photograph."
                );
                return;
            }
        }

        setCameraOpen(true);
    };

    const capturePhoto = async () => {
        try {
            if (!cameraRef.current) return;

            const result = await cameraRef.current.takePictureAsync({
                quality: 0.8,
            });

            if (!result) {
                Alert.alert("Error", "Unable to capture photograph.");
                return;
            }

            setPhoto(result);
            setCapturedAt(new Date().toISOString());
            setCameraOpen(false);

            // Capture GPS coordinates immediately after taking the photograph.
            await getCurrentLocation();
        } catch (error) {
            Alert.alert("Camera Error", "Unable to capture photograph.");
        }
    };

    const submitReport = async () => {
        if (!refNo) {
            Alert.alert("Error", "Application reference number is missing.");
            return;
        }

        if (!photo) {
            Alert.alert("Validation", "Please capture an establishment photograph.");
            return;
        }

        if (!location) {
            Alert.alert("Validation", "Please capture your GPS location.");
            return;
        }

        if (!remarks.trim()) {
            Alert.alert("Validation", "Please enter remarks.");
            return;
        }

        if (submittingRef.current) {
            return;
        }

        submittingRef.current = true;

        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                Alert.alert("Session Expired", "Please login again.");
                router.replace("/login");
                return;
            }

            const formData = new FormData();

            const now = new Date();
            const visitDate = [
                now.getFullYear(),
                String(now.getMonth() + 1).padStart(2, "0"),
                String(now.getDate()).padStart(2, "0"),
            ].join("-");

            formData.append("application_ref_no", String(refNo));
            formData.append("visit_date", visitDate);
            formData.append("remarks", remarks.trim());

            formData.append("latitude", String(location.coords.latitude));
            formData.append("longitude", String(location.coords.longitude));

            formData.append("photo_captured_at", capturedAt);

            formData.append("establishment_photo", {
                uri: photo.uri,
                name: `establishment_${Date.now()}.jpg`,
                type: "image/jpeg",
            } as any);

            const response = await API.post(
                "/inspection/visit-failure",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );
            console.log("VISIT FAILURE API RESPONSE:", response.status, response.data);
            if (response.data.status === true) {

                Alert.alert(
                    "Success",
                    "Establishment closure report submitted successfully.",
                    [
                        {
                            text: "OK",
                            onPress: () => router.replace("/applications"),
                        },
                    ]
                );
            } else {
                Alert.alert("Error", "Unable to submit the report.");
            }
        } catch (error: any) {
            console.log(
                "VISIT FAILURE API ERROR:",
                error?.response?.status,
                error?.response?.data || error.message
            );

            const message =
                error?.response?.data?.message ||
                "Failed to submit establishment closure report.";

            Alert.alert("Submission Failed", message);
        } finally {
            submittingRef.current = false;
            setLoading(false);

        }
    };

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            <AppHeader />

            <View style={styles.pageHeader}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="arrow-left" size={22} color="#1a1a4e" />
                </TouchableOpacity>

                <Text style={styles.pageTitle}>Report Establishment Closed</Text>

                <View style={{ width: 22 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.referenceCard}>
                    <Text style={styles.label}>APPLICATION REFERENCE NUMBER</Text>
                    <Text style={styles.reference}>{refNo}</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Establishment Photograph</Text>

                    {cameraOpen ? (
                        <View style={styles.cameraContainer}>
                            <CameraView
                                ref={cameraRef}
                                style={styles.camera}
                                facing="back"
                            />

                            <TouchableOpacity
                                style={styles.captureButton}
                                onPress={capturePhoto}
                            >
                                <Feather name="camera" size={26} color="#fff" />
                                <Text style={styles.captureButtonText}>Capture Photo</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelCamera}
                                onPress={() => setCameraOpen(false)}
                            >
                                <Text style={styles.cancelCameraText}>Cancel Camera</Text>
                            </TouchableOpacity>
                        </View>
                    ) : photo ? (
                        <View>
                            <Image
                                source={{ uri: photo.uri }}
                                style={styles.preview}
                            />

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                onPress={openCamera}
                            >
                                <Feather name="refresh-cw" size={17} color="#1a1a4e" />
                                <Text style={styles.secondaryButtonText}>Retake Photo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.cameraPlaceholder}
                            onPress={openCamera}
                        >
                            <Feather name="camera" size={36} color="#1a1a4e" />
                            <Text style={styles.placeholderTitle}>Capture Photograph</Text>
                            <Text style={styles.placeholderSubtitle}>
                                Take a photograph of the closed establishment
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>GPS Location</Text>

                    <View style={styles.locationCard}>
                        {location ? (
                            <>
                                <View style={styles.locationRow}>
                                    <Feather name="check-circle" size={19} color="#2e7d32" />
                                    <Text style={styles.locationSuccess}>
                                        GPS Location Captured
                                    </Text>
                                </View>

                                <Text style={styles.coordinate}>
                                    Latitude: {location.coords.latitude.toFixed(7)}
                                </Text>

                                <Text style={styles.coordinate}>
                                    Longitude: {location.coords.longitude.toFixed(7)}
                                </Text>
                            </>
                        ) : (
                            <View style={styles.locationRow}>
                                <Feather name="map-pin" size={20} color="#e65100" />
                                <Text style={styles.locationPending}>
                                    GPS location not captured
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={getCurrentLocation}
                            disabled={locationLoading}
                        >
                            {locationLoading ? (
                                <ActivityIndicator color="#1a1a4e" />
                            ) : (
                                <Feather name="crosshair" size={17} color="#1a1a4e" />
                            )}

                            <Text style={styles.secondaryButtonText}>
                                {location ? "Refresh Location" : "Capture GPS Location"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Remarks</Text>

                    <TextInput
                        style={styles.remarksInput}
                        placeholder="Enter details about the unsuccessful inspection visit..."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                        value={remarks}
                        onChangeText={setRemarks}
                    />
                </View>

                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        loading && styles.disabledButton,
                    ]}
                    onPress={submitReport}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Feather name="send" size={18} color="#fff" />
                            <Text style={styles.submitButtonText}>Submit Report</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.note}>
                    Photograph and GPS coordinates are mandatory for submitting this
                    report.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f2f5",
    },
    pageHeader: {
        backgroundColor: "#fff",
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottomWidth: 1,
        borderBottomColor: "#e8eaf6",
    },
    pageTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a4e",
    },
    content: {
        padding: 16,
        paddingBottom: 35,
    },
    referenceCard: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    label: {
        fontSize: 10,
        fontWeight: "700",
        color: "#888",
        letterSpacing: 0.7,
    },
    reference: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1a1a4e",
        marginTop: 7,
    },
    section: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1a1a4e",
        marginBottom: 12,
    },
    cameraContainer: {
        overflow: "hidden",
        borderRadius: 10,
        backgroundColor: "#000",
    },
    camera: {
        width: "100%",
        height: 300,
    },
    captureButton: {
        backgroundColor: "#1a1a4e",
        padding: 14,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
    },
    captureButtonText: {
        color: "#fff",
        fontWeight: "700",
    },
    cancelCamera: {
        padding: 10,
        alignItems: "center",
        backgroundColor: "#333",
    },
    cancelCameraText: {
        color: "#fff",
    },
    cameraPlaceholder: {
        height: 180,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#9fa8da",
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f6fa",
        padding: 15,
    },
    placeholderTitle: {
        color: "#1a1a4e",
        fontWeight: "700",
        marginTop: 10,
    },
    placeholderSubtitle: {
        color: "#888",
        fontSize: 11,
        marginTop: 5,
        textAlign: "center",
    },
    preview: {
        width: "100%",
        height: 220,
        borderRadius: 10,
        resizeMode: "cover",
    },
    secondaryButton: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: "#c5cae9",
        borderRadius: 9,
        marginTop: 10,
        backgroundColor: "#f5f6fa",
    },
    secondaryButtonText: {
        color: "#1a1a4e",
        fontWeight: "600",
        fontSize: 13,
    },
    locationCard: {
        backgroundColor: "#f5f6fa",
        borderRadius: 10,
        padding: 13,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    locationSuccess: {
        color: "#2e7d32",
        fontWeight: "700",
        fontSize: 13,
    },
    locationPending: {
        color: "#e65100",
        fontWeight: "600",
        fontSize: 13,
    },
    coordinate: {
        color: "#555",
        fontSize: 12,
        marginTop: 9,
    },
    remarksInput: {
        minHeight: 120,
        borderWidth: 1,
        borderColor: "#dfe3eb",
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        color: "#333",
        backgroundColor: "#fafbfc",
    },
    submitButton: {
        backgroundColor: "#1a1a4e",
        padding: 15,
        borderRadius: 10,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 9,
    },
    disabledButton: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    note: {
        color: "#888",
        fontSize: 11,
        textAlign: "center",
        marginTop: 12,
        lineHeight: 17,
    },
});
