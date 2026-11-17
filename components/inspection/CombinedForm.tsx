import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";

type Props = {
  inspectionCombined?: Record<string, any>;
  user?: any;
  onSave?: (data: any) => void;
  onBack?: () => void;
  currentStep?: string;
  sectionsStatus?: Record<string, boolean>;
  referenceNumber?: string;
  eodbCommon?: any;
  eodbAse?: any;
  common?: any;
  inspectionRecord?: any;
};

const CHECKLIST = [
  {
    title: "A. Records and Registers", items: [
      ["appointment_letters_issued", "Appointment letters issued to workers"],
      ["attendance_register_maintained", "Muster roll / attendance register maintained"],
      ["wage_overtime_register_maintained", "Wage register and overtime records maintained"],
      ["leave_weeklyoff_records_maintained", "Leave and weekly-off records maintained"],
      ["accident_register_maintained", "Accident and dangerous occurrence register maintained"],
      ["medical_records_maintained", "Medical examination records maintained"],
      ["contractor_records_maintained", "Records of contractors and contract workers maintained"],
      ["fines_deductions_register_maintained", "Register of fines and deductions for damage and loss maintained"],
    ]
  },
  {
    title: "B. Safety and Health", items: [
      ["fire_extinguishers_available", "Fire extinguishers available, within validity date and accessible"],
      ["fire_exits_alarm_working", "Fire exits unobstructed and marked; alarm system working"],
      ["mock_drills_conducted", "Mock drills conducted and recorded"],
      ["machinery_guards_in_place", "Machinery adequately guarded; safety guards in place"],
      ["lifting_machines_tested", "Lifting machines / pressure vessels tested and certified"],
      ["electrical_installations_safe", "Electrical installations safe; earthing and cabling in order"],
      ["ventilation_lighting_adequate", "Adequate ventilation, lighting and temperature control"],
      ["hazardous_process_controls", "Hazardous process controls in place; safety data available"],
      ["ppe_provided_and_used", "PPE provided, in good condition and used"],
      ["safety_committee_constituted", "Safety committee constituted (if required)"],
      ["safety_officer_appointed", "Safety officer appointed (if required)"],
      ["emergency_plan_displayed", "Emergency plan displayed and workers aware"],
      ["first_aid_facility_available", "First-aid box stocked; trained first-aider available"],
    ]
  },
  {
    title: "C. Welfare Facilities", items: [
      ["safe_drinking_water_available", "Safe drinking water facilities available"],
      ["toilet_facilities_available", "Sufficient, clean toilets available, with separate facilities for women"],
      ["washing_bathing_facilities", "Washing and bathing facilities available"],
      ["canteen_available", "Canteen available (if applicable)"],
      ["creche_available", "Creche available (if applicable)"],
      ["rest_room_available", "Rest room / shelter available"],
      ["migrant_accommodation_adequate", "Accommodation for migrant workers adequate (if applicable)"],
    ]
  },
  {
    title: "D. Working Conditions", items: [
      ["working_hours_within_limits", "Daily and weekly working hours within prescribed limits"],
      ["rest_intervals_observed", "Rest intervals and spread-over observed"],
      ["overtime_within_limits", "Overtime within prescribed limits and paid at prescribed rates"],
      ["weekly_rest_and_leave_given", "Weekly rest and leave provided as prescribed"],
      ["annual_health_checkup_conducted", "Annual health check-up conducted where applicable"],
      ["women_night_work_safety_ensured", "Safety measures ensured for women working night shifts"],
      ["wages_paid_on_time", "Wages paid within the prescribed time"],
      ["principal_employer_responsibility_discharged", "Principal employer responsibilities discharged"],
    ]
  },
] as const;

export default function CombinedForm({ inspectionCombined = {}, user, onSave, onBack, referenceNumber, eodbCommon, eodbAse, common, inspectionRecord }: Props) {
  const [form, setForm] = useState<Record<string, any>>({ ...inspectionCombined });
  const [directions, setDirections] = useState<string[]>(
    Array.isArray(inspectionCombined.combined_directions) && inspectionCombined.combined_directions.length
      ? inspectionCombined.combined_directions.map((x: any) => typeof x === "string" ? x : x?.direction || "") : [""]
  );
  const [photo, setPhoto] = useState<any>(null);
  const set = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const input = (label: string, key: string, keyboardType: any = "default", multiline = false) => (
    <View style={s.field} key={key}>
      <Text style={s.label}>{label}</Text>
      <TextInput value={String(form[key] ?? "")} onChangeText={v => set(key, v)}
        keyboardType={keyboardType} multiline={multiline} placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#999" style={[s.input, multiline && s.multiline]} />
    </View>
  );

  const choice = (label: string, key: string, number: number) => (
    <View style={s.checkItem} key={key}>
      <View style={s.checkItemHeading}>
        <View style={s.numberBadge}><Text style={s.numberText}>{number}</Text></View>
        <Text style={s.label}>{label}</Text>
      </View>
      <View style={s.options}>{["Yes", "No", "NA"].map(v => (
        <TouchableOpacity key={v} onPress={() => set(key, v)} style={[s.option, form[key] === v && s.selected]}>
          <Text style={[s.optionText, form[key] === v && s.selectedText]}>{v}</Text>
        </TouchableOpacity>
      ))}</View>
      <Text style={s.remarksLabel}>Remarks / Evidence</Text>
      <TextInput value={String(form[`${key}_remarks`] ?? "")} onChangeText={v => set(`${key}_remarks`, v)}
        multiline placeholder="Enter remarks / evidence" placeholderTextColor="#999" style={[s.input, s.remarks]} />
    </View>
  );

  const pickPhoto = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["image/*"], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) setPhoto(result.assets[0]);
    } catch (e) { console.log("Combined photo picker error", e); Alert.alert("Error", "Could not select the photo."); }
  };

  const save = () => {
    onSave?.({
      ...form,
      reference_number: form.reference_number || referenceNumber || "",
      registration_number: form.registration_number || eodbAse?.registration_number || "",
      nature_of_activity: form.nature_of_activity || eodbAse?.nature_of_business || "",
      inspection_type: "combined",
      combined_directions: directions.map(x => x.trim()).filter(Boolean),
      // The parent submission handler must append this file to FormData as combined_violation_photo.
      combined_violation_photo: photo || form.combined_violation_photo || null,
    });
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Combined Inspection</Text>
      <Text style={s.subtitle}>INSPECTION CHECKLIST FOR 10 and above EMPLOYEES{"\n"}(Occupational Safety, Health and Working Conditions Code, 2020)</Text>

      <Heading title="Basic Inspection Details" />
      <ReadOnly label="UBIN" value={eodbCommon?.ubin} />
      <ReadOnly label="Application Reference Number" value={referenceNumber} />
      <ReadOnly label="Establishment Name" value={eodbCommon?.name_of_the_establishment} />
      <ReadOnly label="Submission Location" value={eodbCommon?.submission_location} />
      <ReadOnly label="Name of Inspector" value={inspectionRecord?.inspected_by || common?.common_data?.inspector?.name} />
      <ReadOnly label="Designation of Inspector" value={common?.common_data?.inspector?.designation} />
      <ReadOnly label="Date of Inspection" value={inspectionRecord?.inspection_date || common?.common_data?.inspector?.date} />
      <ReadOnly label="Time of Inspection" value={common?.common_data?.inspector?.time} />
      {common?.common_data?.gps_location && <>
        <ReadOnly label="GPS Latitude" value={common.common_data.gps_location.latitude} />
        <ReadOnly label="GPS Longitude" value={common.common_data.gps_location.longitude} />
      </>}

      <Heading title="Workforce and Other Details" />
      <ReadOnly label="Registration / License Number" value={form.registration_number || eodbAse?.registration_number} />
      <ReadOnly label="Nature of Activity" value={form.nature_of_activity || eodbAse?.nature_of_business} />
      {input("Direct Workers", "combined_workers_direct", "number-pad")}
      {input("Women Workers", "combined_women_workers", "number-pad")}
      {input("Migrant Workers", "combined_migrant_workers", "number-pad")}
      {input("Shifts", "combined_shifts")}

      <Heading title="Inspection Checklist" />
      {CHECKLIST.map(section => <View key={section.title} style={s.card}>
        <Text style={s.sectionHeading}>{section.title}</Text>
        {section.items.map(([key, label], index) => choice(label, key, index + 1))}
      </View>)}

      <Heading title="Inspection Findings and Directions" />
      {input("Violations Observed", "combined_violations_observed", "default", true)}
      <View style={s.field}>
        <Text style={s.label}>Is there any imminent danger?</Text>
        <View style={s.options}>{["Yes", "No"].map(v => <TouchableOpacity key={v} onPress={() => set("combined_imminent_danger", v)} style={[s.option, form.combined_imminent_danger === v && s.selected]}><Text style={[s.optionText, form.combined_imminent_danger === v && s.selectedText]}>{v}</Text></TouchableOpacity>)}</View>
      </View>
      <View style={s.field}>
        <Text style={s.label}>Violation Evidence Photo</Text>
        <TouchableOpacity style={s.upload} onPress={pickPhoto}><Text style={s.uploadText}>{photo?.name || (form.combined_violation_photo ? "Previously uploaded photo" : "Select Photo")}</Text></TouchableOpacity>
      </View>
      <Text style={s.label}>Directions</Text>
      {directions.map((v, i) => <View key={i} style={s.directionRow}>
        <TextInput value={v} onChangeText={text => setDirections(prev => prev.map((x, n) => n === i ? text : x))} multiline placeholder={`Direction ${i + 1}`} style={[s.input, s.directionInput]} />
        {directions.length > 1 && <TouchableOpacity onPress={() => setDirections(prev => prev.filter((_, n) => n !== i))} style={s.remove}><Text style={s.removeText}>−</Text></TouchableOpacity>}
      </View>)}
      <TouchableOpacity style={s.add} onPress={() => setDirections(prev => [...prev, ""])}><Text style={s.addText}>+ Add Direction</Text></TouchableOpacity>
      {input("Compliance Deadline", "combined_compliance_deadline")}
      {input("Follow-up Date", "combined_followup_date")}
      <ReadOnly
        label="Authorised Signatory Name"
        value={
          common?.common_data?.employer?.authorised_signatory_name ||
          form.authorised_signatory_name
        }
      />

      <ReadOnly
        label="Authorised Signatory Designation"
        value={
          common?.common_data?.employer?.authorised_signatory_designation ||
          form.authorised_signatory_designation
        }
      />

      <View style={s.buttons}>
        {onBack && <TouchableOpacity style={s.back} onPress={onBack}><Text style={s.buttonText}>Back</Text></TouchableOpacity>}
        <TouchableOpacity style={s.save} onPress={save}><Text style={s.buttonText}>Save Combined Inspection</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ReadOnly({ label, value }: { label: string; value: any }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.readOnlyValue}>
        <Text style={s.readOnlyText}>{value === null || value === undefined || value === "" ? "-" : String(value)}</Text>
      </View>
    </View>
  );
}

function Heading({ title }: { title: string }) { return <Text style={s.heading}>{title}</Text>; }

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#f5f5f5" }, container: { padding: 16, paddingBottom: 50 },
  title: { fontSize: 21, fontWeight: "700", color: "#1a1a4e", textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 12, color: "#666", textAlign: "center", lineHeight: 18, marginBottom: 14 },
  heading: { backgroundColor: "#1a1a4e", color: "#fff", fontSize: 15, fontWeight: "700", padding: 11, borderRadius: 7, marginTop: 15, marginBottom: 12 },
  card: { backgroundColor: "#fff", borderRadius: 9, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e5e5e5" },
  sectionHeading: { color: "#1a1a4e", fontSize: 14, fontWeight: "700", marginBottom: 10 },
  field: { marginBottom: 13 }, readOnlyValue: { borderWidth: 1, borderColor: "#e0e0e0", backgroundColor: "#eeeeee", borderRadius: 7, paddingHorizontal: 11, paddingVertical: 11, minHeight: 43, justifyContent: "center" }, readOnlyText: { color: "#444", fontSize: 14 }, checkItem: { marginBottom: 18, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#eeeeee" },
  checkItemHeading: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginBottom: 9 },
  numberBadge: { minWidth: 27, height: 27, borderRadius: 14, backgroundColor: "#e8eefc", alignItems: "center", justifyContent: "center", marginTop: 1 },
  numberText: { color: "#1a1a4e", fontSize: 12, fontWeight: "700" },
  label: { color: "#333", fontSize: 13, fontWeight: "600", marginBottom: 6, flex: 1 },
  remarksLabel: { color: "#666", fontSize: 12, fontWeight: "600", marginTop: 9, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: "#d5d5d5", backgroundColor: "#fff", borderRadius: 7, paddingHorizontal: 11, paddingVertical: 10, color: "#222", fontSize: 14, minHeight: 43 },
  multiline: { minHeight: 78, textAlignVertical: "top" }, remarks: { minHeight: 55, marginTop: 7, textAlignVertical: "top" },
  options: { flexDirection: "row", gap: 8, marginBottom: 2 }, option: { borderWidth: 1, borderColor: "#bbb", borderRadius: 7, paddingVertical: 8, paddingHorizontal: 17, backgroundColor: "#fff" },
  selected: { backgroundColor: "#1f928c", borderColor: "#1f928c" }, optionText: { color: "#444", fontWeight: "600", fontSize: 13 }, selectedText: { color: "#fff" },
  upload: { borderWidth: 1, borderStyle: "dashed", borderColor: "#1f928c", borderRadius: 7, padding: 13, backgroundColor: "#f7fffe" }, uploadText: { color: "#1f928c", fontWeight: "600", textAlign: "center" },
  directionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }, directionInput: { flex: 1, minHeight: 60, textAlignVertical: "top" },
  remove: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fdecea", alignItems: "center", justifyContent: "center" }, removeText: { color: "#c62828", fontSize: 23, fontWeight: "700" },
  add: { alignSelf: "flex-start", paddingVertical: 9, paddingHorizontal: 12, borderRadius: 6, backgroundColor: "#e8f5f4", marginBottom: 12 }, addText: { color: "#167a75", fontWeight: "700" },
  buttons: { flexDirection: "row", gap: 10, marginTop: 18 }, back: { flex: 1, backgroundColor: "#777", padding: 14, borderRadius: 8, alignItems: "center" },
  save: { flex: 2, backgroundColor: "#1f928c", padding: 14, borderRadius: 8, alignItems: "center" }, buttonText: { color: "#fff", fontWeight: "700" },
});
