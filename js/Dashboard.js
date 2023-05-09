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
	GetCustomersOptions: 'GET_CUSTOMER_OPTIONS',
	AddPayment: 'ADD_PAYMENT',
};
var totalInvoices = 0;
var totalCheques = 0;
var dbVersion = 1;

const connectToDb = (Table, Action, payload, itemID) => {
	let openRequest = indexedDB.open('Data', 1);

	openRequest.onupgradeneeded = function () {
		console.log(dbVersion, 'version running');
		let db = openRequest.result;
		if (!db.objectStoreNames.contains(Table)) {
			db.createObjectStore(Tables.Customer, { keyPath: 'id' }); // create it
			db.createObjectStore(Tables.Deposits, { keyPath: 'id' }); // create it
			db.createObjectStore(Tables.Invoices, { keyPath: 'id' }); // create it
		}
	};

	openRequest.onerror = (event) => {
		if (event.target.error.name == 'VersionError') {
			dbVersion++;
			connectToDb(Table, Action, payload, itemID);
		}
	};
	switch (Action) {
		case Actions.Get:
			openRequest.onsuccess = (event) => {
				let db = event.target.result;
				getData(db, Table);
			};
			break;
		default:
			break;
	}
};

function getData(db, Table) {
	let transaction = db.transaction(Table, 'readwrite'); // (1)

	let TableData = transaction.objectStore(Table); // (2)

	let request2 = TableData.getAll();
	request2.onsuccess = function () {
		let Invoices = request2.result;
		document.getElementById('total-invoices').innerText = Invoices.length;
		var date = addDaysToCurrentDate(30);
		var withinThirtyDays = [];
		var moreThanThirtyDays = [];
		Invoices.map((invoice) => {
			if (invoice.dueDate <= date) {
				withinThirtyDays.push(invoice);
			} else {
				moreThanThirtyDays.push(invoice);
			}
		});
		document.getElementById('in-30-invoices').innerText =
			withinThirtyDays.length;
		document.getElementById('more-30-invoices').innerText =
			moreThanThirtyDays.length;

		let awaitingPayments = [];
		let depositedPayments = [];
		let cashedPayments = [];
		Invoices.map((invoice) => {
			invoice.payments.map((payment) => {
				if (payment.paymentMode == 'Cheque') {
					if (payment.chequeStatus == 'Awaiting') {
						awaitingPayments.push(payment);
					}
					if (payment.chequeStatus == 'Deposited') {
						depositedPayments.push(payment);
					}
					if (payment.chequeStatus == 'Cashed') {
						cashedPayments.push(payment);
					}
				}
			});
		});

		document.getElementById('Deposited').innerText = depositedPayments.length;
		document.getElementById('Awaiting').innerText = awaitingPayments.length;
		document.getElementById('Cashed').innerText = cashedPayments.length;
	};
}
function addDaysToCurrentDate(noofDays) {
	date = new Date();
	next_date = new Date(date.setDate(date.getDate() + noofDays));
	var IncrementedDate = next_date.toISOString().slice(0, 10);
	return IncrementedDate;
}
// Onstart
connectToDb(Tables.Invoices, Actions.Get, {}, 0);
