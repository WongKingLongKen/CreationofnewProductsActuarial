// Global variable to store parsed CSV data
let parsedCSVData = [];

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const previewTable = document.getElementById('previewTable');
    const previewTableHead = previewTable.querySelector('thead tr');
    const previewTableBody = previewTable.querySelector('tbody');
    const rowCountElement = document.getElementById('rowCount');
    const addMappingBtn = document.getElementById('addMapping');
    const processBtn = document.getElementById('processBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // Add new mapping row
    addMappingBtn.addEventListener('click', function() {
        const mappingPairs = document.querySelector('.mapping-pairs');
        const newRow = document.createElement('div');
        newRow.className = 'mapping-row';
        newRow.innerHTML = `
            <input type="text" class="original-code" placeholder="e.g., CGG05A">
            <input type="text" class="new-code" placeholder="e.g., CGK05A">
            <button class="btn btn-remove remove-pair"><i class="fas fa-times"></i></button>
        `;
        mappingPairs.appendChild(newRow);
        
        // Add event listener to the remove button
        newRow.querySelector('.remove-pair').addEventListener('click', function() {
            if (document.querySelectorAll('.mapping-row').length > 2) {
                mappingPairs.removeChild(newRow);
            }
        });
    });
    
    // Remove mapping row
    document.querySelectorAll('.remove-pair').forEach(btn => {
        btn.addEventListener('click', function() {
            const mappingRow = this.parentElement;
            if (document.querySelectorAll('.mapping-row').length > 2) {
                mappingRow.parentElement.removeChild(mappingRow);
            }
        });
    });
    
    // File upload preview
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.csv')) {
                parseCSV(file);
            } else {
                alert('Please upload a valid CSV file.');
                fileInput.value = '';
            }
        }
    });
    
    // Process button
    processBtn.addEventListener('click', function() {
        const outputPath = document.getElementById('outputPath').value;
        if (!outputPath) {
            alert('Please specify an output directory.');
            return;
        }
        
        if (!fileInput.files[0]) {
            alert('Please upload a CSV file first.');
            return;
        }
        
        // Validate mapping pairs
        const mappingPairs = [];
        let isValid = true;
        
        document.querySelectorAll('.mapping-row').forEach((row, index) => {
            // Skip the header row
            if (index === 0) return;
            
            const originalCode = row.querySelector('.original-code').value.trim();
            const newCode = row.querySelector('.new-code').value.trim();
            
            if (originalCode && newCode) {
                mappingPairs.push([originalCode, newCode]);
            } else if (originalCode || newCode) {
                isValid = false;
                alert(`Please complete both codes in row ${index}`);
            }
        });
        
        if (!isValid) return;
        
        if (mappingPairs.length === 0) {
            alert('Please add at least one valid code mapping.');
            return;
        }
        
        // Simulate processing
        processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        processBtn.disabled = true;
        
        setTimeout(function() {
            alert(`CSV file processed successfully with ${mappingPairs.length} mappings!\nOutput saved to: ${outputPath}`);
            processBtn.innerHTML = '<i class="fas fa-cogs"></i> Process CSV File';
            processBtn.disabled = false;
            
            // Offer download in this demo version
            const download = confirm('Would you like to download the processed file?');
            if (download) {
                // Create a simple CSV for download
                const csvContent = generateProcessedCSV(mappingPairs);
                downloadCSV(csvContent, 'processed_products.csv');
            }
        }, 2000);
    });
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        fileInput.value = '';
        document.getElementById('outputPath').value = '';
        previewTable.style.display = 'none';
        document.querySelector('.preview-info p:first-child').textContent = 'Upload a CSV file to see preview';
        rowCountElement.textContent = '';
        
        // Clear all but the first two mapping rows (header + one pair)
        const mappingPairs = document.querySelector('.mapping-pairs');
        const rows = document.querySelectorAll('.mapping-row');
        
        for (let i = rows.length - 1; i > 1; i--) {
            mappingPairs.removeChild(rows[i]);
        }
        
        // Reset the values of the first mapping row
        const originalCodes = document.querySelectorAll('.original-code');
        const newCodes = document.querySelectorAll('.new-code');
        originalCodes.forEach(input => input.value = '');
        newCodes.forEach(input => input.value = '');
    });
    
    // CSV parsing function (improved to skip empty/malformed rows)
    function parseCSV(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const csvData = e.target.result;
            const rows = csvData.split(/\r?\n/);
            
            // Parse the CSV rows
            const parsedData = [];
            
            for (let i = 0; i < rows.length; i++) {
                if (rows[i].trim() === '') continue;
                
                // Handle quoted fields that may contain commas
                const cells = [];
                let currentCell = '';
                let insideQuotes = false;
                
                for (let j = 0; j < rows[i].length; j++) {
                    const char = rows[i][j];
                    
                    if (char === '"') {
                        insideQuotes = !insideQuotes;
                    } else if (char === ',' && !insideQuotes) {
                        cells.push(currentCell.trim());
                        currentCell = '';
                    } else {
                        currentCell += char;
                    }
                }
                
                // Add the last cell
                cells.push(currentCell.trim());
                
                // Only add non-empty rows
                if (cells.some(cell => cell.length > 0)) {
                    parsedData.push(cells);
                }
            }
            
            // Store parsed data globally for later processing
            parsedCSVData = parsedData;
            
            displayPreview(parsedData);
        };
        
        reader.onerror = function() {
            alert('Error reading file');
        };
        
        reader.readAsText(file);
    }
    
    // Display preview in table
    function displayPreview(data) {
        // Clear previous data
        previewTableHead.innerHTML = '';
        previewTableBody.innerHTML = '';
        
        if (data.length === 0) {
            alert('No data found in the file');
            return;
        }
        
        // Create headers from first row
        data[0].forEach((header, index) => {
            const th = document.createElement('th');
            th.textContent = header || `Column ${index + 1}`;
            previewTableHead.appendChild(th);
        });
        
        // Create rows from data (skip header if it's the first row)
        const startRow = data.length > 1 && isHeaderRow(data[0]) ? 1 : 0;
        const rowCount = Math.min(data.length, startRow + 15); // Show up to 15 rows
        
        for (let i = startRow; i < rowCount; i++) {
            const row = document.createElement('tr');
            data[i].forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell;
                row.appendChild(td);
            });
            previewTableBody.appendChild(row);
        }
        
        // Update row count info
        const totalRows = data.length - startRow;
        rowCountElement.textContent = `Showing ${Math.min(totalRows, 15)} of ${totalRows} rows`;
        
        // Show the table
        document.querySelector('.preview-info p:first-child').textContent = 'CSV File Preview';
        previewTable.style.display = 'table';
    }
    
    // Helper function to determine if a row is a header row
    function isHeaderRow(row) {
        // Simple heuristic: if most cells are strings and few are numbers, it's likely a header
        let stringCount = 0;
        let numberCount = 0;
        
        for (const cell of row) {
            if (typeof cell === 'string' && isNaN(cell)) {
                stringCount++;
            } else if (!isNaN(cell)) {
                numberCount++;
            }
        }
        
        return stringCount > numberCount;
    }
    
    // Generate a processed CSV for download (robust for files with/without header)
    function generateProcessedCSV(mappings) {
        if (!parsedCSVData || parsedCSVData.length === 0) {
            alert('No CSV data loaded.');
            return '';
        }
        
        // Build a mapping object for quick lookup
        const mappingObj = {};
        mappings.forEach(pair => {
            mappingObj[pair[0]] = pair[1];
        });
        
        // Copy original data
        let outputRows = parsedCSVData.slice();
        
        // If only one row, treat as data (no header)
        const startIdx = parsedCSVData.length > 1 && isHeaderRow(parsedCSVData[0]) ? 1 : 0;
        
        // For each mapping, find all rows containing the original code and append a new row with replacements
        mappings.forEach(([origCode, newCode]) => {
            for (let i = startIdx; i < parsedCSVData.length; i++) {
                const row = parsedCSVData[i];
                let found = false;
                let newRow = row.map(cell => {
                    if (cell === origCode) {
                        found = true;
                        return newCode;
                    }
                    return cell;
                });
                if (found) {
                    outputRows.push(newRow);
                }
            }
        });
        
        // Convert outputRows to CSV string
        let csvContent = '';
        outputRows.forEach(row => {
            csvContent += row.map(cell => {
                if (cell && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',') + '\n';
        });
        
        return csvContent;
    }
    
    // Download CSV file
    function downloadCSV(csvContent, fileName) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});
