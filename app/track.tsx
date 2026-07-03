import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import AppHeader from "../components/AppHeader";
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
    View,
    Modal,
    ScrollView,
    Pressable,
} from "react-native";

import TrackCard from "../components/track/TrackCard";
import { getTrackApplications } from "../services/trackService";
import ReminderModal from "../components/track/ReminderModal";

export default function TrackScreen() {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("");
    const [locations, setLocations] = useState<string[]>([]);
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [locationSearch, setLocationSearch] = useState("");
    const [showReminder, setShowReminder] = useState(false);

    const [selectedApplication, setSelectedApplication] = useState<any>(null);

    const filteredLocations = [
        "All Submission Locations",
        ...locations.filter(location =>
            location.toLowerCase().includes(locationSearch.toLowerCase())
        ),
    ];

    const loadApplications = async (
        pageNumber = 1,
        reset = true
    ) => {

        if (loadingMore) return;

        if (pageNumber > 1) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {

            const response = await getTrackApplications(
                pageNumber,
                search,
                selectedLocation
            );
            console.log("Applications count:", response.applications.data.length);
            console.log(response.applications.data);

            setLastPage(response.applications.last_page);
            setLocations(response.locations);

            if (reset) {

                setApplications(response.applications.data);

            } else {

                setApplications(prev => [
                    ...prev,
                    ...response.applications.data
                ]);

            }

            setPage(pageNumber);

        } catch (error: any) {

            console.log(error);

            Alert.alert(
                "Error",
                error?.response?.data?.message || "Unable to load applications."
            );

        } finally {

            setLoading(false);
            setLoadingMore(false);

        }

    };
    useEffect(() => {
        const delay = setTimeout(() => {
            loadApplications(1, true);
        }, 500);

        return () => clearTimeout(delay);
    }, [search]);

    useEffect(() => {
        loadApplications(1, true);
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.loader}>
                <ActivityIndicator size="large" color="#2563EB" />
            </SafeAreaView>
        );
    }

    return (
        <>
        <AppHeader />
        <SafeAreaView style={styles.container}>

            <FlatList
                data={applications}
                keyExtractor={(item, index) =>
                    `${item.appl_ref_no}-${index}`
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
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
                        />



                        <Text style={styles.label}>Submission Location</Text>

                        <TouchableOpacity
                            style={styles.dropdown}
                            onPress={() =>
                                setShowLocationDropdown(!showLocationDropdown)
                            }
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
                        {
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

                                                        const value =
                                                            item === "All Submission Locations"
                                                                ? ""
                                                                : item;

                                                        setSelectedLocation(value);

                                                        setShowLocationDropdown(false);

                                                        loadApplications(1, true);
                                                    }}
                                                >
                                                    <Text
                                                        style={{
                                                            fontSize: 16,
                                                            color: "#111827"
                                                        }}
                                                    >
                                                        {item}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </Pressable>
                                </Pressable>
                            </Modal>
                        }

                    </>
                }
                refreshing={refreshing}

                onRefresh={async () => {
                    setRefreshing(true);

                    await loadApplications(1, true);

                    setRefreshing(false);
                }}
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
                                params: {
                                    applRefNo: item.applRefNo,
                                },
                            })
                        }
                        onReminder={() => {

                            setSelectedApplication(item);

                            setShowReminder(true);

                        }}
                    />
                )}
                onEndReached={() => {

                    if (page < lastPage) {

                        loadApplications(page + 1, false);

                    }

                }}

                onEndReachedThreshold={0.3}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        No applications found.
                    </Text>
                }
                ListFooterComponent={
                    loadingMore ? (
                        <ActivityIndicator
                            size="small"
                            color="#2563EB"
                            style={{ marginVertical: 20 }}
                        />
                    ) : null
                }
            />
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
    },

    content: {
        padding: 16,
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

    dropdownText: {
        color: "#64748B",
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

    backText: {
        color: "#fff",
        fontWeight: "600",
    },
    locationSearch: {
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
    },

    dropdownContainer: {
        position: "absolute",
        top: 300,
        left: 16,
        right: 16,

        backgroundColor: "#fff",

        borderRadius: 12,

        elevation: 8,

        zIndex: 999,

        maxHeight: 320,
    },

    dropdownItem: {
        padding: 15,
    },

    dropdownItemSelected: {
        backgroundColor: "#EFF6FF",
    },

    dropdownItemText: {
        fontSize: 15,
        color: "#1E293B",
    },

    dropdownItemTextSelected: {
        color: "#2563EB",
        fontWeight: "700",
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
    },

    locationSearch: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 15,
    },

    dropdownItem: {
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
});