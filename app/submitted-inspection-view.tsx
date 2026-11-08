
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, router } from "expo-router";
import React, { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import AppHeader from "../components/AppHeader";
import PreviewForm from "@/components/inspection/PreviewForm";
import { API } from "../services/api";

type InspectionData = {
    ase: any;
    contract: any;
    minimumwage: any;
};

export default function SubmittedInspectionViewScreen() {
    const { refNo, establishmentName } = useLocalSearchParams<{
        refNo: string;
        establishmentName?: string;
    }>();

    const [loading, setLoading] = useState(true);
    const [common, setCommon] = useState<any>(null);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [application, setApplication] = useState<any>(null);

    const [inspectionData, setInspectionData] = useState<InspectionData>({
        ase: null,
        contract: null,
        minimumwage: null,
    });

    useEffect(() => {
        if (refNo) {
            loadInspectionDetails();
        }
    }, [refNo]);

    const loadInspectionDetails = async () => {
        try {
            setLoading(true);

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                Alert.alert(
                    "Session Expired",
                    "Please log in again."
                );
                router.replace("/login");
                return;
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
            };

            // Fetch all three inspection types.
            // A type that was not selected may return 404.
            const types = ["ASE", "CONTRACT", "MINIMUMWAGE"];

            const responses = await Promise.allSettled(
                types.map((type) =>
                    API.get("/view", {
                        params: {
                            reference_number: refNo,
                            inspection_type: type,
                        },
                        headers,
                    })
                )
            );

            let commonData: any = null;

            const mappedData: InspectionData = {
                ase: null,
                contract: null,
                minimumwage: null,
            };


            responses.forEach((result, index) => {
                console.log("INSPECTION TYPE REQUEST:", types[index]);

                if (result.status === "rejected") {
                    console.log(
                        `${types[index]} API ERROR:`,
                        result.reason?.response?.status,
                        result.reason?.response?.data || result.reason?.message
                    );
                    return;
                }

                const responseData = result.value.data?.data;

                console.log(
                    `${types[index]} API RESPONSE:`,
                    JSON.stringify(responseData, null, 2)
                );

                if (!responseData) return;

                if (!commonData && responseData.common_data) {
                    commonData = responseData.common_data;
                }

                const inspection = responseData.inspections?.find(
                    (item: any) =>
                        item.inspection_type?.toUpperCase() === types[index]
                );

                console.log(
                    `${types[index]} INSPECTION DATA:`,
                    inspection?.inspection_data
                );

                if (inspection?.inspection_data) {
                    const key = types[index].toLowerCase() as keyof InspectionData;
                    mappedData[key] = inspection.inspection_data;
                }
            });


            if (!commonData) {
                throw new Error(
                    "No submitted inspection details were found for this application."
                );
            }

            // Extract selected inspection types from common data.
            const selected =
                commonData.selected_types || [];

            setCommon(commonData);
            setSelectedTypes(selected);
            setInspectionData(mappedData);
            console.log("FINAL SELECTED TYPES:", selected);
            console.log("FINAL MAPPED INSPECTION DATA:", mappedData);
            setApplication({
                appl_ref_no: refNo,
                name_of_the_establishment: establishmentName || "",
            });

            console.log(
                "SUBMITTED INSPECTION DETAILS:",
                JSON.stringify({
                    commonData,
                    selected,
                    mappedData,
                }, null, 2)
            );

        } catch (error: any) {
            console.log(
                "SUBMITTED INSPECTION VIEW ERROR:",
                error?.response?.data || error.message
            );

            Alert.alert(
                "Error",
                error.message ||
                "Unable to load submitted inspection details."
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centerContainer}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="#FFFFFF"
                />

                <ActivityIndicator
                    size="large"
                    color="#15803D"
                />

                <Text style={styles.loadingText}>
                    Loading inspection details...
                </Text>
            </SafeAreaView>
        );
    }

    if (!common) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar
                    barStyle="dark-content"
                    backgroundColor="#FFFFFF"
                />

                <AppHeader />

                <View style={styles.centerContainer}>
                    <Feather
                        name="alert-circle"
                        size={45}
                        color="#DC2626"
                    />

                    <Text style={styles.errorTitle}>
                        Inspection Details Not Available
                    </Text>

                    <Text style={styles.errorText}>
                        Unable to retrieve the submitted inspection details.
                    </Text>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>
                            Go Back
                        </Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#FFFFFF"
            />

            <AppHeader />

            <View style={styles.container}>
                <View style={styles.headingContainer}>
                    <TouchableOpacity
                        style={styles.backLink}
                        onPress={() => router.back()}
                    >
                        <Feather
                            name="arrow-left"
                            size={18}
                            color="#1A1A4E"
                        />

                        <Text style={styles.backLinkText}>
                            Back to Submitted Inspections
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.heading}>
                        Submitted Inspection Details
                    </Text>

                    <Text style={styles.establishmentName}>
                        {common.common_data?.name_of_the_establishment ||
                            establishmentName ||
                            "Establishment"}
                    </Text>

                    <Text style={styles.referenceNumber}>
                        Reference No: {refNo}
                    </Text>

                    <View style={styles.statusBadge}>
                        <Feather
                            name="check-circle"
                            size={15}
                            color="#15803D"
                        />

                        <Text style={styles.statusText}>
                            Successfully Submitted
                        </Text>
                    </View>
                </View>

                <PreviewForm
                    application={application}
                    common={common}
                    inspectionASE={inspectionData.ase}
                    inspectionContract={inspectionData.contract}
                    inspectionMW={inspectionData.minimumwage}
                    selectedTypes={selectedTypes}
                    onEdit={() => { }}
                    onSubmit={() => { }}
                    loading={false}
                    readOnly={true}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
    },

    headingContainer: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 15,
        backgroundColor: "#FFFFFF",
    },

    backLink: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },

    backLinkText: {
        color: "#1A1A4E",
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 7,
    },

    heading: {
        fontSize: 19,
        fontWeight: "700",
        color: "#1A1A4E",
    },

    establishmentName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginTop: 7,
    },

    referenceNumber: {
        fontSize: 12,
        color: "#6B7280",
        marginTop: 5,
    },

    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        backgroundColor: "#DCFCE7",
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 20,
        marginTop: 10,
    },

    statusText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#15803D",
        marginLeft: 5,
    },

    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F5F7FA",
        padding: 20,
    },

    loadingText: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 12,
    },

    errorTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#374151",
        marginTop: 15,
    },

    errorText: {
        fontSize: 13,
        color: "#6B7280",
        textAlign: "center",
        marginTop: 7,
    },

    backButton: {
        backgroundColor: "#1A1A4E",
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderRadius: 7,
        marginTop: 20,
    },

    backButtonText: {
        color: "#FFFFFF",
        fontWeight: "600",
        fontSize: 13,
    },
});
