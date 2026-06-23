import { useState } from "react";
import {
  Image,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function CommonForm({
  common,
  user,
}: {
  application: any;
  common: any;
  user: any;
}) {
  const commonData = common?.common_data || {};
  console.log(common);

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

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Common Inspection Details</Text>

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

      {/* ESTABLISHMENT DETAILS */}

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

      {/* INSPECTION TYPES */}

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

      {/* IMAGE PLACEHOLDERS */}

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

      <TouchableOpacity style={styles.saveButton}>
        <Text style={styles.saveText}>Save Common Details</Text>
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

  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
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
  },

  saveText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  signatureImage: {
    width: "100%",
    height: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
  },
});
