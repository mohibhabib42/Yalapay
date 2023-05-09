const Tables = {
	Customer: 'CUSTOMER',
	Deposits: 'DEPOSIT',
	Invoices: 'INVOICE',
};
const Actions = {
	Add: 'ADD',
	Get: 'GET',
	Delete: 'DELETE',
	Edit: 'EDIT',
	GetInvoices: 'GET_INVOICES',
	UpdatePayments: 'UPDATE_PAYMENTS',
	UpdateDepositPayments: 'UPDATE_DEPOSIT_PAYMENTS',
};
var dbVersion = 3;
var allInvoices = true;

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
		case Actions.GetInvoices:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				getInvoices(db, Table);
			};
			break;
		case Actions.UpdatePayments:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				updatePaymentIdStatus(db, Table);
			};
			break;
		case Actions.UpdateDepositPayments:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				updateDepositPaymentIdStatus(db, Table);
			};
			break;
		default:
			break;
	}
};

const getInvoices = (db, Table) => {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	let request2 = TableData.getAll();
	request2.onsuccess = function () {
		let html = ``;

		if (allInvoices) {
			let payments = [];
			request2.result.map((item) =>
				item.payments.map((data) => payments.push(data)),
			);
			let checkPayments = payments.filter(
				(data) =>
					data.paymentMode == 'Cheque' && data.chequeStatus == 'Awaiting',
			);
			console.log(checkPayments);
			checkPayments.map((item) => {
				html += `
                <div class="invoices-list-item bg-primary-color white-color rounded p-1" >
                <label>Cheque No: ${item.chequeNumber}</label>
                <label>Amount: ${item.amount}</label>
                <label>Status: ${item.chequeStatus}</label>
                <label>Due Date: ${item.paymentDate}</label>
                <div>
                    <label>Include</label>
                    <input type='checkbox' id="${item.id}" class="cheques-to-include" id="${item.id}" />
                </div>
            </div>`;
			});
		} else {
			let payments = [];
			let invoices = request2.result;

			let depositPaymentIds = JSON.parse(
				localStorage.getItem('item_payment_ids'),
			);
			console.log(depositPaymentIds);

			let newInvoices = invoices.map((invoice) => {
				return {
					...invoice,
					payments: invoice.payments.filter((payment) => {
						return depositPaymentIds.includes(payment.id);
					}),
				};
			});

			newInvoices.map((item) =>
				item.payments.map((data) => payments.push(data)),
			);
			let checkPayments = payments.filter(
				(data) =>
					data.paymentMode == 'Cheque' && data.chequeStatus != 'Awaiting',
			);
			checkPayments.map((item) => {
				html += `
		    <div class="invoices-list-item bg-primary-color white-color rounded p-1" >
		    <label>Cheque No: ${item.chequeNumber}</label>
		    <label>Amount: ${item.amount}</label>
		    <label>Status: ${item.chequeStatus}</label>
		    <label>Due Date: ${item.paymentDate}</label>
		</div>`;
			});
		}

		document.getElementById('deposit-checks').innerHTML = html;
	};
};

function editData(db, Table, itemID) {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	let request = TableData.get(Number(itemID));
	request.onsuccess = function () {
		let deposit = {
			...request.result,
			...getDepositValues(),
		};
		console.log(deposit);

		TableData.put(deposit);
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
			case Tables.Deposits:
				var html = '';
				request2.result.map((data, i) => {
					let jsonData = JSON.stringify(data);
					html += `<div class="customers-list-item bg-primary-color white-color rounded p-1" >
					<label>Deposit # ${data.id} on ${data.depositDate} </label>
					<label>Status: ${data.depositStatus}</label>
					<label>Cheques count: ${data.paymentIds.length}</label>
					<div class='d-flex flex-row' style="gap: 0.5em">
					<button id=${
						data.id
					} onclick='editDeposit(${jsonData} , event)'  class="rounded pointer">edit</button>						
					<button id=${Math.random()} onclick='deleteDeposit(${
						data.id
					} )'  class="rounded pointer">Del</button>
					</div>
				</div>`;
				});
				document.getElementById('deposit-list').innerHTML = html;
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

	let Deposits = transaction.objectStore(Table); // (2)

	let request = Deposits.add(obj); // (3)
	request.onsuccess = function () {
		// (4)
		console.log(Table + ' added to the store', request.result);
		getData(db, Table);
	};
}

const setDepositValues = (Values) => {
	if (Values == null) {
		document.getElementById('account').value = '';
		document.getElementById('depositStatus').value = '';
		document.getElementById('depositDate').value = '';
	} else {
		document.getElementById('account').value = Values.account;
		document.getElementById('depositStatus').value = Values.depositStatus;
		document.getElementById('depositDate').value = Values.depositDate;
	}
};
const getDepositValues = () => {
	let account = document.getElementById('account').value;
	let depositStatus = document.getElementById('depositStatus').value;
	let depositDate = document.getElementById('depositDate').value;

	let deposit = {
		account: account,
		depositDate: depositDate,
		depositStatus: depositStatus,
	};

	return deposit;
};

const getPaymentIds = () => {
	let cheques = document.getElementsByClassName('cheques-to-include');
	let ids = [];
	for (let i = 0; i < cheques.length; i++) {
		if (cheques[i].checked) {
			ids.push(Number(cheques[i].id));
		}
	}
	return ids;
};

const addDeposit = (item, event) => {
	event.preventDefault();

	if (document.getElementById('add-edit-deposit').innerText != 'Update') {
		let deposit = {
			id: Math.random(),
			...getDepositValues(),
			paymentIds: getPaymentIds(),
		};

		connectToDb(Tables.Invoices, Actions.UpdatePayments, deposit, 0);
		connectToDb(Tables.Deposits, Actions.Add, deposit, 0);
	} else {
		let itemID = localStorage.getItem('item_id');
		connectToDb(Tables.Invoices, Actions.UpdateDepositPayments, {}, 0);
		connectToDb(Tables.Deposits, Actions.Edit, {}, itemID);
	}
};

const deleteDeposit = (itemID) => {
	connectToDb(Tables.Deposits, Actions.Delete, {}, itemID);
};

const editDeposit = (item, event) => {
	setDepositValues(item);

	allInvoices = false;
	connectToDb(Tables.Invoices, Actions.GetInvoices, {}, 0);

	document.getElementById('add-edit-deposit').innerText = 'Update';
	localStorage.setItem('item_id', item.id);
	localStorage.setItem('item_payment_ids', JSON.stringify(item.paymentIds));

	openModal();
};

function getAccounts() {
	let user = users.find(
		(state) => state.email == localStorage.getItem('email'),
	);
	let html = '<option selected disabled>none</option>';
	user.accounts.map((account) => {
		html += `<option value='${account.bankName + '-' + account.bankAccount}' >${
			account.bankName + '-' + account.bankAccount
		}</option>`;
	});
	document.getElementById('account').innerHTML = html;
}

const updatePaymentIdStatus = (db, Table) => {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	// let request = TableData.get(Number(itemID));
	let request2 = TableData.getAll();

	request2.onsuccess = function () {
		let invoices = request2.result;

		let newInvoices = invoices.map((invoice) => {
			return {
				...invoice,
				payments: invoice.payments.map((payment) => {
					console.log(getPaymentIds(), payment.id);
					if (getPaymentIds().includes(payment.id)) {
						return {
							...payment,
							chequeStatus: document.getElementById('depositStatus').value,
						};
					} else {
						return payment;
					}
				}),
			};
		});
		console.log(newInvoices);
		newInvoices.map((invoice) => {
			TableData.put(invoice);
		});
	};
};

const updateDepositPaymentIdStatus = (db, Table) => {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	// let request = TableData.get(Number(itemID));
	let request2 = TableData.getAll();

	request2.onsuccess = function () {
		let invoices = request2.result;

		let depositPaymentIds = JSON.parse(
			localStorage.getItem('item_payment_ids'),
		);
		console.log(depositPaymentIds);

		let newInvoices = invoices.map((invoice) => {
			return {
				...invoice,
				payments: invoice.payments.map((payment) => {
					console.log(getPaymentIds(), payment.id);
					if (depositPaymentIds.includes(payment.id)) {
						return {
							...payment,
							chequeStatus: document.getElementById('depositStatus').value,
						};
					} else {
						return payment;
					}
				}),
			};
		});
		console.log(newInvoices);
		newInvoices.map((invoice) => {
			TableData.put(invoice);
		});
	};
};

// On Start
connectToDb(Tables.Deposits, Actions.Get, {}, 0);
getAccounts();

// For Modal
// Get the modal
var modal = document.getElementById('myModal');

// Get the <span> element that closes the modal
var span = document.getElementsByClassName('close')[0];

function openModal() {
	modal.style.display = 'block';
}

function openDepositModal() {
	document.getElementById('add-edit-deposit').innerText = 'Add';

	setDepositValues(null);

	allInvoices = true;
	connectToDb(Tables.Invoices, Actions.GetInvoices, {}, 0);

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
