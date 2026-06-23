import React, { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function ASEForm({
  inspectionASE,
  user,
}: {
  inspectionASE: any;
  user: any;
}) {
  const [cleanlinessWorkplace, setCleanlinessWorkplace] = useState(false);
  const [adequateLighting, setAdequateLighting] = useState(false);
  const [properVentilation, setProperVentilation] = useState(false);
  const [firePreventionMeasures, setFirePreventionMeasures] = useState(false);
  const [accidentPrevention, setAccidentPrevention] = useState(false);
  const [drinkingWater, setDrinkingWater] = useState(false);
  const [latrineUrinal, setLatrineUrinal] = useState(false);
  const [firstAid, setFirstAid] = useState(false);
  const [crecheFacility, setCrecheFacility] = useState(false);
  const [canteen, setCanteen] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ASE Inspection</Text>

      <Text style={styles.sectionTitle}>
        Workplace Safety and Health Measures
      </Text>

      <View style={styles.row}>
        <Text style={styles.label}>
          Ensuring proper cleanliness in workplace
        </Text>
        <Switch
          value={cleanlinessWorkplace}
          onValueChange={setCleanlinessWorkplace}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>
          Providing adequate lighting in all work areas
        </Text>
        <Switch value={adequateLighting} onValueChange={setAdequateLighting} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Maintaining proper ventilation</Text>
        <Switch
          value={properVentilation}
          onValueChange={setProperVentilation}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fire prevention measures</Text>
        <Switch
          value={firePreventionMeasures}
          onValueChange={setFirePreventionMeasures}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Accident prevention measures</Text>
        <Switch
          value={accidentPrevention}
          onValueChange={setAccidentPrevention}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Drinking Water (Section 18)</Text>
        <Switch value={drinkingWater} onValueChange={setDrinkingWater} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Latrine & Urinal (Section 19)</Text>
        <Switch value={latrineUrinal} onValueChange={setLatrineUrinal} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>First Aid (Section 19)</Text>
        <Switch value={firstAid} onValueChange={setFirstAid} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Creche Facility (Section 20)</Text>
        <Switch value={crecheFacility} onValueChange={setCrecheFacility} />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Canteen (Section 22)</Text>
        <Switch value={canteen} onValueChange={setCanteen} />
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Save & Continue</Text>
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
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  label: {
    flex: 1,
    marginRight: 10,
  },

  button: {
    backgroundColor: "#1976D2",
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
