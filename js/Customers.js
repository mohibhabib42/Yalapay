const Tables = {
	Customer: 'CUSTOMER',
};
const Actions = {
	Add: 'ADD',
	Get: 'GET',
	Delete: 'DELETE',
	Edit: 'EDIT',
};
var dbVersion = 1;

const connectToDb = (Table, Action, payload, itemID) => {
	let openRequest = indexedDB.open('Data', 1);

	openRequest.onupgradeneeded = function () {
		console.log(dbVersion, 'version running');
		let db = openRequest.result;
		if (!db.objectStoreNames.contains(Table)) {
			db.createObjectStore(Table, { keyPath: 'id' }); // create it
		}
	};

	openRequest.onerror = (event) => {
		if (event.target.error.name == 'VersionError') {
			dbVersion++;
			connectToDb(Table, Action, payload, itemID);
		}
	};
	switch (Action) {
		case Actions.Add:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				addToTable(db, payload, Table);
			};
			break;
		case Actions.Get:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				getData(db, Table);
			};
			break;
		case Actions.Delete:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				deleteData(db, Table, itemID);
			};
			break;
		case Actions.Edit:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				editData(db, Table, itemID);
			};
			break;
		default:
			break;
	}
};

function editData(db, Table, itemID) {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	let request = TableData.get(Number(itemID));
	request.onsuccess = function () {
		let companyName = document.getElementById('Company-Name').value;
		let Address = document.getElementById('Address').value;
		let fname = document.getElementById('customer-fname').value;
		let lname = document.getElementById('customer-lname').value;
		let Mobile = document.getElementById('Mobile').value;
		let Email = document.getElementById('Customer-Email').value;

		let customer = {
			...request.result,
			companyName: companyName,
			Address: Address,
			fname: fname,
			lname: lname,
			Mobile: Mobile,
			Email: Email,
		};

		TableData.put(customer);
		getData(db, Table);
	};
}

function deleteData(db, Table, itemID) {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	let request = TableData.delete(itemID);
	request.onsuccess = function () {
		getData(db, Table);
	};
}

function getData(db, Table) {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	let request2 = TableData.getAll();
	request2.onsuccess = function () {
		// (4)
		switch (Table) {
			case Tables.Customer:
				var html = '';
				request2.result.map((data, i) => {
					let jsonData = JSON.stringify(data);
					html += `<div class="customers-list-item bg-primary-color white-color rounded p-1" >
					<label id="customer-name">#${i} - ${data.companyName} </label>
					<label id="Customer-address">${data.Address}</label>
					<label id="Customer-email">${data.fname} ${data.lname} ${data.Email}</label>
					<div class='d-flex flex-row' style="gap: 0.5em">
					<button id=${
						data.id
					} onclick='editCustomer(${jsonData} , event)'  class="rounded pointer">edit</button>						
					<button id=${Math.random()} onclick='deleteCustomer(${
						data.id
					} )'  class="rounded pointer">Del</button>
					</div>
				</div>`;
				});
				document.getElementById('customers-list').innerHTML = html;
				document.getElementsByClassName('close')[0].click();
				break;
			default:
				break;
		}
	};
}
function test(data) {
	console.log('Hello');
}
function addToTable(db, obj, Table) {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let Invoices = transaction.objectStore(Table); // (2)

	let request = Invoices.add(obj); // (3)

	request.onsuccess = function () {
		// (4)
		console.log(Table + ' added to the store', request.result);
		getData(db, Table);
	};
}

const addCustomer = (item, event) => {
	event.preventDefault();

	if (document.getElementById('add-edit').innerText != 'Update') {
		let companyName = document.getElementById('Company-Name').value;
		let Address = document.getElementById('Address').value;
		let fname = document.getElementById('customer-fname').value;
		let lname = document.getElementById('customer-lname').value;
		let Mobile = document.getElementById('Mobile').value;
		let Email = document.getElementById('Customer-Email').value;

		let customer = {
			id: Math.random(),
			companyName: companyName,
			Address: Address,
			fname: fname,
			lname: lname,
			Mobile: Mobile,
			Email: Email,
		};

		connectToDb(Tables.Customer, Actions.Add, customer, 0);
	} else {
		let itemID = localStorage.getItem('item_id');
		connectToDb(Tables.Customer, Actions.Edit, {}, itemID);
	}
};

const deleteCustomer = (itemID) => {
	connectToDb(Tables.Customer, Actions.Delete, {}, itemID);
};

const editCustomer = (item, event) => {
	openModal();

	document.getElementById('Company-Name').value = item.companyName;
	document.getElementById('Address').value = item.Address;
	document.getElementById('customer-fname').value = item.fname;
	document.getElementById('customer-lname').value = item.lname;
	document.getElementById('Mobile').value = item.Mobile;
	document.getElementById('Customer-Email').value = item.Email;

	document.getElementById('add-edit').innerText = 'Update';

	localStorage.setItem('item_id', item.id);
};

// On Start
connectToDb(Tables.Customer, Actions.Get, {}, 0);

// For Modal
// Get the modal
var modal = document.getElementById('myModal');

// Get the <span> element that closes the modal
var span = document.getElementsByClassName('close')[0];

function openModal() {
	modal.style.display = 'block';
}

function openCustomerModal() {
	document.getElementById('add-edit').innerText = 'Add';

	document.getElementById('Company-Name').value = '';
	document.getElementById('Address').value = '';
	document.getElementById('customer-fname').value = '';
	document.getElementById('customer-lname').value = '';
	document.getElementById('Mobile').value = '';
	document.getElementById('Customer-Email').value = '';

	openModal();
}

// When the user clicks on <span> (x), close the modal
if (span != null) {
	span.onclick = function () {
		modal.style.display = 'none';
	};
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
	if (event.target == modal) {
		modal.style.display = 'none';
	}
};
