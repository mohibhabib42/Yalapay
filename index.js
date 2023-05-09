// Functions

const login = (e) => {
	e.preventDefault();

	let email = document.getElementById('Uname').value;
	let password = document.getElementById('Pass').value;

	if (
		users.find((state) => state.email == email && state.password == password)
	) {
		localStorage.setItem('email', email);
		localStorage.setItem('Pass', password);
		document.getElementById('error').style.display = 'none';

		window.location.replace('./DashBoard.html');
	} else {
		document.getElementById('error').style.display = 'block';
	}
};

function CheckAuth() {
	let email = localStorage.getItem('email');
	let password = localStorage.getItem('Pass');

	if (
		users.find((state) => state.email == email && state.password == password)
	) {
		document.getElementById('fnamevalue').innerText = users.find(
			(state) => state.email == email && state.password == password,
		).firstName;
		document.getElementById('lnamevalue').innerText = users.find(
			(state) => state.email == email && state.password == password,
		).lastName;
		document.getElementById('emailvalue').innerText = users.find(
			(state) => state.email == email && state.password == password,
		).email;

		console.log('Logged in');
	} else {
		window.location.replace('./index.html');
		console.log('Logged out');
	}
}

// OnStart
CheckAuth();
