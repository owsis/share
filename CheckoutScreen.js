_finishTiket = () => {

	const url = `http://153.92.4.90/app_server/public/api/tiketorder/exe/${this.state.code}`
	this.timeFetch(20000, fetch(url, {
		method: 'POST',
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		}
	}))
		.then(res => ({
			status: res.status,
			json: res.json()
		}))
		.then(result => {
			if (result.status === 200 || result.status === 201) {
				this.goTo("Drawer")
			} else if (result.status > 400) {
				alert("Gagal")
			}
		})
		.catch(err => {
			return alert(err)
		});

	const { totalHar, phone } = this.state
	var userkey = '1xsbad';
	var passkey = 'abc123';
	var nohp = [
		// { no: '6281316803664' },
		// { no: '6285333333354' },
		// { no: '6282177778055' },
		// { no: '6281316803664' },
		{ no: phone },
	];
	var pesan =
		'Terima Kasih. Anda telah membeli tiket pemesanan properti pada aplikasi ' +
		'Smile In Properti. ' +
		'Silakan lakukan pembayaran sebesar Rp. ' + Numeral(totalHar).format('0,0') +
		' ke Bank BCA, No. Rekening 604 078 4444, a/n PT TOMBAK INTAN. '

	for (i = 0; i < nohp.length; i++) {

		const number = nohp[i].no;

		const url = `https://alpha.zenziva.net/apps/smsapi.php?
		userkey=${userkey}&
		passkey=${passkey}&
		nohp=${number}&
		pesan=${pesan}`;

		this.timeFetch(20000, fetch(url, {
			method: 'POST'
		}));
		this.timeFetch(20000, fetch(`http://api.whatsmate.net/v3/whatsapp/single/text/message/12`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-WM-CLIENT-ID': 'saphiretombakintan@gmail.com',
				'X-WM-CLIENT-SECRET': '1ebf48df334a4bb4bebd3885aa3aaa45'
			},
			body: JSON.stringify({
				number: number,
				message: pesan
			})
		}));
	}
}
