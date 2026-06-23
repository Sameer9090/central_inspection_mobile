import React from 'react';
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

const FINDINGS = [
  { key: 'issue_of_appointment_letters_mw', label: 'Issue of appointment letters' },
  { key: 'issue_of_identity_card_mw', label: 'Issue of identity cards' },
  { key: 'issue_of_payslip_mw', label: 'Issue of payslips' },
  { key: 'applicable_of_ESIC_mw', label: "Applicability of ESIC" },
  { key: 'maintenance_of_registers_mw', label: 'Maintenance of registers against each employee' },
  { key: 'whether_annual_rep_submitted_mw', label: 'Whether annual return is submitted or not?' },
  { key: 'is_adolescent_employed_mw', label: 'Has any adolescent been employed?' },
];

const SECTION_A = [
  { key: 'whether_master_roll_maintained', label: 'Whether Muster-roll maintained? [Section 50]' },
  { key: 'whether_register_of_wages_maintained', label: 'Whether Register of wages maintained? [Section 50]' },
  { key: 'whether_fine_deductions_recorded_appropriately', label: 'Whether fine and deductions are recorded in appropriate register/form? [Section 50]' },
  { key: 'whether_wage_slips_prescribed', label: 'Whether Wage Slips in prescribed form are being issued? [Section 50(3)]' },
  { key: 'whether_annual_return_form3_submitted', label: 'Whether Annual Return in Form III submitted? [Section 67(2)zc]' },
  { key: 'whether_overtime_registered', label: 'Whether Overtime Register of workers maintained? [Section 50]' },
  { key: 'whether_weekly_rest_is_allowed', label: 'Whether weekly rest is allowed to the workers? [Section 13]' },
  { key: 'whether_notices_displayed_abstract_name_schedule', label: 'Whether notices are displayed (Abstract, Inspector, Schedule)? [Section 50(2)]' },
  { key: 'whether_minimum_wages_fixed_by_govt_paid', label: 'Whether minimum wages fixed by Govt. are being paid? [Section 5]' },
  { key: 'no_of_employees_paid_at_a_lesser_rate', label: 'Number of employees paid wages less than minimum rate [Section 5]' },
];

const SECTION_B = [
  { key: 'whether_register_fines_maintained', label: 'Whether Register of fines has been maintained? [Section 50]' },
  { key: 'whether_register_deduction_for_damage_maintained', label: 'Whether Register of Deduction for damage or loss maintained? [Section 50]' },
  { key: 'whether_register_fines_maintained_rule5', label: 'Whether Register of wages has been maintained? [Section 50]' },
  { key: 'whether_wages_paid_on_time', label: 'Whether wages are paid on time? [Section 17]' },
  { key: 'whether_salaries_paid_in_their_bank_accounts', label: 'Whether employees are paid salaries/wages in their bank accounts? [Section 15]' },
  { key: 'whether_annual_return_submitted_rule17', label: 'Whether Annual Return submitted in Form IV? [Section 67(2)zc]' },
];

const SECTION_C = [
  { key: 'whether_equal_renumeration_paid_men_women_workers', label: 'Whether employer pays equal remuneration to men and women workers?' },
  { key: 'whether_register_maintained_by_employes_section8', label: 'Whether register is maintained by the employer? (Section 8)' },
];

const PERMANENT_CATS = ['Unskilled', 'Semi-Skilled', 'Skilled', 'Highly Skilled', 'Apprentice'];
const TEMP_CATS = ['Unskilled', 'Semi-Skilled', 'Skilled', 'Highly Skilled'];
const CONTRACT_CATS = ['Unskilled', 'Semi-Skilled', 'Skilled', 'Highly Skilled'];

export default function MinimumWageSection({ data, onChange, onSave, onBack, saving }) {
  const updateField = (field, value) => {
    onChange(prev => ({ ...prev, [field]: value }));
  };

  const addAdolescent = () => {
    const current = data.adolescent_details_minimumwage || [];
    onChange(prev => ({
      ...prev,
      adolescent_details_minimumwage: [
        ...current,
        { labour_office_intimation: '', name: '', address: '', age: '', hazardous_work: '', working_hours: '', maintain_register: '', wage_amount: '' },
      ],
    }));
  };

  const removeAdolescent = (index) => {
    const current = [...data.adolescent_details_minimumwage];
    current.splice(index, 1);
    onChange(prev => ({ ...prev, adolescent_details_minimumwage: current }));
  };

  const updateAdolescent = (index, field, value) => {
    const current = [...data.adolescent_details_minimumwage];
    current[index] = { ...current[index], [field]: value };
    onChange(prev => ({ ...prev, adolescent_details_minimumwage: current }));
  };

  const addDirection = () => {
    const current = data.minimumwage_directions || [''];
    onChange(prev => ({ ...prev, minimumwage_directions: [...current, ''] }));
  };

  const removeDirection = (index) => {
    const current = [...data.minimumwage_directions];
    current.splice(index, 1);
    onChange(prev => ({ ...prev, minimumwage_directions: current }));
  };

  const updateDirection = (index, value) => {
    const current = [...data.minimumwage_directions];
    current[index] = value;
    onChange(prev => ({ ...prev, minimumwage_directions: current }));
  };

  const addWorker = () => {
    const current = data.workers_detail_mw || [];
    onChange(prev => ({
      ...prev,
      workers_detail_mw: [...current, { name: '', designation: '', doj: '', wages: '' }],
    }));
  };

  const removeWorker = (index) => {
    const current = [...data.workers_detail_mw];
    current.splice(index, 1);
    onChange(prev => ({ ...prev, workers_detail_mw: current }));
  };

  const updateWorker = (index, field, value) => {
    const current = [...data.workers_detail_mw];
    current[index] = { ...current[index], [field]: value };
    onChange(prev => ({ ...prev, workers_detail_mw: current }));
  };

  const renderFinding = (item) => (
    <View key={item.key} style={styles.tableRow}>
      <Text style={styles.tableCellLabel}>{item.label}</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={data[item.key] || ''} onValueChange={(v) => updateField(item.key, v)}>
          {YES_NO_OPTIONS.map(opt => <Picker.Item key={opt.value} label={opt.label} value={opt.value} />)}
        </Picker>
      </View>
    </View>
  );

  const renderWorkerTable = (title, prefix, categories) => (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.workerTable}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.categoryCol]}>Category</Text>
          <Text style={styles.tableHeaderCell}>Male</Text>
          <Text style={styles.tableHeaderCell}>Female</Text>
        </View>
        {categories.map(cat => {
          const keyMale = `${prefix}_${cat.toLowerCase().replace('-', '')}_male`;
          const keyFemale = `${prefix}_${cat.toLowerCase().replace('-', '')}_female`;
          return (
            <View key={cat} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.categoryCol]}>{cat}</Text>
              <TextInput style={styles.tableInput} value={String(data[keyMale] || '')} onChangeText={(v) => updateField(keyMale, v)} keyboardType="numeric" placeholder="0" />
              <TextInput style={styles.tableInput} value={String(data[keyFemale] || '')} onChangeText={(v) => updateField(keyFemale, v)} keyboardType="numeric" placeholder="0" />
            </View>
          );
        })}
      </View>
      {prefix === 'permanent_employees' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput style={[styles.input, styles.textArea]} value={String(data.permanent_employees_remarks || '')} onChangeText={(v) => updateField('permanent_employees_remarks', v)} placeholder="Enter remarks" multiline numberOfLines={3} />
        </View>
      )}
      {prefix === 'temporary_employees' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput style={[styles.input, styles.textArea]} value={String(data.temporary_employees_remarks || '')} onChangeText={(v) => updateField('temporary_employees_remarks', v)} placeholder="Enter remarks" multiline numberOfLines={3} />
        </View>
      )}
      {prefix === 'contract_employees' && (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput style={[styles.input, styles.textArea]} value={String(data.contract_employees_remarks || '')} onChangeText={(v) => updateField('contract_employees_remarks', v)} placeholder="Enter remarks" multiline numberOfLines={3} />
        </View>
      )}
    </View>
  );

  return (
    <ScrollView>
      <Text style={styles.header}>Minimum Wage Inspection</Text>

      {/* Findings */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Minimum Wage Observations</Text>
        {FINDINGS.map(renderFinding)}
        {data.applicable_of_ESIC_mw === 'Yes' && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>Number of employees covered under ESIC</Text>
            <TextInput style={styles.input} value={String(data.ESIC_mw_no_of_empl || '')} onChangeText={(v) => updateField('ESIC_mw_no_of_empl', v)} keyboardType="numeric" placeholder="Enter number" />
          </View>
        )}
      </View>

      {/* Adolescent Workers */}
      {data.is_adolescent_employed_mw === 'Yes' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Adolescent Worker Details</Text>
          {(data.adolescent_details_minimumwage || []).map((ado, index) => (
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

      {/* Section A */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>A) Observations - Code on Wages</Text>
        {SECTION_A.map(renderFinding)}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Number of employees where wages were paid after statutory time limit</Text>
          <TextInput style={styles.input} value={String(data.no_of_employees_paid_after_statutory || '')} onChangeText={(v) => updateField('no_of_employees_paid_after_statutory', v)} keyboardType="numeric" placeholder="Enter number" />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Number of cases where overtime wages were not paid as per Rule 25</Text>
          <TextInput style={styles.input} value={String(data.number_of_cases_where_overtime_wages_not_paid || '')} onChangeText={(v) => updateField('number_of_cases_where_overtime_wages_not_paid', v)} keyboardType="numeric" placeholder="Enter number" />
        </View>
      </View>

      {/* Section B */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>B) Observations - Code on Wages</Text>
        {SECTION_B.map(renderFinding)}
      </View>

      {/* Section C */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>C) Equal Remuneration Observations</Text>
        {SECTION_C.map(renderFinding)}
      </View>

      {/* Worker Tables */}
      {renderWorkerTable('Permanent / Regular Workers', 'permanent_employees', PERMANENT_CATS)}
      {renderWorkerTable('Temporary / Casual Workers', 'temporary_employees', TEMP_CATS)}
      {renderWorkerTable('Contract Labour', 'contract_employees', CONTRACT_CATS)}

      {/* Individual Workers */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Individual Workers</Text>
        <View style={styles.workerTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.nameCol]}>Name</Text>
            <Text style={styles.tableHeaderCell}>Designation</Text>
            <Text style={styles.tableHeaderCell}>DOJ</Text>
            <Text style={styles.tableHeaderCell}>Wages</Text>
            <Text style={styles.tableHeaderCell}>Action</Text>
          </View>
          {(data.workers_detail_mw || []).map((worker, index) => (
            <View key={index} style={styles.tableRow}>
              <TextInput style={[styles.tableInput, styles.nameCol]} value={worker.name || ''} onChangeText={(v) => updateWorker(index, 'name', v)} placeholder="Name" />
              <TextInput style={styles.tableInput} value={worker.designation || ''} onChangeText={(v) => updateWorker(index, 'designation', v)} placeholder="Designation" />
              <TextInput style={styles.tableInput} value={worker.doj || ''} onChangeText={(v) => updateWorker(index, 'doj', v)} placeholder="YYYY-MM-DD" />
              <TextInput style={styles.tableInput} value={String(worker.wages || '')} onChangeText={(v) => updateWorker(index, 'wages', v)} keyboardType="numeric" placeholder="Wages" />
              <View style={styles.actionCol}>
                {index === 0 ? (
                  <TouchableOpacity style={styles.smallAddBtn} onPress={addWorker}><Text style={styles.smallAddBtnText}>+</Text></TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.smallRemoveBtn} onPress={() => removeWorker(index)}><Text style={styles.smallRemoveBtnText}>-</Text></TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Directions */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Directions <Text style={styles.required}>*</Text></Text>
        {(data.minimumwage_directions || ['']).map((dir, index) => (
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
        <TextInput style={[styles.input, styles.textArea]} value={String(data.additional_remarks3 || '')} onChangeText={(v) => updateField('additional_remarks3', v)} placeholder="Enter remarks" multiline numberOfLines={4} />
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
  workerTable: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f5f5f5', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  tableHeaderCell: { flex: 1, fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  categoryCol: { flex: 1.5, textAlign: 'left' },
  nameCol: { flex: 1.5 },
  tableCell: { flex: 1.5, fontSize: 13, paddingHorizontal: 8 },
  tableInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 6, marginHorizontal: 2, textAlign: 'center', fontSize: 12, backgroundColor: '#fafafa' },
  actionCol: { width: 40, alignItems: 'center' },
  smallAddBtn: { width: 30, height: 30, backgroundColor: '#28a745', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  smallAddBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  smallRemoveBtn: { width: 30, height: 30, backgroundColor: '#dc3545', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  smallRemoveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
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