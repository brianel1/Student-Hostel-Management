import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Layout from '../../components/Layout';
import ConfirmDialog from '../../components/ConfirmDialog';
import { studentsAPI } from '../../services/api';
import { UploadIcon, TrashIcon, CheckIcon } from '../../components/Icons';

const AdminImport = () => {
  const [file, setFile] = useState(null);
  const [workbook, setWorkbook] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [sheetData, setSheetData] = useState([]);
  const [parsedStudents, setParsedStudents] = useState([]);
  const [totalStudentsAllSheets, setTotalStudentsAllSheets] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Calculate total students when workbook changes
  useEffect(() => {
    if (workbook) {
      const allStudents = [];
      const seenMatricNos = new Set();
      
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        let currentRoom = '';
        
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          
          if (row[0] && typeof row[0] === 'string' && row[0].match(/^B\d+-\d+$/i)) {
            currentRoom = row[0];
          }
          
          const matricNo = row[3];
          const studentName = row[1];
          
          if (matricNo && studentName && 
              typeof matricNo === 'string' && 
              matricNo.match(/^[A-Z]{1,4}\d{4,6}$/i) &&
              studentName !== 'NAMA PELAJAR' &&
              typeof studentName === 'string' &&
              studentName.trim().length > 0) {
            
            const normalizedMatric = matricNo.toUpperCase().trim();
            if (!seenMatricNos.has(normalizedMatric)) {
              seenMatricNos.add(normalizedMatric);
              allStudents.push(normalizedMatric);
            }
          }
        }
      });
      
      setTotalStudentsAllSheets(allStudents.length);
    }
  }, [workbook]);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.xlsx') && !uploadedFile.name.endsWith('.xls')) {
      setError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setError('');
    setFile(uploadedFile);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const wb = XLSX.read(data, { type: 'array' });
      setWorkbook(wb);
      setSheets(wb.SheetNames);
      setActiveSheet(0);
      loadSheetData(wb, 0);
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const loadSheetData = (wb, sheetIndex) => {
    const sheetName = wb.SheetNames[sheetIndex];
    const worksheet = wb.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    setSheetData(jsonData);
    parseStudentsFromSheet(jsonData, sheetName);
  };

  const parseStudentsFromSheet = (data, sheetName) => {
    const students = [];
    let currentRoom = '';
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Check if this row contains room number (NO BILIK column) - format like B3-01, B3-02, etc.
      if (row[0] && typeof row[0] === 'string' && row[0].match(/^B\d+-\d+$/i)) {
        currentRoom = row[0];
      }
      
      // Check if row has student data (has matric number in column D)
      const matricNo = row[3];
      const studentName = row[1];
      const semester = row[2];
      const phone = row[4];
      
      // More flexible matric number pattern - letters followed by numbers (e.g., DT22434, DG12308, YT12405)
      if (matricNo && studentName && 
          typeof matricNo === 'string' && 
          matricNo.match(/^[A-Z]{1,4}\d{4,6}$/i) &&
          studentName !== 'NAMA PELAJAR' &&
          typeof studentName === 'string' &&
          studentName.trim().length > 0) {
        
        // Parse room from currentRoom
        let roomBlock = '';
        let roomNo = '';
        
        if (currentRoom) {
          const roomParts = currentRoom.split('-');
          if (roomParts.length === 2) {
            roomBlock = roomParts[0];
            roomNo = roomParts[1];
          }
        }
        
        students.push({
          name: studentName.trim(),
          matric_no: matricNo.toUpperCase().trim(),
          semester: parseInt(semester) || 1,
          phone: phone ? String(phone).replace(/[^0-9]/g, '') : '',
          room_block: roomBlock,
          room_no: roomNo,
          sheet: sheetName
        });
      }
    }
    
    setParsedStudents(students);
  };

  const handleSheetChange = (index) => {
    setActiveSheet(index);
    if (workbook) {
      loadSheetData(workbook, index);
    }
  };

  const getAllStudentsFromAllSheets = () => {
    if (!workbook) return [];
    
    const allStudents = [];
    const seenMatricNos = new Set(); // Prevent duplicates across sheets
    
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      
      let currentRoom = '';
      
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        
        // Check for room number
        if (row[0] && typeof row[0] === 'string' && row[0].match(/^B\d+-\d+$/i)) {
          currentRoom = row[0];
        }
        
        const matricNo = row[3];
        const studentName = row[1];
        const semester = row[2];
        const phone = row[4];
        
        // More flexible matric number pattern
        if (matricNo && studentName && 
            typeof matricNo === 'string' && 
            matricNo.match(/^[A-Z]{1,4}\d{4,6}$/i) &&
            studentName !== 'NAMA PELAJAR' &&
            typeof studentName === 'string' &&
            studentName.trim().length > 0) {
          
          const normalizedMatric = matricNo.toUpperCase().trim();
          
          // Skip if already added from another sheet
          if (seenMatricNos.has(normalizedMatric)) continue;
          seenMatricNos.add(normalizedMatric);
          
          let roomBlock = '';
          let roomNo = '';
          
          if (currentRoom) {
            const roomParts = currentRoom.split('-');
            if (roomParts.length === 2) {
              roomBlock = roomParts[0];
              roomNo = roomParts[1];
            }
          }
          
          allStudents.push({
            name: studentName.trim(),
            matric_no: normalizedMatric,
            semester: parseInt(semester) || 1,
            phone: phone ? String(phone).replace(/[^0-9]/g, '') : '',
            room_block: roomBlock,
            room_no: roomNo,
            sheet: sheetName
          });
        }
      }
    });
    
    return allStudents;
  };

  const handleImport = async () => {
    const allStudents = getAllStudentsFromAllSheets();
    
    if (allStudents.length === 0) {
      setError('No valid student data found in the Excel file');
      return;
    }
    
    setImporting(true);
    setError('');
    
    try {
      const response = await studentsAPI.bulkImport(allStudents);
      if (response.data.success) {
        setImportResult({
          success: true,
          imported: response.data.imported,
          skipped: response.data.skipped,
          errors: response.data.errors || []
        });
      } else {
        setError(response.data.message || 'Import failed');
      }
    } catch (err) {
      setError('Failed to import students. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setWorkbook(null);
    setSheets([]);
    setSheetData([]);
    setParsedStudents([]);
    setTotalStudentsAllSheets(0);
    setImportResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout title="Import Students">
      <div className="import-container">
        {/* Upload Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upload Excel File</h3>
            {file && (
              <button className="btn btn-outline btn-sm" onClick={clearFile}>
                <TrashIcon /> Clear
              </button>
            )}
          </div>
          <div className="card-body">
            {error && <div className="error-message">{error}</div>}
            {importResult && importResult.success && (
              <div className="success-message">
                <CheckIcon /> Successfully imported {importResult.imported} students. 
                {importResult.skipped > 0 && ` Skipped ${importResult.skipped} (already exist).`}
              </div>
            )}
            
            {!file ? (
              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <div className="upload-icon"><UploadIcon /></div>
                <p className="upload-text">Click to upload Excel file</p>
                <p className="upload-hint">Only .xlsx or .xls files are accepted</p>
              </div>
            ) : (
              <div className="file-info">
                <div className="file-details">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <div className="file-stats">
                  <span>{sheets.length} sheets found</span>
                  <span className="separator">•</span>
                  <span>{parsedStudents.length} students in current sheet</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sheet Tabs & Preview */}
        {workbook && (
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">Excel Preview</h3>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={() => setShowConfirm(true)}
                disabled={importing}
              >
                {importing ? 'Importing...' : 'Import All Sheets'}
              </button>
            </div>
            
            {/* Sheet Tabs */}
            <div className="sheet-tabs">
              {sheets.map((sheet, index) => (
                <button
                  key={sheet}
                  className={`sheet-tab ${activeSheet === index ? 'active' : ''}`}
                  onClick={() => handleSheetChange(index)}
                >
                  {sheet}
                </button>
              ))}
            </div>
            
            {/* Total Students Info */}
            <div style={{ padding: '12px 20px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>
                Current sheet: <strong>{parsedStudents.length}</strong> students
              </span>
              <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                Total across all sheets: <strong>{totalStudentsAllSheets}</strong> students
              </span>
            </div>
            
            {/* Data Preview */}
            <div className="excel-preview">
              <table className="excel-table">
                <tbody>
                  {sheetData.slice(0, 50).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex === 0 ? 'header-row' : ''}>
                      <td className="row-number">{rowIndex + 1}</td>
                      {row.slice(0, 9).map((cell, cellIndex) => (
                        <td key={cellIndex} className={`cell col-${cellIndex}`}>
                          {cell !== null && cell !== undefined ? String(cell) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {sheetData.length > 50 && (
                <p className="preview-note">Showing first 50 rows of {sheetData.length} total rows</p>
              )}
            </div>
          </div>
        )}

        {/* Parsed Students Preview */}
        {parsedStudents.length > 0 && (
          <div className="card" style={{ marginTop: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">Detected Students ({parsedStudents.length})</h3>
            </div>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Matric No</th>
                    <th>Semester</th>
                    <th>Phone</th>
                    <th>Room</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedStudents.slice(0, 20).map((student, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: 500 }}>{student.name}</td>
                      <td>{student.matric_no}</td>
                      <td>{student.semester}</td>
                      <td>{student.phone || '-'}</td>
                      <td>{student.room_block && student.room_no ? `${student.room_block}-${student.room_no}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedStudents.length > 20 && (
                <p className="preview-note">Showing first 20 of {parsedStudents.length} students</p>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="info-box" style={{ marginTop: '24px' }}>
          <p><strong>Note:</strong> When importing, the system will:</p>
          <ul style={{ marginTop: '8px', marginLeft: '20px', color: 'var(--gray-600)' }}>
            <li>Create user accounts with matric number as default password</li>
            <li>Phone numbers starting with "1" will have "0" prefix added automatically</li>
            <li>Assign rooms if room data is available</li>
            <li>Skip students that already exist in the system</li>
          </ul>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleImport}
        title="Confirm Import"
        message={`Are you sure you want to import ${totalStudentsAllSheets} students from all ${sheets.length} sheets? This will create accounts for all detected students with their matric number as the default password.`}
        confirmText="Import"
        type="info"
      />
    </Layout>
  );
};

export default AdminImport;
