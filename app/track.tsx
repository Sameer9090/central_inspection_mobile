import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../components/AppHeader";
import ReminderModal from "../components/track/ReminderModal";
import TrackCard from "../components/track/TrackCard";
import { API } from "../services/api";
import { getTrackApplications } from "../services/trackService";

type TrackApplication = {
    id: number;
    applRefNo: string;
    receiverId: number;
    submissionLocation: string;
    officerName: string;
    officerRole: string;
    status: string;
    heldFor: string;
};

const LOCATION_FILTER_ROLE_IDS = [2, 3, 4, 5]; // LC, AddLC/ADLC, DLC, ALC

export default function TrackScreen() {
    const [applications, setApplications] = useState<TrackApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [refreshing, setRefreshing] = useState(false);

    const [roleId, setRoleId] = useState<number | null>(null);
    const [roleLoading, setRoleLoading] = useState(true);

    const [selectedLocation, setSelectedLocation] = useState("");
    const [locations, setLocations] = useState<string[]>([]);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");

    const [showReminder, setShowReminder] = useState(false);
    const [selectedApplication, setSelectedApplication] =
        useState<TrackApplication | null>(null);

    const requestSequenceRef = useRef(0);

    const canFilterByLocation =
        roleId !== null && LOCATION_FILTER_ROLE_IDS.includes(roleId);

    const filteredLocations = useMemo(
        () => [
            "All Submission Locations",
            ...locations.filter((location) =>
                location.toLowerCase().includes(locationSearch.toLowerCase())
            ),
        ],
        [locations, locationSearch]
    );

    // Read the authenticated user's role from the same dashboard endpoint
    // used by the Dashboard screen. Do not rely on a client-side role value
    // for authorization; the Laravel API remains authoritative.
    useEffect(() => {
        let active = true;

        const loadRole = async () => {
            try {
                const token = await AsyncStorage.getItem("token");

                if (!token) {
                    router.replace("/login");
                    return;
                }

                const response = await API.get("/dashboard", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const id = Number(response?.data?.data?.user?.role_id);

                if (active && Number.isFinite(id)) {
                    setRoleId(id);
                }
            } catch (error: any) {
                console.log(
                    "Unable to load user role:",
                    error?.response?.data || error
                );

                if (active) {
                    Alert.alert(
                        "Error",
                        error?.response?.data?.message ||
                            "Unable to identify your user role."
                    );
                }
            } finally {
                if (active) {
                    setRoleLoading(false);
                }
            }
        };

        loadRole();

        return () => {
            active = false;
        };
    }, []);

    const loadApplications = useCallback(async (pageNumber = 1) => {
        const requestId = ++requestSequenceRef.current;
        setLoading(true);

        try {
            const response = await getTrackApplications(
                pageNumber,
                search.trim(),
                canFilterByLocation ? selectedLocation : ""
            );

            if (requestId !== requestSequenceRef.current) return;

            const paginator = response?.applications;
            const pageData: TrackApplication[] = paginator?.data ?? [];

            setApplications(pageData);
            setPage(Number(paginator?.current_page ?? pageNumber));
            setLastPage(Math.max(1, Number(paginator?.last_page ?? 1)));
            setTotal(Number(paginator?.total ?? pageData.length));
            setPerPage(Number(paginator?.per_page ?? 10));
            setLocations(Array.isArray(response?.locations) ? response.locations : []);
        } catch (error: any) {
            if (requestId === requestSequenceRef.current) {
                console.log("Track Applications error:", error?.response?.data || error);
                Alert.alert(
                    "Error",
                    error?.response?.data?.message || "Unable to load applications."
                );
            }
        } finally {
            if (requestId === requestSequenceRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [search, selectedLocation, canFilterByLocation]);

    // Wait until the role is known before making the first request.
    // Search/location changes reset the paginator to page one.
    useEffect(() => {
        if (roleLoading || roleId === null) return;

        const delay = setTimeout(() => {
            loadApplications(1);
        }, 400);

        return () => clearTimeout(delay);
    }, [roleLoading, roleId, search, selectedLocation, loadApplications]);

    const changePage = (nextPage: number) => {
        if (nextPage < 1 || nextPage > lastPage || nextPage === page || loading) return;
        loadApplications(nextPage);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadApplications(page);
    };

    const pageNumbers = useMemo(() => {
        const start = Math.max(1, Math.min(page - 2, lastPage - 4));
        const end = Math.min(lastPage, start + 4);
        return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
    }, [page, lastPage]);

    const firstRecord = total === 0 ? 0 : (page - 1) * perPage + 1;
    const lastRecord = Math.min(page * perPage, total);

    if (roleLoading || (loading && applications.length === 0)) {
        return (
            <>
                <AppHeader />
                <SafeAreaView style={styles.loader}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading applications...</Text>
                </SafeAreaView>
            </>
        );
    }

    return (
        <>
            <AppHeader />
            <SafeAreaView style={styles.container}>
                <FlatList
                    data={applications}
                    keyExtractor={(item) => `${item.id}-${item.applRefNo}`}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    ListHeaderComponent={
                        <>
                            <View style={styles.header}>
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    style={styles.backButton}
                                >
                                    <ArrowLeft size={22} color="#2563EB" />
                                </TouchableOpacity>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.title}>Track Applications</Text>
                                    <Text style={styles.subtitle}>
                                        Track and monitor application progress
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.label}>Search</Text>
                            <TextInput
                                placeholder="Reference No / Officer Name"
                                style={styles.input}
                                value={search}
                                onChangeText={setSearch}
                                returnKeyType="search"
                                autoCapitalize="none"
                            />

                            {canFilterByLocation && (
                                <>
                                    <Text style={styles.label}>Submission Location</Text>
                                    <TouchableOpacity
                                        style={styles.dropdown}
                                        onPress={() => setShowLocationDropdown(true)}
                                    >
                                        <Text
                                            style={{
                                                color: selectedLocation ? "#111827" : "#94A3B8",
                                                fontWeight: selectedLocation ? "600" : "400",
                                            }}
                                        >
                                            {selectedLocation || "All Submission Locations"}
                                        </Text>
                                    </TouchableOpacity>

                                    <Modal
                                        visible={showLocationDropdown}
                                        animationType="slide"
                                        transparent
                                        onRequestClose={() => setShowLocationDropdown(false)}
                                    >
                                        <Pressable
                                            style={styles.modalOverlay}
                                            onPress={() => setShowLocationDropdown(false)}
                                        >
                                            <Pressable style={styles.modalContent}>
                                                <Text style={styles.modalTitle}>
                                                    Select Submission Location
                                                </Text>
                                                <TextInput
                                                    placeholder="Search location..."
                                                    value={locationSearch}
                                                    onChangeText={setLocationSearch}
                                                    style={styles.locationSearch}
                                                />
                                                <FlatList
                                                    data={filteredLocations}
                                                    keyExtractor={(item) => item}
                                                    keyboardShouldPersistTaps="handled"
                                                    renderItem={({ item }) => (
                                                        <TouchableOpacity
                                                            style={styles.dropdownItem}
                                                            onPress={() => {
                                                                setSelectedLocation(
                                                                    item === "All Submission Locations" ? "" : item
                                                                );
                                                                setLocationSearch("");
                                                                setShowLocationDropdown(false);
                                                            }}
                                                        >
                                                            <Text style={styles.dropdownItemText}>{item}</Text>
                                                        </TouchableOpacity>
                                                    )}
                                                />
                                            </Pressable>
                                        </Pressable>
                                    </Modal>
                                </>
                            )}
                        </>
                    }
                    renderItem={({ item }) => (
                        <TrackCard
                            applRefNo={item.applRefNo}
                            submissionLocation={item.submissionLocation}
                            officerName={item.officerName}
                            officerRole={item.officerRole}
                            status={item.status}
                            heldFor={item.heldFor}
                            onHistory={() =>
                                router.push({
                                    pathname: "/track-history",
                                    params: { applRefNo: item.applRefNo },
                                })
                            }
                            onReminder={() => {
                                setSelectedApplication(item);
                                setShowReminder(true);
                            }}
                        />
                    )}
                    ListEmptyComponent={
                        !loading ? (
                            <Text style={styles.emptyText}>No applications found.</Text>
                        ) : null
                    }

                />

                {/* Pagination footer - styled to match the Applications page */}
                {lastPage > 1 && (
                    <View style={styles.paginationWrapper}>
                        <View style={styles.paginationContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.pageButton,
                                    page === 1 && styles.pageButtonDisabled,
                                ]}
                                onPress={() => changePage(page - 1)}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft size={16} color="#FFFFFF" />
                            </TouchableOpacity>

                            <View style={styles.pageNumbers}>
                                {Array.from({ length: lastPage }, (_, index) => index + 1)
                                    .filter(
                                        (number) =>
                                            number === 1 ||
                                            number === lastPage ||
                                            (number >= page - 1 && number <= page + 1),
                                    )
                                    .map((number, index, visiblePages) => (
                                        <React.Fragment key={number}>
                                            {index > 0 && visiblePages[index - 1] !== number - 1 && (
                                                <Text style={styles.pageEllipsis}>...</Text>
                                            )}
                                            <TouchableOpacity
                                                style={[
                                                    styles.pageNumberButton,
                                                    page === number && styles.pageNumberButtonActive,
                                                ]}
                                                onPress={() => changePage(number)}
                                                disabled={loading || page === number}
                                            >
                                                <Text
                                                    style={[
                                                        styles.pageNumberText,
                                                        page === number && styles.pageNumberTextActive,
                                                    ]}
                                                >
                                                    {number}
                                                </Text>
                                            </TouchableOpacity>
                                        </React.Fragment>
                                    ))}
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.pageButton,
                                    page === lastPage && styles.pageButtonDisabled,
                                ]}
                                onPress={() => changePage(page + 1)}
                                disabled={page === lastPage || loading}
                            >
                                <ChevronRight size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        {loading && (
                            <ActivityIndicator
                                size="small"
                                color="#1a1a4e"
                                style={{ position: "absolute", right: 12 }}
                            />
                        )}
                    </View>
                )}

                <ReminderModal
                    visible={showReminder}
                    onClose={() => setShowReminder(false)}
                    receiverId={selectedApplication?.receiverId}
                    applRefNo={selectedApplication?.applRefNo}
                />
            </SafeAreaView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6",
    },
    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
    },
    loadingText: {
        marginTop: 10,
        color: "#64748B",
    },
    content: {
        padding: 16,
        // Keep the last card clear of the fixed pagination dock.
        paddingBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1E293B",
    },
    subtitle: {
        color: "#64748B",
        marginTop: 5,
        marginBottom: 25,
    },
    label: {
        fontSize: 13,
        color: "#475569",
        marginBottom: 6,
        fontWeight: "600",
    },
    input: {
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 15,
        paddingVertical: 12,
        marginBottom: 16,
    },
    dropdown: {
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 15,
        paddingVertical: 14,
        marginBottom: 20,
    },
    emptyText: {
        textAlign: "center",
        marginTop: 40,
        color: "#64748B",
        fontSize: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    locationSearch: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 15,
        fontSize: 15,
    },
    dropdownItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    dropdownItemText: {
        fontSize: 16,
        color: "#111827",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 20,
        maxHeight: "75%",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 15,
        color: "#1E293B",
    },
    // Pagination styles intentionally match app/applications.tsx
    paginationWrapper: {
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e8eaf6",
    },
    paginationContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 6,
    },
    pageButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#1a1a4e",
        justifyContent: "center",
        alignItems: "center",
    },
    pageButtonDisabled: {
        backgroundColor: "#c5cae9",
    },
    pageNumbers: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    pageNumberButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f0f2f5",
        justifyContent: "center",
        alignItems: "center",
    },
    pageNumberButtonActive: {
        backgroundColor: "#1a1a4e",
    },
    pageNumberText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#666",
    },
    pageNumberTextActive: {
        color: "#fff",
    },
    pageEllipsis: {
        fontSize: 12,
        fontWeight: "700",
        color: "#999",
        paddingHorizontal: 2,
    },
});
