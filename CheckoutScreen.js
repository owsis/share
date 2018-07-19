import React, { PureComponent } from 'react';
import {
	View,
	Text,
	StyleSheet,
	StatusBar,
	TouchableOpacity,
	FlatList,
	ScrollView,
	AsyncStorage,
	Animated,
	Alert
} from 'react-native';

import LinearGradient from 'react-native-linear-gradient';
import { NavigationActions, withNavigation } from 'react-navigation';
import Icon from "react-native-vector-icons/Entypo";
import SelectBox from "../../components/common/SelectBox";
import Modal from "react-native-modal";
import Numeral from 'numeral';
import ContentLoader from 'react-native-content-loader'
import { Circle, Rect } from 'react-native-svg'

import { AppStyles, Metrics, Images, Colors, Fonts } from '../../themes';
import Button from "../../components/common/Button";
import Panel from "../../components/common/Panel";
import Loader from "../../components/common/Loader";
import OptionRadio from "../../components/common/OptionRadio";
import HeaderBar from "../../components/Header/HeaderBar";
import { getNups } from "../../data/Nup";

class CheckoutScreen extends PureComponent {

	constructor(props) {
		super(props);
		this.state = {
			tiketTrans: null,
			countData: '',
			totalJum: '',
			totalHar: '',
			totalTiketUser: '',
			maxTiket: 10,
			code: '',
			orderId: '',
			selectOrder: [],
			selected: false,
			modal: false
		}
	}

	componentDidMount() {
		this._tiketTrans()
	}

	_toggleChange = (item) => {
		if (!this.state.selected) {
			this._pushSelected(item)
		} else {
			this._removeSelected(item)
		}
		this.setState({
			selected: !this.state.selected
		})
	}

	_pushSelected = (id) => {
		let tmp = this.state.selectOrder
		tmp.push(id)
		this.setState({ selectOrder: tmp, order_id: id })
	}

	_removeSelected = (id) => {
		let tmp = this.state.selectOrder
		let index = this.state.selectOrder.indexOf(id);
		if (index > -1) {
			tmp.splice(index, 1)
		}
	}

	_changeSelected(value) {
		this.setState({ selected: value });
	}

	async _tiketOrder() {
		const url = `http://153.92.4.90/app_server/public/api/tiketorder/${this.state.code}`;
		try {
			let res = await fetch(url);
			if (res.status > 400) {
				return {}
			} else {
				return await res.json()
			}
		} catch (error) {
			return {};
		}
	}

	async _jumTiket() {
		const url = `http://153.92.4.90/app_server/public/api/marketing/tiket/${this.state.code}`;
		try {
			let res = await fetch(url);
			if (res.status > 400) {
				return {}
			} else {
				return await res.json()
			}
		} catch (error) {
			return {};
		}
	}

	async _tiketTrans() {

		var value = await AsyncStorage.getItem("user", (err, res) => {
			if (res) {
				let resultParsed = JSON.parse(res);
				this.setState({
					phone: resultParsed.phone,
					code: resultParsed.code
				});
			}
		});

		let jumTiket = await this._jumTiket();
		let getTiket = await this._tiketOrder();
		this.setState({
			totalTiketUser: jumTiket.meta.total_jum_tiket,
			tiketTrans: getTiket.data,
			countData: getTiket.meta.data_count,
			totalJum: getTiket.meta.total_jum_tiket,
			totalHar: getTiket.meta.total_har_tiket
		})

		this._opTiket()

	}

	_opTiket() {
		const { totalTiketUser, totalJum, maxTiket } = this.state
		if (Number(totalTiketUser) + Number(totalJum) <= maxTiket) {
			this.setState({
				isValid: true
			})
		} else {
			this.setState({
				isValid: false
			})
		}
	}

	_editTiket(item) {
		this.props.navigation.navigate('TiketUpdate', { tiket: item })
	}

	_openModal(item) {
		this.setState({
			modal: !this.state.modal,
			orderId: item.order_id
		});
	}

	_closeModal() {
		this.setState({
			modal: false,
			orderId: ''
		})
	}

	goTo = (routeName) => {
		const resetAction = NavigationActions.reset({
			index: 0,
			actions: [
				NavigationActions.navigate({ routeName })
			]
		});
		this.props.navigation.dispatch(resetAction);
	}

	timeFetch = (time, promise) => {
		return new Promise(function (resolve, reject) {
			setTimeout(() => {
				reject(new Error());
			}, time);
			promise.then(resolve, reject);
		});
	}

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

	_renderTiketTrans(item) {
		return (
			<View style={AppStyles.row}>
				<View style={AppStyles.blockLeft}>
					<Text style={styles.text}>{item.order_id}</Text>
				</View>
				<View style={AppStyles.center}>
					<Text style={styles.text}>{item.jum_tiket}</Text>
				</View>
				<View style={AppStyles.blockRight}>
					<Text style={styles.text}>Rp. {Numeral(item.total_tiket).format('0,0')}</Text>
				</View>
			</View>
		)
	}

	_renderButton() {

		return (
			<View>
				<Button
					iconRight={'chevrons-right'}
					colorIcon={Colors.white}
					styleButton={{
						marginVertical: Metrics.smallMargin,
						backgroundColor: Colors.blue,
						borderRadius: Metrics.borderRadius,
					}}
					styleText={{ color: Colors.white }}
					text={"Bayar"}
					onPress={() => this._finishTiket()}
				/>
			</View>

		)
	}

	onSelectedItemsChange = selectedItems => {
		this.setState({ selectedItems });
	};

	render() {

		const { countData, tiketTrans, selectedItems } = this.state;

		return (
			<View style={[AppStyles.mainContainer, styles.container]}>
				<StatusBar
					backgroundColor="white"
					barStyle="light-content"
					hidden={true}
				/>

				<HeaderBar
					back={true}
					title={'TROLI PEMESANAN'}
				/>

				<View style={styles.containerSub}>
					<View style={AppStyles.row}>
						<View style={AppStyles.blockLeft}>
							<Text style={styles.title}>Order ID</Text>
						</View>
						<View style={AppStyles.center}>
							<Text style={styles.title}>Jumlah Tiket</Text>
						</View>
						<View style={AppStyles.blockRight}>
							<Text style={styles.title}>Harga</Text>
						</View>
					</View>
					<View style={styles.separateTable}></View>

					{
						tiketTrans === null
							?
							<View style={AppStyles.row}>
								<View style={AppStyles.blockLeft}>
									<ContentLoader
										height={Metrics.navBarHeight}
										width={Metrics.deviceWidth / 4}
										duration={1000}>
										<Rect
											x={0}
											y={0}
											rx={Metrics.radius}
											ry={Metrics.radius}
											width={Metrics.deviceWidth / 4}
											height={Metrics.navBarHeight / 4}
										/>
									</ContentLoader>
								</View>
								<View style={AppStyles.center}>
									<ContentLoader
										height={Metrics.navBarHeight}
										width={Metrics.deviceWidth / 4}
										duration={1000}>
										<Rect
											x={0}
											y={0}
											rx={Metrics.radius}
											ry={Metrics.radius}
											width={Metrics.deviceWidth / 4}
											height={Metrics.navBarHeight / 4}
										/>
									</ContentLoader>
								</View>
								<View style={AppStyles.blockRight}>
									<ContentLoader
										height={Metrics.navBarHeight}
										width={Metrics.deviceWidth / 4}
										duration={1000}>
										<Rect
											x={0}
											y={0}
											rx={Metrics.radius}
											ry={Metrics.radius}
											width={Metrics.deviceWidth / 4}
											height={Metrics.navBarHeight / 4}
										/>
									</ContentLoader>
								</View>
							</View>
							:
							[
								countData === 0
									?
									<View style={[AppStyles.center, { flex: 1 }]}>
										<Image
											resizeMode={'contain'}
											style={{
												margin: Metrics.baseMargin * 4,
												width: Metrics.deviceWidth / 2,
												height: Metrics.deviceWidth / 2
											}}
											source={require('../../resources/icons/belumAda.png')}
										/>
										<Text style={styles.nothing}>Belum ada pembelian NUP</Text>
									</View>
									:
									<View>
										<FlatList
											contentContainerStyle={{ paddingVertical: Metrics.smallPadding }}
											data={tiketTrans}
											renderItem={({ item }) => this._renderTiketTrans(item)}
											keyExtractor={(item, index) => index}
										/>
										<View style={styles.separateTable}></View>
										<View style={AppStyles.row}>
											<View style={AppStyles.blockLeft}>
												<Text style={styles.text}>Total</Text>
											</View>
											<View style={AppStyles.center}>
												<Text style={styles.text}>{this.state.totalJum}</Text>
											</View>
											<View style={AppStyles.blockRight}>
												<Text style={styles.text}>Rp. {Numeral(this.state.totalHar).format('0,0')}</Text>
											</View>
										</View>

									</View>
							]

					}

				</View>
				<View style={styles.containerSub}>
					<View style={[AppStyles.center, { marginVertical: Metrics.baseMargin }]}>
						<Text style={Fonts.style.h5}>Total Pembayaran</Text>
						<Text style={[styles.textHeader, { color: Colors.blue }]}>Rp. {Numeral(this.state.totalHar).format('0,0')}</Text>
						<View style={{ margin: Metrics.smallMargin }}></View>
						<Text style={[Fonts.style.normal, { marginVertical: Metrics.smallMargin }]}>Silakan lakukan pembayaran ke</Text>
						
						<View style={[AppStyles.row, { marginHorizontal: Metrics.baseMargin * 2 }]}>
							<View style={AppStyles.blockLeft}>
								<Text style={Fonts.style.normal}>Bank</Text>
							</View>
							<View style={AppStyles.center}></View>
							<View style={AppStyles.blockRight}>
								<Text style={[Fonts.style.normal, { color: Colors.blue }]}>BCA</Text>
							</View>
						</View>

						<View style={[AppStyles.row, { marginHorizontal: Metrics.baseMargin * 2 }]}>
							<View style={AppStyles.blockLeft}>
								<Text style={Fonts.style.normal}>No. Rekening</Text>
							</View>
							<View style={AppStyles.center}></View>
							<View style={AppStyles.blockRight}>
								<Text style={[Fonts.style.normal, { color: Colors.blue }]}>604 078 4444</Text>
							</View>
						</View>

						<View style={[AppStyles.row, { marginHorizontal: Metrics.baseMargin * 2 }]}>
							<View style={AppStyles.blockLeft}>
								<Text style={Fonts.style.normal}>a/n</Text>
							</View>
							<View style={AppStyles.center}></View>
							<View style={AppStyles.blockRight}>
								<Text style={[Fonts.style.normal, { color: Colors.blue }]}>PT TOMBAK INTAN</Text>
							</View>
						</View>
					</View>
					{
						this._renderButton()
					}
				</View>

			</View>
		);
	}
}

export default withNavigation(CheckoutScreen);

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: Metrics.navBarHeight + Metrics.smallPadding
	},
	containerSub: {
		backgroundColor: Colors.white,
		width: Metrics.deviceWidth - (Metrics.baseMargin * 2),
		marginHorizontal: Metrics.baseMargin,
		marginBottom: Metrics.baseMargin,
		padding: Metrics.basePadding,
		borderRadius: Metrics.radius,
	},
	title: {
		...Fonts.style.normal
	},
	text: {
		...Fonts.style.normal,
		color: Colors.blue
	},
	textHeader: {
		...Fonts.style.h3
	},
	separateTable: {
		marginVertical: Metrics.smallMargin,
		width: Metrics.deviceWidth - (Metrics.baseMargin * 2),
		borderColor: Colors.light_gray,
		borderWidth: .8
	},
	button: {
		width: Metrics.navBarHeight * .7,
		height: Metrics.navBarHeight * .7,
		marginHorizontal: Metrics.smallMargin,
		marginBottom: Metrics.baseMargin,
		borderRadius: Metrics.radius
	},
});