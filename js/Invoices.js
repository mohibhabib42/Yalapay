const Tables = {
	Invoices: 'INVOICE',
	Customer: 'CUSTOMER',
};
const Actions = {
	Add: 'ADD',
	Get: 'GET',
	Delete: 'DELETE',
	Edit: 'EDIT',
	GetCustomersOptions: 'GET_CUSTOMER_OPTIONS',
	AddPayment: 'ADD_PAYMENT',
};
var dbVersion = 2;
var currentInvoice = null;
var isCheque = false;

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
		case Actions.GetCustomersOptions:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				addCustomerOptions(db, Table);
			};
			break;
		case Actions.AddPayment:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				addPaymentToInvoices(db, Table, itemID);
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
		let amount = document.getElementById('invoice-amount').value;
		let invoiceDate = document.getElementById('invoice-date').value;
		let dueDate = document.getElementById('due-date').value;
		let invoiceCustomerId = document.getElementById('invoice-customer').value;
		let invoiceCustomer = document.getElementById(invoiceCustomerId).innerText;

		let invoice = {
			...request.result,
			amount: Number(amount),
			invoiceCustomer: invoiceCustomer,
			invoiceCustomerId: Number(invoiceCustomerId),
			dueDate: dueDate,
			invoiceDate: invoiceDate,
		};

		TableData.put(invoice);
		getData(db, Table);
	};
}

function addPaymentToInvoices(db, Table, invoice) {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	let request = TableData.get(Number(invoice.id));
	request.onsuccess = function () {
		let newInvoice = {
			...invoice,
		};

		TableData.put(newInvoice);
		loadPayments(newInvoice);
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
			case Tables.Invoices:
				var html = '';
				request2.result.map((data, i) => {
					let jsonData = JSON.stringify(data);
					html += `<div class="invoices-list-item bg-primary-color white-color rounded p-1" >
                        <label>Invoice# ${i}: ${data.status}</label>
                        <label>Invoice Date: ${data.invoiceDate}</label>
                        <label>Due Date: ${data.dueDate}</label>
                        <label>Customer: ${data.invoiceCustomer}</label>
                        <label>Amount: ${data.amount}</label>
                        <div class='d-flex flex-row justify-content-center ' >
					<button id=${Math.random()} onclick='editInvoice(${jsonData} , event)' class="rounded pointer">edit</button>						
					<button id=${Math.random()} onclick='deleteInvoice(${
						data.id
					})' class="rounded pointer">Del</button>
                    </div>
                    <div class='d-flex flex-row justify-content-center'>
					<button onclick='openPaymentModal(${jsonData})' id=${Math.random()} class="rounded pointer">view payments</button>
                    </div>
                    
				</div>`;
				});
				document.getElementById('invoices-list').innerHTML = html;
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

const addInvoice = (item, event) => {
	event.preventDefault();

	if (document.getElementById('add-edit-invoice').innerText != 'Update') {
		let amount = document.getElementById('invoice-amount').value;
		let invoiceDate = document.getElementById('invoice-date').value;
		let dueDate = document.getElementById('due-date').value;
		let invoiceCustomerId = document.getElementById('invoice-customer').value;
		let invoiceCustomer = document.getElementById(invoiceCustomerId).innerText;

		let Invoice = {
			id: Math.random(),
			amount: Number(amount),
			invoiceCustomer: invoiceCustomer,
			invoiceCustomerId: Number(invoiceCustomerId),
			dueDate: dueDate,
			invoiceDate: invoiceDate,
			payments: [],
			status: 'Pending',
		};
		console.log(Invoice);
		connectToDb(Tables.Invoices, Actions.Add, Invoice, 0);
	} else {
		let itemID = localStorage.getItem('item_id');
		connectToDb(Tables.Invoices, Actions.Edit, {}, itemID);
	}
};

function addCustomerOptions(db, Table) {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	let request2 = TableData.getAll();
	let html = '<option selected disabled>none</option>';
	request2.onsuccess = function () {
		request2.result.map((data, i) => {
			html += `<option id="${data.id}" value="${data.id}">${data.fname} ${data.lname} </option>`;
		});
		document.getElementById('invoice-customer').innerHTML = html;
	};
}

const deleteInvoice = (itemID) => {
	connectToDb(Tables.Invoices, Actions.Delete, {}, itemID);
};

const editInvoice = (item, event) => {
	openModal();

	// for customer options
	connectToDb(Tables.Customer, Actions.GetCustomersOptions, {}, 0);
	document.getElementById('invoice-amount').value = item.amount;
	document.getElementById('invoice-date').value = item.invoiceDate;
	document.getElementById('due-date').value = item.dueDate;
	setTimeout(() => {
		document
			.getElementById(item.invoiceCustomerId)
			.setAttribute('selected', true);
	}, 1000);

	document.getElementById('add-edit-invoice').innerText = 'Update';

	localStorage.setItem('item_id', item.id);
};

function loadPayments(invoice) {
	let html = '';
	invoice.payments.map((payment) => {
		let jsonData = JSON.stringify(payment);
		html += `
        <div class="invoices-list-item bg-primary-color white-color rounded p-1" >
                        <label>Payment id: ${payment.id}</label>
                        <label>Payment mode: ${payment.paymentMode} </label>
                        <label>Payment date: ${payment.paymentDate}</label>
                        <label>Amount: ${payment.amount}</label>
                       
        `;
		if (payment.paymentMode == 'Cheque') {
			html += `<label>Check# ${payment.chequeNumber} - ${payment.chequeBank}  (${payment.chequeDueDate})</label>
                <label><img style='width: 100%; height: 100px' src='${payment.chequeImage}' /></label>
            `;
		}
		html += ` <div class='d-flex flex-row' style="gap: 0.5em">
        <button id='${Math.random()}' onclick='editPayment(${jsonData})' class="rounded">edit</button>
        <button id='${payment.id}' onclick='deletePayment(event , ${
			payment.id
		})' class="rounded">Del</button>
        </div>
    </div>`;
	});
	document.getElementById('payment-list').innerHTML = html;
}

const getPaymentValues = () => {
	let paymentMode = document.getElementById('payment-mode').value;
	let paymentDate = document.getElementById('Payment-date').value;
	let amount = document.getElementById('Payment-amount').value;

	let payment = {
		paymentDate: paymentDate,
		paymentMode: paymentMode,
		amount: amount,
	};

	return payment;
};

const uploadImage = async (chequeImage) => {};

const getChequeValues = () => {
	let chequeNumber = document.getElementById('cheque-number').value;
	let checkDrawer = document.getElementById('cheque-drawer').value;
	let chequeBank = document.getElementById('cheque-bank').value;
	let chequeDueDate = document.getElementById('cheque-due-date').value;
	let chequeImage = document.getElementById('cheque-image').files[0];

	chequeImage = URL.createObjectURL(chequeImage);

	let cheque = {
		chequeNumber: chequeNumber,
		chequeDrawer: checkDrawer,
		chequeDueDate: chequeDueDate,
		chequeBank: chequeBank,
		chequeImage: chequeImage,
	};

	return cheque;
};

const setPaymentValues = (Values) => {
	if (Values == null) {
		localStorage.setItem('edit_payment_id', null);
		document.getElementById('payment-mode').value = '';
		document.getElementById('Payment-date').value = '';
		document.getElementById('Payment-amount').value = '';
	} else {
		if (Values.paymentMode == 'Cheque') {
			handleCheques({
				target: {
					value: Values.paymentMode,
				},
			});
			setChequeValues(Values);
		}
		document.getElementById('payment-mode').value = Values.paymentMode;
		document.getElementById('Payment-date').value = Values.paymentDate;
		document.getElementById('Payment-amount').value = Values.amount;
	}
};
const setChequeValues = (Values) => {
	if (document.getElementById('cheque-number') != null) {
		if (Values == null) {
			document.getElementById('cheque-number').value = '';
			document.getElementById('cheque-drawer').value = '';
			document.getElementById('cheque-bank').value = '';
			document.getElementById('cheque-image').files[0] = '';
			document.getElementById('cheque-due-date').value = '';
		} else {
			document.getElementById('cheque-number').value = Values.chequeNumber;
			document.getElementById('cheque-drawer').value = Values.checkDrawer;
			document.getElementById('cheque-bank').value = Values.chequeBank;
			document.getElementById('cheque-image').files[0] = Values.chequeImage;
			document.getElementById('cheque-due-date').value = Values.chequeDueDate;
		}
	}
};

function savePayment(event, invoice) {
	event.preventDefault();

	if (
		localStorage.getItem('edit_payment_id') == 'null' ||
		localStorage.getItem('edit_payment_id') == undefined
	) {
		console.log('ADDED');
		let newPayment = {
			id: Math.random(),
			...getPaymentValues(),
		};
		if (isCheque) {
			newPayment = {
				...newPayment,
				...getChequeValues(),
				chequeStatus: 'Awaiting',
			};
		}
		currentInvoice = {
			...currentInvoice,
			payments: [...currentInvoice.payments, newPayment],
		};
	} else {
		console.log('UPDATED');
		let newPayment = {
			id: Number(localStorage.getItem('edit_payment_id')),
			...getPaymentValues(),
		};
		if (isCheque) {
			newPayment = {
				...newPayment,
				...getChequeValues(),
				chequeStatus: 'Awaiting',
			};
		}
		currentInvoice = {
			...currentInvoice,
			payments: currentInvoice.payments.map((state) => {
				if (state.id == newPayment.id) {
					return newPayment;
				} else {
					return state;
				}
			}),
		};
	}

	connectToDb(Tables.Invoices, Actions.AddPayment, {}, currentInvoice);
	setPaymentValues(null);
	isCheque && setChequeValues(null);

	localStorage.setItem('edit_payment_id', null);
	isCheque = false;
}

function editPayment(payment) {
	localStorage.setItem('edit_payment_id', payment.id);

	setPaymentValues(payment);
}

function deletePayment(event, paymentId) {
	event.preventDefault();
	currentInvoice = {
		...currentInvoice,
		payments: currentInvoice.payments.filter((state) => state.id != paymentId),
	};
	connectToDb(Tables.Invoices, Actions.AddPayment, {}, currentInvoice);
}

function handleCheques(event) {
	if (event.target.value == 'Cheque') {
		let html = `<div class="input-div">
            <label>Cheque No. </label>
            <input type="text"  id="cheque-number" required />
        </div>
        <div class="input-div">
            <label>Drawer</label>
            <input type="text"  id="cheque-drawer" required />
        </div>

        <div class="input-div">
        <label for="cheque-bank">Bank</label>
            <select name="cheque-bank" id="cheque-bank">
                <option selected disabled>none</option>
                ${banks.map((bank) => {
									return `<option value='${bank}'>${bank}</option>`;
								})}
            </select>
        </div>

        <div class="input-div">
            <label>Due Date</label>
            <input type="date"  id="cheque-due-date" required />
        </div>
        <div class="input-div">
            <label>Cheque</label>
            <input type="file"  id="cheque-image" required />
        </div>

        `;
		document.getElementById('payment-input-container').innerHTML = html;
		isCheque = true;
	} else {
		let html = '';
		document.getElementById('payment-input-container').innerHTML = html;
		isCheque = false;
	}
}

// On Start
connectToDb(Tables.Invoices, Actions.Get, {}, 0);

// For Modal
// Get the modal
var modal = document.getElementById('myModal');
var paymentModal = document.getElementById('paymentModal');

// Get the <span> element that closes the modal
var span = document.getElementsByClassName('close')[0];
var closePayment = document.getElementsByClassName('closePayment')[0];

function openModal() {
	modal.style.display = 'block';
}
function openPaymentModal(invoice) {
	paymentModal.style.display = 'block';
	document.getElementById('payment-input-container').innerHTML = '';

	currentInvoice = invoice;
	loadPayments(invoice);
}

function addInvoiceModal() {
	document.getElementById('add-edit-invoice').innerText = 'Add';

	document.getElementById('invoice-amount').value = '';
	document.getElementById('invoice-date').value = '';
	document.getElementById('due-date').value = '';
	document.getElementById('invoice-customer').value = '';
	// for customer options
	connectToDb(Tables.Customer, Actions.GetCustomersOptions, {}, 0);

	openModal();
}

// When the user clicks on <span> (x), close the modal
if (span != null || closePayment != null) {
	span.onclick = function () {
		modal.style.display = 'none';
	};

	closePayment.onclick = function () {
		currentInvoice = null;
		setPaymentValues(null);
		isCheque && setChequeValues(null);

		paymentModal.style.display = 'none';
	};
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
	if (event.target == modal) {
		modal.style.display = 'none';
		paymentModal.style.display = 'none';
	}
};
