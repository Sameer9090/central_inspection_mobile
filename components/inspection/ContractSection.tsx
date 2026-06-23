import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const YES_NO_OPTIONS = [
  { label: 'Select', value: '' },
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
];

const SAFETY_ITEMS = [
  { key: 'cleanliness_workplace_contract', label: 'Ensuring proper cleanliness in the workplace' },
  { key: 'adequate_lighting_contract', label: 'Providing adequate lighting in all work areas' },
  { key: 'proper_ventilation_contract', label: 'Maintaining proper ventilation to ensure a healthy working environment' },
  { key: 'fire_prevention_measures_contract', label: 'Taking necessary measures for prevention of fire, including safety arrangements and emergency preparedness' },
  { key: 'accident_prevention_contract', label: 'Taking all necessary preventive measures to avoid accidents at the workplace' },
];

const FINDINGS = [
  { key: 'issue_of_appointment_letters_contract', label: 'Issue of appointment letters' },
  { key: 'issue_of_identity_card_contract', label: 'Issue of identity cards' },
  { key: 'issue_of_payslip_contract', label: 'Issue of payslips' },
  { key: 'applicable_of_ESIC_contract', label: "Applicability of ESIC" },
  { key: 'maintenance_of_registers_contract', label: 'Maintenance of registers against each employee' },
  { key: 'whether_annual_rep_submitted_contract', label: 'Whether annual return is submitted or not?' },
  { key: 'is_adolescent_employed_contract', label: 'Has any adolescent been employed?' },
];

const CONTRACT_PROVISIONS = [
  { key: 'whether_license_obtained', label: 'Whether License obtained while executing contract work [Section 47]' },
  { key: 'whether_contract_labour_numbering', label: 'Whether contract labour exceeds maximum number specified in licence [Section 48]' },
  { key: 'whether_notices_regarding_rates_of_wages', label: 'Whether notices regarding rates of wages, hours of work, wage period etc. displayed [Section 31(1)]' },
  { key: 'whether_notice_regarding_names', label: "Whether notice of Inspector's name & address displayed [Rule 81(i)]" },
  { key: 'whether_copy_of_each_notice_displayed', label: 'Whether copy of displayed notices sent to Inspector [Section 31(2)]' },
  { key: 'whether_notices_showing_wage_period', label: 'Whether wage period & disbursement notices informed digitally to Principal Employer [Section 55(2)]' },
  { key: 'whether_intimation_of_commencement', label: 'Whether intimation of commencement/completion submitted within 30 days [Section 5(1)]' },
  { key: 'whether_half_yearly_return', label: 'Whether Yearly Return in Form X submitted [Section 33(d)]' },
  { key: 'whether_contractor_has_ensured_presence_of_representative', label: 'Whether authorised representative present during wage disbursement [Section 55(2)]' },
  { key: 'whether_contractor_ensured_payment_of_wages', label: 'Whether contractor ensured payment of wages within prescribed time [Section 55(2)]' },
  { key: 'whether_register_of_person_maintained', label: 'Whether register of persons employed maintained [Section 33(a)]' },
  { key: 'whether_wage_register_maintained', label: 'Whether wage register maintained [Section 33(a)]' },
  { key: 'whether_contractor_obtained_sig_thumb_impression', label: 'Whether signature/thumb impression obtained on wage register [Section 33(a)]' },
  { key: 'whether_welfare_facilities_regarding_drinking_water', label: 'Whether welfare facilities provided (water, latrine, washing) [Section 53]' },
  { key: 'whether_contractor_creche_facility', label: 'Whether creche facility provided when 20+ women employed [Section 53]' },
  { key: 'whether_contractor_provides_canteen_facility', label: 'Whether canteen facility provided when 100+ contract labour employed [Section 53]' },
  { key: 'whether_contractor_prvides_rest_rooms', label: 'Whether rest rooms provided for night halt [Section 53]' },
  { key: 'whether_first_aid_provided', label: 'Whether first aid facilities provided [Section 53]' },
  { key: 'whether_contractor_issued_employment_card', label: 'Whether employment id issued to each worker [Section 6(1)(f)]' },
  { key: 'whether_date_maintained_in_employment_card', label: 'Whether employment card maintained up to date [Section 6(1)(f)]' },
  { key: 'whether_contractor_issued_service_certificate', label: 'Whether experience certificate issued on termination [Section 56]' },
  { key: 'whether_wage_slips_formxix_issued', label: 'Whether wage slips in Form XIX issued before wage disbursement [Section 33(c)]' },
];

export default function ContractSection({ data, onChange, onSave, onBack, saving }) {
  const [showAdolescent, setShowAdolescent] = useState(data.is_adolescent_employed_contract === 'Yes');

  const updateField = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
    if (field === 'is_adolescent_employed_contract') {
      setShowAdolescent(value === 'Yes');
    }
  };

  const toggleCheckbox = (field) => {
    const current = data[field] === 'Yes' ? 'No' : 'Yes';
    updateField(field, current);
  };

  const addAdolescent = () => {
    const current = data.adolescent_details_contract || [];
    onChange(prev => ({
      ...prev,
      adolescent_details_contract: [
        ...current,
        { labour_office_intimation: '', name: '', address: '', age: '', hazardous_work: '', working_hours: '', maintain_register: '', wage_amount: '' },
      ],
    }));
  };

  const removeAdolescent = (index) => {
    const current = [...data.adolescent_details_contract];
    current.splice(index, 1);
    onChange(prev => ({ ...prev, adolescent_details_contract: current }));
  };

  const updateAdolescent = (index, field, value) => {
    const current = [...data.adolescent_details_contract];
    current[index] = { ...current[index], [field]: value };
    onChange(prev => ({ ...prev, adolescent_details_contract: current }));
  };

  const addDirection = () => {
    const current = data.contract_directions || [''];
    onChange(prev => ({ ...prev, contract_directions: [...current, ''] }));
  };

  const removeDirection = (index) => {
    const current = [...data.contract_directions];
    current.splice(index, 1);
    onChange(prev => ({ ...prev, contract_directions: current }));
  };

  const updateDirection = (index, value) => {
    const current = [...data.contract_directions];
    current[index] = value;
    onChange(prev => ({ ...prev, contract_directions: current }));
  };

  return (
    <ScrollView>
      <Text style={styles.header}>Contract Labour Inspection</Text>

      {/* Safety Measures */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Workplace Safety and Health Measures</Text>
        {SAFETY_ITEMS.map(item => (
          <TouchableOpacity key={item.key} style={styles.safetyItem} onPress={() => toggleCheckbox(item.key)}>
            <Text style={styles.safetyLabel}>{item.label}</Text>
            <View style={[styles.checkbox, data[item.key] === 'Yes' && styles.checkboxChecked]}>
              {data[item.key] === 'Yes' && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Findings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Inspection Findings</Text>
        {FINDINGS.map(item => (
          <View key={item.key} style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>{item.label}</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={data[item.key] || ''} onValueChange={(v) => updateField(item.key, v)}>
                {YES_NO_OPTIONS.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
              </Picker>
            </View>
          </View>
        ))}
        {data.applicable_of_ESIC_contract === 'Yes' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Number of employees covered under ESIC</Text>
            <TextInput style={styles.input} value={String(data.ESIC_contract_no_of_empl || '')} onChangeText={(v) => updateField('ESIC_contract_no_of_empl', v)} keyboardType="numeric" placeholder="Enter number" />
          </View>
        )}
      </View>

      {/* Adolescent Workers */}
      {showAdolescent && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Adolescent Worker Details</Text>
          {(data.adolescent_details_contract || []).map((ado, index) => (
            <View key={index} style={styles.adolescentBlock}>
              <View style={styles.adoHeader}>
                <Text style={styles.adoTitle}>Adolescent Entry #{index + 1}</Text>
                {index > 0 && <TouchableOpacity onPress={() => removeAdolescent(index)}><Text style={styles.removeBtn}>Remove</Text></TouchableOpacity>}
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Labour Office Intimation</Text>
                <View style={styles.pickerWrapper}>
                  <Picker selectedValue={ado.labour_office_intimation || ''} onValueChange={(v) => updateAdolescent(index, 'labour_office_intimation', v)}>
                    {YES_NO_OPTIONS.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                  </Picker>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name</Text>
                <TextInput style={styles.input} value={ado.name || ''} onChangeText={(v) => updateAdolescent(index, 'name', v)} placeholder="Enter name" />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput style={styles.input} value={ado.address || ''} onChangeText={(v) => updateAdolescent(index, 'address', v)} placeholder="Enter address" />
              </View>
              <View style={styles.row}>
                <View style={[styles.formGroup, styles.half]}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput style={styles.input} value={String(ado.age || '')} onChangeText={(v) => updateAdolescent(index, 'age', v)} keyboardType="numeric" placeholder="Age" />
                </View>
                <View style={[styles.formGroup, styles.half]}>
                  <Text style={styles.label}>Working Hours</Text>
                  <TextInput style={styles.input} value={ado.working_hours || ''} onChangeText={(v) => updateAdolescent(index, 'working_hours', v)} placeholder="Hours" />
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.formGroup, styles.half]}>
                  <Text style={styles.label}>Hazardous Work</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={ado.hazardous_work || ''} onValueChange={(v) => updateAdolescent(index, 'hazardous_work', v)}>
                      {YES_NO_OPTIONS.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                    </Picker>
                  </View>
                </View>
                <View style={[styles.formGroup, styles.half]}>
                  <Text style={styles.label}>Maintain Register</Text>
                  <View style={styles.pickerWrapper}>
                    <Picker selectedValue={ado.maintain_register || ''} onValueChange={(v) => updateAdolescent(index, 'maintain_register', v)}>
                      {YES_NO_OPTIONS.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
                    </Picker>
                  </View>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Wage Amount</Text>
                <TextInput style={styles.input} value={String(ado.wage_amount || '')} onChangeText={(v) => updateAdolescent(index, 'wage_amount', v)} keyboardType="numeric" placeholder="Enter wage" />
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.addBtn} onPress={addAdolescent}>
            <Text style={styles.addBtnText}>+ Add Another Adolescent</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Contract Provisions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contract Labour Provisions</Text>
        {CONTRACT_PROVISIONS.map(item => (
          <View key={item.key} style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>{item.label}</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={data[item.key] || ''} onValueChange={(v) => updateField(item.key, v)}>
                {YES_NO_OPTIONS.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
              </Picker>
            </View>
          </View>
        ))}
      </View>

      {/* Directions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Directions <Text style={styles.required}>*</Text></Text>
        {(data.contract_directions || ['']).map((dir, index) => (
          <View key={index} style={styles.directionRow}>
            <TextInput style={[styles.input, styles.directionInput]} value={dir} onChangeText={(v) => updateDirection(index, v)} placeholder={`Direction ${index + 1}`} />
            {index === 0 ? (
              <TouchableOpacity style={styles.addDirBtn} onPress={addDirection}><Text style={styles.addDirBtnText}>+</Text></TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.removeDirBtn} onPress={() => removeDirection(index)}><Text style={styles.removeDirBtnText}>-</Text></TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Remarks */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Additional Remarks <Text style={styles.required}>*</Text></Text>
        <TextInput style={[styles.input, styles.textArea]} value={String(data.additional_remarks2 || '')} onChangeText={(v) => updateField('additional_remarks2', v)} placeholder="Enter remarks" multiline numberOfLines={4} />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}><Text style={styles.backBtnText}>← Back</Text></TouchableOpacity>
        <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}><Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save & Continue'}</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#333', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333', borderBottomWidth: 2, borderBottomColor: '#1976D2', paddingBottom: 8 },
  safetyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  safetyLabel: { flex: 1, fontSize: 14, color: '#444', paddingRight: 10 },
  checkbox: { width: 28, height: 28, borderRadius: 4, borderWidth: 2, borderColor: '#1976D2', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#1976D2' },
  checkmark: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableCellLabel: { flex: 1, fontSize: 13, color: '#444', paddingRight: 10 },
  pickerWrapper: { width: 120, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, backgroundColor: '#fafafa' },
  formGroup: { marginBottom: 15 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#444' },
  required: { color: '#d32f2f' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 14, backgroundColor: '#fafafa' },
  textArea: { height: 100, textAlignVertical: 'top' },
  adolescentBlock: { backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  adoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  adoTitle: { fontWeight: 'bold', fontSize: 14 },
  removeBtn: { color: '#d32f2f', fontWeight: '600' },
  addBtn: { backgroundColor: '#e3f2fd', padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#1976D2', borderStyle: 'dashed' },
  addBtnText: { color: '#1976D2', fontWeight: '600' },
  directionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  directionInput: { flex: 1 },
  addDirBtn: { width: 40, height: 40, backgroundColor: '#1976D2', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addDirBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  removeDirBtn: { width: 40, height: 40, backgroundColor: '#d32f2f', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  removeDirBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  buttonRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  backBtn: { flex: 1, backgroundColor: '#6c757d', padding: 14, borderRadius: 10, alignItems: 'center' },
  backBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  saveBtn: { flex: 2, backgroundColor: '#1976D2', padding: 14, borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});