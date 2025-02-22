document.getElementById("fileInput").addEventListener("change", handleFileUpload);
document.getElementById("confirmColumnBtn").addEventListener("click", confirmColumn);
document.getElementById("confirmSelectionBtn").addEventListener("click", confirmSelection);
document.getElementById("namesInput").addEventListener("input", updateFolderPreview);
document.getElementById("splitByNewLine").addEventListener("change", updateFolderPreview);
document.getElementById("createFoldersBtn").addEventListener("click", createFolders);
document.getElementById("selectAllCheckbox").addEventListener("change", toggleSelectAll);
document.querySelectorAll(".sort-options a").forEach((option) => {
  option.addEventListener("click", (e) => {
    e.preventDefault();
    sortFolders(e.target.getAttribute("data-sort"));
  });
});
document.getElementById("removeDuplicatesBtn").addEventListener("click", removeDuplicates);
document.getElementById("keepDuplicatesBtn").addEventListener("click", keepDuplicates);
document.getElementById("createSubfolderBtn").addEventListener("click", createSubfolder);
document.getElementById("deleteSelectedBtn").addEventListener("click", deleteSelected);
document.getElementById("clearAllBtn").addEventListener("click", clearAll);

let uploadedData = [];
let folderNames = [];
let selectedColumnIndex = null;

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileType = file.name.split(".").pop().toLowerCase();

  if (fileType === "xlsx") {
    parseExcelFile(file);
  } else if (fileType === "csv") {
    parseCSVFile(file);
  } else {
    alert("Unsupported file type. Please upload a .xlsx or .csv file.");
  }
}

function parseExcelFile(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    uploadedData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    showColumnSelection(uploadedData[0]); // Show column selection dropdown
  };
  reader.readAsArrayBuffer(file);
}

function parseCSVFile(file) {
  Papa.parse(file, {
    header: false,
    dynamicTyping: true,
    complete: function (results) {
      uploadedData = results.data;
      showColumnSelection(uploadedData[0]); // Show column selection dropdown
    },
  });
}

function showColumnSelection(headerRow) {
  const columnDropdown = document.getElementById("columnDropdown");
  columnDropdown.innerHTML = "";

  headerRow.forEach((column, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = column || `Column ${index + 1}`;
    columnDropdown.appendChild(option);
  });

  document.getElementById("columnSelection").classList.remove("hidden");
}

function confirmColumn() {
  const columnDropdown = document.getElementById("columnDropdown");
  selectedColumnIndex = parseInt(columnDropdown.value, 10);

  // Show preview section
  document.getElementById("previewSection").classList.remove("hidden");
  showPreview(uploadedData);
}

function showPreview(data) {
  const previewTableContainer = document.getElementById("previewTableContainer");
  previewTableContainer.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  // Create table header
  const headerRow = document.createElement("tr");
  const headerNumber = document.createElement("th");
  headerNumber.textContent = "#";
  headerRow.appendChild(headerNumber);

  data[0].forEach((cell) => {
    const th = document.createElement("th");
    th.textContent = cell;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body with numbering
  data.slice(1).forEach((row, index) => {
    const tr = document.createElement("tr");

    // Add row number
    const rowNumber = document.createElement("td");
    rowNumber.textContent = index + 1;
    tr.appendChild(rowNumber);

    // Add row data
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  previewTableContainer.appendChild(table);
}

function confirmSelection() {
  const startRow = parseInt(document.getElementById("startRow").value, 10) - 1;
  const endRow = parseInt(document.getElementById("endRow").value, 10);

  const selectedData = uploadedData.slice(startRow, endRow);
  folderNames = selectedData.map((row) => row[selectedColumnIndex]); // Use selected column

  document.getElementById("namesInput").value = folderNames.join("\n");
  updateFolderPreview();
  document.getElementById("previewSection").classList.add("hidden");
}

// Rest of the code remains the same...

function updateFolderPreview() {
  const namesInput = document.getElementById("namesInput").value;
  const splitByNewLine = document.getElementById("splitByNewLine").checked;

  folderNames = splitByNewLine
    ? namesInput.split("\n").map((name) => name.trim()).filter((name) => name.length > 0)
    : namesInput.split(",").map((name) => name.trim()).filter((name) => name.length > 0);

  checkForDuplicates();
}

function checkForDuplicates() {
  const duplicates = findDuplicates(folderNames);
  if (duplicates.length > 0) {
    showDuplicateModal(duplicates);
  } else {
    renderFolderPreview();
  }
}

function findDuplicates(names) {
  const seen = new Set();
  const duplicates = new Set();
  names.forEach((name) => {
    if (seen.has(name)) {
      duplicates.add(name);
    } else {
      seen.add(name);
    }
  });
  return Array.from(duplicates);
}

function showDuplicateModal(duplicates) {
  const duplicateList = document.getElementById("duplicateList");
  duplicateList.innerHTML = duplicates.map((name) => `<li>${name}</li>`).join("");

  // Show the modal
  document.getElementById("duplicateModal").style.display = "flex";
}

function removeDuplicates() {
  folderNames = [...new Set(folderNames)]; // Remove duplicates
  document.getElementById("namesInput").value = folderNames.join("\n"); // Update textarea
  document.getElementById("duplicateModal").style.display = "none";
  renderFolderPreview();
}

function keepDuplicates() {
  document.getElementById("duplicateModal").style.display = "none";
  renderFolderPreview();
}

function renderFolderPreview() {
  const folderPreview = document.getElementById("folderPreview");
  folderPreview.innerHTML = "";

  folderNames.forEach((name, index) => {
    const folderItem = document.createElement("div");
    folderItem.className = "folder-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `folder-${index}`;
    checkbox.value = name;

    const label = document.createElement("label");
    label.htmlFor = `folder-${index}`;
    label.textContent = `${index + 1}. ${name}`; // Main folder uses "."

    folderItem.appendChild(checkbox);
    folderItem.appendChild(label);
    folderPreview.appendChild(folderItem);
  });

  document.getElementById("folderCount").textContent = `Folders to be created: ${folderNames.length}`;
}

function toggleSelectAll() {
  const checkboxes = document.querySelectorAll("#folderPreview input[type='checkbox']");
  const selectAllCheckbox = document.getElementById("selectAllCheckbox");
  checkboxes.forEach((checkbox) => {
    checkbox.checked = selectAllCheckbox.checked;
  });
}

function sortFolders(order) {
  if (order === "asc") {
    folderNames.sort((a, b) => a.localeCompare(b));
  } else if (order === "desc") {
    folderNames.sort((a, b) => b.localeCompare(a));
  }
  renderFolderPreview();
}

function createFolders() {
  const folderItems = document.querySelectorAll("#folderPreview .folder-item");
  const selectedFolders = [];

  folderItems.forEach((item) => {
    const checkbox = item.querySelector("input[type='checkbox']");
    if (checkbox.checked) {
      selectedFolders.push(checkbox.value);
    }
  });

  let output = "";
  if (selectedFolders.length > 0) {
    selectedFolders.forEach((name) => {
      output += `<p>Created folder: <strong>${name}</strong></p>`;
    });
  } else {
    output = "<p>Please select at least one folder to create.</p>";
  }

  document.getElementById("output").innerHTML = output;
}

function createSubfolder() {
  const subfolderName = document.getElementById("subfolderNameInput").value.trim();
  if (!subfolderName) {
    alert("Please enter a subfolder name.");
    return;
  }

  const selectedFolders = document.querySelectorAll("#folderPreview input[type='checkbox']:checked");
  if (selectedFolders.length === 0) {
    alert("Please select a folder to add a subfolder.");
    return;
  }

  selectedFolders.forEach((checkbox) => {
    const folderItem = checkbox.parentElement;
    const folderLabel = folderItem.querySelector("label");
    const folderNumber = folderLabel.textContent.split(" ")[0]; // Get the main folder number (e.g., "1.")

    // Create subfolder item
    const subfolderItem = document.createElement("div");
    subfolderItem.className = "subfolder";

    // Replace "." with "-" for subfolders
    const subfolderNumber = folderNumber.replace(".", "-");

    const subfolderCheckbox = document.createElement("input");
    subfolderCheckbox.type = "checkbox";
    subfolderCheckbox.value = `${folderLabel.textContent}/${subfolderName}`;

    const subfolderLabel = document.createElement("label");
    subfolderLabel.textContent = `${subfolderNumber} ${subfolderName}`; // Subfolder uses "-"

    subfolderItem.appendChild(subfolderCheckbox);
    subfolderItem.appendChild(subfolderLabel);
    folderItem.appendChild(subfolderItem);
  });

  document.getElementById("subfolderNameInput").value = ""; // Clear input
}

function deleteSelected() {
  const selectedItems = document.querySelectorAll("#folderPreview input[type='checkbox']:checked");
  selectedItems.forEach((item) => {
    item.parentElement.remove(); // Remove the folder/subfolder
  });

  // Update folderNames and textarea
  folderNames = Array.from(document.querySelectorAll("#folderPreview .folder-item label")).map((label) => label.textContent.replace(/^\d+\.\s/, ""));
  document.getElementById("namesInput").value = folderNames.join("\n");
  updateFolderPreview();
}

function clearAll() {
  document.getElementById("namesInput").value = "";
  folderNames = [];
  renderFolderPreview();
}