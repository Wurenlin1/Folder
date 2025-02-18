document.getElementById("fileInput").addEventListener("change", handleFileUpload);
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
document.getElementById("createSubfoldersBtn").addEventListener("click", createSubfolders);

let uploadedData = [];
let folderNames = [];

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
    showPreview(uploadedData);
  };
  reader.readAsArrayBuffer(file);
}

function parseCSVFile(file) {
  Papa.parse(file, {
    header: false,
    dynamicTyping: true,
    complete: function (results) {
      uploadedData = results.data;
      showPreview(uploadedData);
    },
  });
}

function showPreview(data) {
  const previewTableContainer = document.getElementById("previewTableContainer");
  previewTableContainer.innerHTML = "";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  // Create table header
  const headerRow = document.createElement("tr");
  data[0].forEach((cell) => {
    const th = document.createElement("th");
    th.textContent = cell;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  data.slice(1).forEach((row) => {
    const tr = document.createElement("tr");
    row.forEach((cell) => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  previewTableContainer.appendChild(table);
  document.getElementById("previewSection").classList.remove("hidden");
}

function confirmSelection() {
  const startRow = parseInt(document.getElementById("startRow").value, 10) - 1;
  const endRow = parseInt(document.getElementById("endRow").value, 10);

  const selectedData = uploadedData.slice(startRow, endRow);
  folderNames = selectedData.map((row) => row[0]); // Assuming folder names are in the first column

  document.getElementById("namesInput").value = folderNames.join("\n");
  updateFolderPreview();
  document.getElementById("previewSection").classList.add("hidden");
}

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
    label.textContent = `${index + 1}. ${name}`;

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

function createSubfolders() {
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
      output += `<p>Created subfolders for <strong>${name}</strong>:</p>`;
      output += `<ul>`;
      output += `<li>Subfolder 1</li>`;
      output += `<li>Subfolder 2</li>`;
      output += `</ul>`;
    });
  } else {
    output = "<p>Please select at least one folder to create subfolders.</p>";
  }

  document.getElementById("output").innerHTML = output;
}