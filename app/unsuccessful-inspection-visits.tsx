
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../components/AppHeader";
import { API, BASE_URL } from "../services/api";
import * as FileSystem from "expo-file-system/legacy";
interface VisitFailure {
    id: number;
    application_ref_no: string;
    visit_date: string;
    remarks: string;
    latitude: string | null;
    longitude: string | null;
    photo_captured_at: string | null;
    name_of_the_establishment: string | null;
    service_name: string | null;
    submission_location: string | null;
    inspector_name: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    total: number;
}

export default function UnsuccessfulInspectionVisitsScreen() {
    const [records, setRecords] = useState<VisitFailure[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [photoModalVisible, setPhotoModalVisible] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState("");
    const [photoToken, setPhotoToken] = useState("");

    const loadRecords = async (page = 1, refresh = false) => {
        try {
            if (refresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const token = await AsyncStorage.getItem("token");

            if (!token) {
                Alert.alert("Session Expired", "Please log in again.");
                return;
            }

            setPhotoToken(token);

            const response = await API.get(
                `/inspection/visit-failures?page=${page}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "application/json",
                    },
                }
            );

            if (response.data.status === true) {
                const result = response.data.data;

                setRecords(result.data || []);
                setPagination({
                    current_page: result.current_page,
                    last_page: result.last_page,
                    total: result.total,
                });
            } else {
                Alert.alert(
                    "Error",
                    response.data.message || "Unable to retrieve records."
                );
            }
        } catch (error: any) {
            console.log(
                "VISIT FAILURE LIST ERROR:",
                error?.response?.data || error.message
            );

            Alert.alert(
                "Error",
                error?.response?.data?.message ||
                "Failed to load unsuccessful inspection visits."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadRecords(1);
        }, [])
    );

    // const openPhoto = (id: number) => {
    //     setSelectedPhoto(
    //         `${BASE_URL}/api/inspection/visit-failures/${id}/photo`
    //     );
    //     setPhotoModalVisible(true);
    // };

    const openPhoto = async (id: number) => {
        try {
            const token = await AsyncStorage.getItem("token");

            if (!token) {
                Alert.alert("Session Expired", "Please log in again.");
                return;
            }

            const photoUrl = `${BASE_URL}/api/inspection/visit-failures/${id}/photo`;

            const localPath = `${FileSystem.cacheDirectory}inspection_photo_${id}.jpg`;

            setPhotoModalVisible(true);
            setSelectedPhoto("");

            const download = await FileSystem.downloadAsync(
                photoUrl,
                localPath,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "image/*",
                    },
                }
            );

            console.log("PHOTO DOWNLOAD STATUS:", download.status);
            console.log("LOCAL PHOTO URI:", download.uri);

            if (download.status !== 200) {
                throw new Error("Unable to download establishment photograph.");
            }

            setSelectedPhoto(download.uri);

        } catch (error: any) {
            console.log("PHOTO DOWNLOAD ERROR:", error);

            setPhotoModalVisible(false);

            Alert.alert(
                "Photo Error",
                "Unable to load establishment photograph."
            );
        }
    };

    const formatDate = (value?: string | null) => {
        if (!value) return "Not available";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const formatDateTime = (value?: string | null) => {
        if (!value) return "Not available";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderRecord = ({ item }: { item: VisitFailure }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.refBadge}>
                    <Text style={styles.refText} numberOfLines={2}>
                        {item.application_ref_no}
                    </Text>
                </View>

                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Unsuccessful</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <Text style={styles.establishment}>
                    {item.name_of_the_establishment || "Establishment not available"}
                </Text>

                <Text style={styles.serviceName}>
                    {item.service_name || "Service not available"}
                </Text>

                <View style={styles.divider} />

                <InfoRow
                    icon="user"
                    label="Inspector"
                    value={item.inspector_name}
                />

                <InfoRow
                    icon="calendar"
                    label="Visit Date"
                    value={formatDate(item.visit_date)}
                />

                <InfoRow
                    icon="map-pin"
                    label="Location"
                    value={item.submission_location || "Not available"}
                />

                <View style={styles.remarksBox}>
                    <Text style={styles.remarksLabel}>VISIT REMARKS</Text>
                    <Text style={styles.remarksText}>
                        {item.remarks || "No remarks provided"}
                    </Text>
                </View>

                {(item.latitude || item.longitude) && (
                    <View style={styles.gpsBox}>
                        <Feather name="navigation" size={15} color="#16804A" />
                        <Text style={styles.gpsText}>
                            GPS: {item.latitude || "N/A"}, {item.longitude || "N/A"}
                        </Text>
                    </View>
                )}

                <View style={styles.photoInfo}>
                    <Feather name="clock" size={14} color="#777" />
                    <Text style={styles.photoInfoText}>
                        Photo captured: {formatDateTime(item.photo_captured_at)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => openPhoto(item.id)}
                >
                    <Feather name="image" size={17} color="#fff" />
                    <Text style={styles.photoButtonText}>
                        View Establishment Photograph
                    </Text>
                    <Feather name="chevron-right" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a4e" />

            <AppHeader />

            <View style={styles.pageHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={20} color="#1a1a4e" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.pageTitle}>
                        Unsuccessful Inspection Visits
                    </Text>
                    <Text style={styles.pageSubtitle}>
                        Total Records: {pagination.total}
                    </Text>
                </View>

                <View style={styles.headerRight} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1a1a4e" />
                    <Text style={styles.loadingText}>Loading Records...</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={records}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={renderRecord}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => loadRecords(1, true)}
                                colors={["#1a1a4e"]}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Feather name="inbox" size={42} color="#ccc" />
                                <Text style={styles.emptyTitle}>No Records Found</Text>
                                <Text style={styles.emptySubtitle}>
                                    There are no unsuccessful inspection visits available.
                                </Text>
                            </View>
                        }
                    />

                    {pagination.last_page > 1 && (
                        <View style={styles.pagination}>
                            <TouchableOpacity
                                style={[
                                    styles.pageButton,
                                    pagination.current_page === 1 && styles.disabledButton,
                                ]}
                                disabled={pagination.current_page === 1}
                                onPress={() => loadRecords(pagination.current_page - 1)}
                            >
                                <Feather name="chevron-left" size={18} color="#fff" />
                            </TouchableOpacity>

                            <Text style={styles.pageText}>
                                Page {pagination.current_page} of {pagination.last_page}
                            </Text>

                            <TouchableOpacity
                                style={[
                                    styles.pageButton,
                                    pagination.current_page === pagination.last_page &&
                                    styles.disabledButton,
                                ]}
                                disabled={
                                    pagination.current_page === pagination.last_page
                                }
                                onPress={() => loadRecords(pagination.current_page + 1)}
                            >
                                <Feather name="chevron-right" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}

            <View style={styles.bottomSpacer} />

            <Modal
                visible={photoModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setPhotoModalVisible(false)}
            >
                <View style={styles.modalBackground}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setPhotoModalVisible(false)}
                    >
                        <Feather name="x" size={25} color="#fff" />
                    </TouchableOpacity>

                    {selectedPhoto ? (
                        <Image
                            source={{ uri: selectedPhoto }}
                            style={styles.fullPhoto}
                            resizeMode="contain"
                        />
                    ) : (
                        <ActivityIndicator size="large" color="#ffffff" />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function InfoRow({
    icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value?: string | null;
}) {
    return (
        <View style={styles.infoRow}>
            <Feather name={icon} size={14} color="#777" />
            <Text style={styles.infoLabel}>{label}:</Text>
            <Text style={styles.infoValue}>{value || "Not available"}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f2f5",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        color: "#666",
        fontSize: 14,
    },
    pageHeader: {
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e8eaf6",
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#f0f2f5",
        justifyContent: "center",
        alignItems: "center",
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 8,
    },
    pageTitle: {
        color: "#1a1a4e",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },
    pageSubtitle: {
        color: "#888",
        fontSize: 12,
        marginTop: 3,
    },
    headerRight: {
        width: 36,
    },
    listContent: {
        padding: 16,
        paddingBottom: 12,
        flexGrow: 1,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        marginBottom: 14,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 14,
        paddingBottom: 10,
    },
    refBadge: {
        flex: 1,
        backgroundColor: "#f0f2f5",
        borderRadius: 6,
        padding: 8,
        marginRight: 8,
    },
    refText: {
        fontSize: 11,
        color: "#1a1a4e",
        fontWeight: "700",
    },
    statusBadge: {
        backgroundColor: "#fff1f0",
        borderRadius: 12,
        paddingHorizontal: 9,
        paddingVertical: 5,
    },
    statusText: {
        color: "#d93025",
        fontSize: 10,
        fontWeight: "700",
    },
    cardBody: {
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    establishment: {
        color: "#1a1a4e",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 5,
    },
    serviceName: {
        color: "#777",
        fontSize: 12,
        lineHeight: 18,
    },
    divider: {
        height: 1,
        backgroundColor: "#e8eaf6",
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 9,
        gap: 7,
    },
    infoLabel: {
        width: 75,
        fontSize: 12,
        color: "#777",
        fontWeight: "600",
    },
    infoValue: {
        flex: 1,
        fontSize: 12,
        color: "#333",
    },
    remarksBox: {
        backgroundColor: "#fff8ed",
        borderRadius: 8,
        padding: 11,
        marginTop: 5,
    },
    remarksLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: "#a65c00",
        marginBottom: 5,
    },
    remarksText: {
        color: "#444",
        fontSize: 13,
        lineHeight: 19,
    },
    gpsBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginTop: 12,
    },
    gpsText: {
        fontSize: 11,
        color: "#16804A",
    },
    photoInfo: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginTop: 10,
    },
    photoInfoText: {
        fontSize: 11,
        color: "#777",
    },
    photoButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#1a1a4e",
        padding: 12,
        borderRadius: 9,
        marginTop: 14,
    },
    photoButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "700",
        flex: 1,
        textAlign: "center",
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
    },
    emptyTitle: {
        color: "#999",
        fontSize: 16,
        fontWeight: "700",
        marginTop: 12,
    },
    emptySubtitle: {
        color: "#aaa",
        fontSize: 12,
        textAlign: "center",
        marginTop: 5,
    },
    pagination: {
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e8eaf6",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
        padding: 10,
    },
    pageButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#1a1a4e",
        alignItems: "center",
        justifyContent: "center",
    },
    disabledButton: {
        backgroundColor: "#c5cae9",
    },
    pageText: {
        color: "#1a1a4e",
        fontSize: 12,
        fontWeight: "700",
    },
    bottomSpacer: {
        height: 32,
        backgroundColor: "#f0f2f5",
    },
    modalBackground: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.95)",
        justifyContent: "center",
        alignItems: "center",
    },
    closeButton: {
        position: "absolute",
        top: 45,
        right: 20,
        zIndex: 2,
        padding: 10,
    },
    fullPhoto: {
        width: "100%",
        height: "85%",
    },
});
