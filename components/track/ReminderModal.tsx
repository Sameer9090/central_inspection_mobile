import React, { useState } from "react";
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from "react-native";

import { sendReminder } from "../../services/reminderService";

interface Props {
    visible: boolean;
    onClose: () => void;
    receiverId: number;
    applRefNo: string;
}

export default function ReminderModal({
    visible,
    onClose,
    receiverId,
    applRefNo,
}: Props) {

    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {

        if (!remarks.trim()) {
            Alert.alert("Validation", "Remarks are required.");
            return;
        }

        console.log("========== SEND CLICKED ==========");
        console.log("receiverId:", receiverId);
        console.log("applRefNo:", applRefNo);
        console.log("remarks:", remarks);

        try {

            setLoading(true);

            console.log("Calling API...");

            const response = await sendReminder(
                receiverId,
                applRefNo,
                remarks
            );

            console.log("API Response:", response);

            Alert.alert("Success", response.message);

            setRemarks("");

            onClose();

        } catch (error: any) {

            console.log("Reminder Error:", error);

            console.log("Response:", error?.response);

            console.log("Data:", error?.response?.data);

            Alert.alert(
                "Error",
                error?.response?.data?.message ||
                "Failed to send reminder."
            );

        } finally {

            setLoading(false);

        }

    };

    return (

        <Modal
            visible={visible}
            transparent
            animationType="slide"
        >

            <View style={styles.overlay}>

                <View style={styles.modal}>

                    <Text style={styles.title}>
                        Send Reminder
                    </Text>

                    <Text style={styles.ref}>
                        {applRefNo}
                    </Text>

                    <TextInput
                        placeholder="Enter remarks..."
                        multiline
                        value={remarks}
                        onChangeText={setRemarks}
                        style={styles.input}
                    />

                    <View style={styles.buttons}>

                        <TouchableOpacity
                            style={styles.cancel}
                            onPress={onClose}
                        >
                            <Text>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.send}
                            onPress={submit}
                            disabled={loading}
                        >
                            <Text style={{ color: "#fff" }}>
                                {loading ? "Sending..." : "Send"}
                            </Text>
                        </TouchableOpacity>

                    </View>

                </View>

            </View>

        </Modal>

    );

}

const styles = StyleSheet.create({

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,.4)",
        justifyContent: "center",
        padding: 20,
    },

    modal: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
    },

    title: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 5,
    },

    ref: {
        color: "#64748B",
        marginBottom: 15,
    },

    input: {
        borderWidth: 1,
        borderColor: "#CBD5E1",
        borderRadius: 10,
        minHeight: 120,
        textAlignVertical: "top",
        padding: 12,
    },

    buttons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
    },

    cancel: {
        paddingHorizontal: 20,
        paddingVertical: 10,
    },

    send: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    }

});