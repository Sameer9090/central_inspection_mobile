
import React from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

interface ScrollNavigationProps {
    scrollY: number;
    contentHeight: number;
    scrollViewHeight: number;
    onScrollToTop: () => void;
    onScrollToBottom: () => void;
}

export default function ScrollNavigation({
    scrollY,
    contentHeight,
    scrollViewHeight,
    onScrollToTop,
    onScrollToBottom,
}: ScrollNavigationProps) {

    // console.log("SCROLL NAVIGATION:", {
    //     scrollY,
    //     contentHeight,
    //     scrollViewHeight,
    //     canScroll: contentHeight > scrollViewHeight + 50,
    // });

    const canScroll = contentHeight > scrollViewHeight + 50;

    const showUp = scrollY > 50;

    const showDown =
        scrollY + scrollViewHeight < contentHeight - 50;

    if (!canScroll || (!showUp && !showDown)) {
        return null;
    }

    return (
        <View
            pointerEvents="box-none"
            style={styles.container}
        >
            {showUp && (
                <Pressable
                    style={styles.button}
                    onPress={onScrollToTop}
                >
                    <Text style={styles.arrow}>↑</Text>
                </Pressable>
            )}

            {showDown && (
                <Pressable
                    style={styles.button}
                    onPress={onScrollToBottom}
                >
                    <Text style={styles.arrow}>↓</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        right: 16,
        bottom: 25,
        alignItems: "center",
        gap: 10,
        zIndex: 999,
    },
    button: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#1a1a4e",
        justifyContent: "center",
        alignItems: "center",
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    arrow: {
        color: "#ffffff",
        fontSize: 25,
        fontWeight: "bold",
        textAlign: "center",
        lineHeight: 30,
    },
});
