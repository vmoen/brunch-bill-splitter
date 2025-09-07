/*
 * Brunch Bill Splitter
 *
 * This script powers the interactive bill splitting tool.  It defines the guests,
 * lists each purchased item (with prices broken down by quantity), and handles
 * user interactions such as assigning items to guests and calculating each
 * person's share including tax and tip.  If more than one guest selects an
 * item, its cost is split evenly among them.  The results are displayed in a
 * simple card layout once the calculation is complete.
 */

// Define participants.  Each entry has a first name and an optional last name.
const participants = [
  { first: "Vincent", last: "" },
  { first: "Giorgio", last: "" },
  { first: "Dennis", last: "" },
  { first: "Lisa", last: "" },
  { first: "Jana", last: "" },
  { first: "Carlos", last: "" },
  { first: "Kara", last: "" },
  // The last participant is Carlos's partner.  Users can update the last name.
  { first: "Carlos", last: "BF" }
];

// Define each purchased item.  Multi‑quantity items from the receipt are broken
// down so that each unit can be assigned independently.  All prices are
// pre‑tax/pre‑tip values.
const items = [
  { name: "Coke", price: 6.00 },
  { name: "Pitcher Aperol", price: 95.00 },
  { name: "Steak Tartare", price: 30.00 },
  { name: "Steak Tartare", price: 30.00 },
  { name: "Salmon Benedict", price: 28.00 },
  { name: "Entrecote", price: 56.00 },
  { name: "Entrecote", price: 56.00 },
  { name: "Steak Frites", price: 34.00 },
  { name: "Roasted Salmon", price: 34.00 },
  { name: "Ice Coffee", price: 6.00 },
  { name: "Diet Coke", price: 6.00 },
  { name: "Creme Brulee", price: 14.00 },
  { name: "Chocolate Mousse", price: 14.00 },
  { name: "Espresso", price: 5.50 },
  { name: "Espresso", price: 5.50 },
  { name: "Macchiato", price: 5.50 },
  { name: "Macchiato", price: 5.50 },
  { name: "Decaf Espresso", price: 6.00 },
  { name: "Decaf Espresso", price: 6.00 },
  { name: "Modelo Especial", price: 7.00 },
  { name: "Modelo Especial", price: 7.00 }
];

// Constants for the subtotal, tax and tip taken directly from the receipt.  We
// use these values to allocate the correct proportion of tax and tip to each
// guest based on their share of the pre‑tax subtotal.
const SUBTOTAL = 457.00;
const TAX = 40.54;
const TIP = 91.40;
const EXTRAS = TAX + TIP;

// Initialise the app once the DOM is fully loaded.
document.addEventListener("DOMContentLoaded", () => {
  renderParticipants();
  renderItemsTable();
  document.getElementById('calculate-btn').addEventListener('click', handleCalculate);
});

/**
 * Render the participants section.  Each participant is displayed either as
 * plain text (for most guests) or as a label with an editable last name field
 * (for the final guest).  When the last name field changes, the table header
 * and results cards are updated accordingly.
 */
function renderParticipants() {
  const container = document.getElementById('participants');
  container.innerHTML = '';
  participants.forEach((p, index) => {
    const div = document.createElement('div');
    div.className = 'participant';
    if (index === participants.length - 1) {
      // Last participant: allow editing the last name
      const label = document.createElement('label');
      label.textContent = `${p.first} `;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = p.last;
      input.placeholder = 'Last name';
      input.dataset.index = index;
      input.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        participants[idx].last = e.target.value.trim();
        updateTableHeader();
        updateResultsNames();
      });
      div.appendChild(label);
      div.appendChild(input);
    } else {
      // For all other participants, simply display their names
      div.textContent = p.first + (p.last ? ` ${p.last}` : '');
    }
    container.appendChild(div);
  });
}

/**
 * Build the items table including a header and one row per item.  The header
 * displays participant names, and each cell in the body contains a checkbox
 * allowing the user to assign that item to one or more guests.  Updating
 * participant names (for Carlos's partner) will refresh the header accordingly.
 */
function renderItemsTable() {
  const table = document.getElementById('items-table');
  table.innerHTML = '';
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const itemTh = document.createElement('th');
  itemTh.textContent = 'Item';
  headerRow.appendChild(itemTh);
  const priceTh = document.createElement('th');
  priceTh.textContent = 'Price ($)';
  headerRow.appendChild(priceTh);
  // Participant names as columns
  participants.forEach((p) => {
    const th = document.createElement('th');
    th.textContent = p.first + (p.last ? ` ${p.last}` : '');
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  // Create body
  const tbody = document.createElement('tbody');
  items.forEach((item, i) => {
    const row = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.textContent = item.name;
    row.appendChild(nameTd);
    const priceTd = document.createElement('td');
    priceTd.textContent = item.price.toFixed(2);
    row.appendChild(priceTd);
    participants.forEach((_, j) => {
      const cell = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.item = i;
      checkbox.dataset.participant = j;
      cell.appendChild(checkbox);
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
}

/**
 * Update the table header when the last name of the last participant changes.
 */
function updateTableHeader() {
  const thead = document.querySelector('#items-table thead');
  if (!thead) return;
  const headerRow = thead.rows[0];
  // Skip first two cells (Item, Price)
  participants.forEach((p, index) => {
    const colIndex = index + 2; // offset because of Item & Price columns
    const th = headerRow.cells[colIndex];
    if (th) {
      th.textContent = p.first + (p.last ? ` ${p.last}` : '');
    }
  });
}

/**
 * Update names displayed in the results cards if they are currently shown.
 */
function updateResultsNames() {
  const resultsContainer = document.getElementById('results');
  // If results are not visible yet, nothing to update
  if (resultsContainer.children.length === 0) return;
  Array.from(resultsContainer.children).forEach((card, idx) => {
    const nameHeader = card.querySelector('h3');
    if (nameHeader) {
      const p = participants[idx];
      nameHeader.textContent = p.first + (p.last ? ` ${p.last}` : '');
    }
  });
}

/**
 * Handle the calculation of each person's share.  Reads the current
 * assignments, validates that every item has at least one guest checked, then
 * computes each guest's pre‑tax subtotal, tax share, tip share and grand total.
 */
function handleCalculate() {
  // Build assignment map: for each item index, an array of participant indices who selected it
  const assignment = {};
  // Collect all checkboxes
  const checkboxes = document.querySelectorAll('#items-table tbody input[type="checkbox"]');
  checkboxes.forEach((cb) => {
    const itemIndex = parseInt(cb.dataset.item, 10);
    const participantIndex = parseInt(cb.dataset.participant, 10);
    if (!assignment[itemIndex]) {
      assignment[itemIndex] = [];
    }
    if (cb.checked) {
      assignment[itemIndex].push(participantIndex);
    }
  });
  // Validate that each item has at least one participant assigned
  const unassigned = Object.keys(assignment).some((itemIndex) => assignment[itemIndex].length === 0);
  if (unassigned) {
    alert('Please assign every item to at least one guest by checking the appropriate boxes.');
    return;
  }
  // Compute each participant's pre‑tax share
  const preTaxTotals = new Array(participants.length).fill(0);
  items.forEach((item, i) => {
    const assignedParticipants = assignment[i];
    const sharePerPerson = item.price / assignedParticipants.length;
    assignedParticipants.forEach((pIdx) => {
      preTaxTotals[pIdx] += sharePerPerson;
    });
  });
  // Now compute tax & tip shares and totals
  const results = [];
  preTaxTotals.forEach((preTax, idx) => {
    const ratio = preTax / SUBTOTAL;
    const extrasShare = ratio * EXTRAS;
    const taxShare = ratio * TAX;
    const tipShare = ratio * TIP;
    const total = preTax + extrasShare;
    results.push({
      name: participants[idx].first + (participants[idx].last ? ` ${participants[idx].last}` : ''),
      preTax: preTax,
      taxShare: taxShare,
      tipShare: tipShare,
      total: total
    });
  });
  renderResults(results);
}

/**
 * Display the results on the page.  Each participant gets a card summarising
 * their share of the bill.  We round all monetary values to two decimals for
 * readability.
 *
 * @param {Array} results Array of objects with {name, preTax, taxShare, tipShare, total}
 */
function renderResults(results) {
  const resultsSection = document.getElementById('results-section');
  const resultsContainer = document.getElementById('results');
  resultsSection.style.display = 'block';
  resultsContainer.innerHTML = '';
  results.forEach((res) => {
    const card = document.createElement('div');
    card.className = 'result-card';
    const name = document.createElement('h3');
    name.textContent = res.name;
    const preTaxP = document.createElement('p');
    preTaxP.textContent = `Pre‑tax: $${res.preTax.toFixed(2)}`;
    const taxP = document.createElement('p');
    taxP.textContent = `Tax: $${res.taxShare.toFixed(2)}`;
    const tipP = document.createElement('p');
    tipP.textContent = `Tip: $${res.tipShare.toFixed(2)}`;
    const totalP = document.createElement('p');
    totalP.textContent = `Total: $${res.total.toFixed(2)}`;
    card.appendChild(name);
    card.appendChild(preTaxP);
    card.appendChild(taxP);
    card.appendChild(tipP);
    card.appendChild(totalP);
    resultsContainer.appendChild(card);
  });
}
