<template>
	<div class="pos-coupons-container">
		<!-- Header & Badges -->
		<div class="pos-coupons-header px-3 py-2 border-b">
			<div class="pos-coupons-header__info">
				<div class="pos-coupons-title d-flex align-center gap-2">
					<v-icon size="20" color="primary">mdi-ticket-percent-outline</v-icon>
					<span class="text-subtitle-1 font-weight-bold">{{ __("Coupons") }}</span>
				</div>
				<div class="pos-coupons-badges d-flex align-center gap-2 mt-1">
					<v-chip size="small" variant="tonal" color="primary">
						{{ __("Total") }}: {{ couponsCount }}
					</v-chip>
					<v-chip size="small" variant="tonal" color="success">
						{{ __("Applied") }}: {{ appliedCouponsCount }}
					</v-chip>
				</div>
			</div>
			<v-btn
				variant="tonal"
				density="compact"
				color="warning"
				class="pos-coupons-back-btn"
				@click="back_to_invoice"
			>
				<v-icon size="18" class="mr-1">mdi-arrow-left</v-icon>
				{{ __("Back") }}
			</v-btn>
		</div>

		<!-- Customer Context Banner -->
		<div class="pos-coupons-customer-bar px-3 py-2 border-b">
			<div v-if="customer" class="d-flex align-center gap-2 text-body-2 text-medium-emphasis">
				<v-icon size="18" color="primary">mdi-account-check-outline</v-icon>
				<span>{{ __("Customer") }}: <strong class="text-high-emphasis">{{ customer }}</strong></span>
			</div>
			<div v-else class="d-flex align-center gap-2 text-caption text-warning">
				<v-icon size="18" color="warning">mdi-account-alert-outline</v-icon>
				<span>{{ __("Select a customer to use coupons") }}</span>
			</div>
		</div>

		<!-- Input & Add Bar -->
		<div class="pos-coupons-input-bar pa-3 border-b">
			<div class="d-flex align-center gap-2">
				<v-text-field
					density="compact"
					variant="outlined"
					color="primary"
					:label="frappe._('Coupon Code')"
					class="pos-themed-input coupon-input flex-grow-1"
					hide-details
					v-model="new_coupon"
					:placeholder="__('Enter coupon code')"
					@keydown.enter="add_coupon(new_coupon)"
				>
					<template #prepend-inner>
						<v-icon size="18" color="medium-emphasis">mdi-ticket-outline</v-icon>
					</template>
				</v-text-field>

				<v-btn
					class="add-coupon-btn px-4"
					color="success"
					theme="dark"
					:disabled="!customer || !new_coupon"
					@click="add_coupon(new_coupon)"
				>
					<v-icon size="18" class="mr-1">mdi-plus</v-icon>
					{{ __("Add") }}
				</v-btn>
			</div>
		</div>

		<!-- Coupons List -->
		<div class="pos-coupons-body pa-3 overflow-y-auto">
			<div v-if="(posa_coupons || []).length === 0" class="pos-coupons-empty pa-6 text-center text-muted">
				<v-icon size="40" class="mb-2">mdi-ticket-outline</v-icon>
				<div class="text-body-2">{{ __("No coupons added") }}</div>
			</div>

			<div v-else class="pos-coupons-list">
				<v-card
					v-for="item in posa_coupons"
					:key="item.coupon || item.coupon_code"
					variant="outlined"
					class="pos-coupon-card mb-3 pa-3"
					:class="{ 'pos-coupon-card--applied': item.applied }"
				>
					<div class="d-flex align-center justify-space-between gap-3">
						<div class="pos-coupon-card__info">
							<div class="d-flex align-center gap-2">
								<bdi class="pos-coupon-card__code font-weight-bold text-body-1">{{ item.coupon_code }}</bdi>
								<v-chip
									size="x-small"
									:color="item.applied ? 'success' : 'grey'"
									variant="tonal"
								>
									{{ item.applied ? __("Applied") : __("Available") }}
								</v-chip>
							</div>
							<div class="pos-coupon-card__meta d-flex align-center gap-2 mt-1 text-caption text-medium-emphasis">
								<span v-if="item.type">{{ __("Type") }}: {{ item.type }}</span>
								<span v-if="item.pos_offer">• {{ __("Offer") }}: {{ item.pos_offer }}</span>
							</div>
						</div>
					</div>
				</v-card>
			</div>
		</div>
	</div>
</template>

<script>
import { useCustomersStore } from "../../../stores/customersStore.js";
import { useToastStore } from "../../../stores/toastStore.js";
import { useUIStore } from "../../../stores/uiStore.js";
import { storeToRefs } from "pinia";
import { getCachedCoupons, saveCoupons } from "../../../../offline/index";

export default {
	setup() {
		const customersStore = useCustomersStore();
		const toastStore = useToastStore();
		const uiStore = useUIStore();
		const { selectedCustomer } = storeToRefs(customersStore);
		return { selectedCustomer, toastStore, uiStore };
	},
	data: () => ({
		loading: false,
		pos_profile: "",
		customer: "",
		posa_coupons: [],
		new_coupon: null,
		itemsPerPage: 1000,
		singleExpand: true,
		items_headers: [
			{ title: __("Coupon"), value: "coupon_code", align: "start" },
			{ title: __("Type"), value: "type", align: "start" },
			{ title: __("Offer"), value: "pos_offer", align: "start" },
			{ title: __("Applied"), value: "applied", align: "start" },
		],
	}),

	computed: {
		couponsCount() {
			return (this.posa_coupons || []).length;
		},
		appliedCouponsCount() {
			return (this.posa_coupons || []).filter((el) => !!el.applied).length;
		},
	},

	methods: {
		back_to_invoice() {
			this.uiStore.setActiveView("items");
		},
		add_coupon(new_coupon, options = {}) {
			const silentDuplicate = !!options.silentDuplicate;
			const normalizedCoupon = String(new_coupon || "")
				.trim()
				.toUpperCase();
			if (!this.customer || !normalizedCoupon) {
				this.toastStore.show({
					title: __("Select a customer to use coupon"),
					color: "error",
				});
				return;
			}
			const coupons = this.posa_coupons || [];
			const exist = coupons.find(
				(el) =>
					String(el.coupon_code || "")
						.trim()
						.toUpperCase() == normalizedCoupon,
			);
			if (exist) {
				if (!silentDuplicate) {
					this.toastStore.show({
						title: __("This coupon already used !"),
						color: "error",
					});
				}
				return;
			}
			const vm = this;
			frappe.call({
				method: "posawesome.posawesome.api.offers.get_pos_coupon",
				args: {
					coupon: normalizedCoupon,
					customer: vm.customer,
					company: vm.pos_profile.company,
				},
				callback: function (r) {
					if (r.message) {
						const res = r.message;
						if (res.msg != "Apply" || !res.coupon) {
							vm.toastStore.show({
								title: res.msg,
								color: "error",
							});
						} else {
							vm.new_coupon = null;
							const coupon = res.coupon;
							if (!vm.posa_coupons) vm.posa_coupons = [];
							vm.posa_coupons.push({
								coupon: coupon.name,
								coupon_code: coupon.coupon_code,
								type: coupon.coupon_type,
								applied: 0,
								pos_offer: coupon.pos_offer,
								customer: coupon.customer || vm.customer,
							});
						}
					}
				},
			});
		},
		setActiveGiftCoupons() {
			if (!this.customer) return;
			const vm = this;
			frappe.call({
				method: "posawesome.posawesome.api.offers.get_active_gift_coupons",
				args: {
					customer: vm.customer,
					company: vm.pos_profile.company,
				},
				callback: function (r) {
					if (r.message) {
						const coupons = r.message;
						coupons.forEach((coupon_code) => {
							vm.add_coupon(coupon_code, { silentDuplicate: true });
						});
					}
				},
			});
		},

		updatePosCoupons(offers) {
			if (!this.posa_coupons) return;
			const offerList = Array.isArray(offers) ? offers : [];
			this.posa_coupons.forEach((coupon) => {
				const offer = offerList.find((el) => el.offer_applied && el.coupon == coupon.coupon);
				if (offer) {
					coupon.applied = 1;
				} else {
					coupon.applied = 0;
				}
			});
		},

		removeCoupon(reomove_list) {
			if (!this.posa_coupons) return;
			this.posa_coupons = this.posa_coupons.filter((coupon) => !reomove_list.includes(coupon.coupon));
		},
		updateInvoice() {
			this.eventBus.emit("update_invoice_coupons", this.posa_coupons || []);
		},
		updateCounters() {
			// update store
			this.uiStore.setCouponCounts(this.couponsCount, this.appliedCouponsCount);
		},
		loadCachedCoupons(customer) {
			const normalizedCustomer = String(customer || "").trim();
			if (!normalizedCustomer) {
				return [];
			}
			const cachedCoupons = getCachedCoupons();
			const customerCoupons = cachedCoupons?.[normalizedCustomer];
			if (!Array.isArray(customerCoupons)) {
				return [];
			}
			return customerCoupons.map((coupon) => ({ ...(coupon || {}) }));
		},
		persistCouponsCache() {
			const normalizedCustomer = String(this.customer || "").trim();
			if (!normalizedCustomer) {
				return;
			}
			const nextCache = {
				...(getCachedCoupons() || {}),
			};
			if (Array.isArray(this.posa_coupons) && this.posa_coupons.length > 0) {
				nextCache[normalizedCustomer] = this.posa_coupons.map((coupon) => ({
					...(coupon || {}),
				}));
			} else {
				delete nextCache[normalizedCustomer];
			}
			saveCoupons(nextCache);
		},
	},

	watch: {
		posa_coupons: {
			deep: true,
			handler() {
				this.updateInvoice();
				this.updateCounters();
				this.persistCouponsCache();
			},
		},
		selectedCustomer(newCustomer, oldCustomer) {
			if (newCustomer === oldCustomer && newCustomer === this.customer) {
				this.setActiveGiftCoupons();
				return;
			}
			const normalized = newCustomer || "";
			if (this.customer !== normalized) {
				const to_remove = [];
				(this.posa_coupons || []).forEach((el) => {
					if (el.type == "Promotional") {
						el.customer = normalized;
					} else {
						to_remove.push(el.coupon);
					}
				});
				this.customer = normalized;
				if (to_remove.length) {
					this.removeCoupon(to_remove);
				}
			}
			const cachedCoupons = this.loadCachedCoupons(normalized);
			if (cachedCoupons.length) {
				this.posa_coupons = cachedCoupons;
			}
			this.setActiveGiftCoupons();
		},
	},

	created: function () {
		this.$watch(
			() => this.uiStore.posProfile,
			(profile) => {
				if (profile) this.pos_profile = profile;
			},
			{ deep: true, immediate: true },
		);
		/*
		this.$nextTick(function () {
			this.eventBus.on("register_pos_profile", (data) => {
				this.pos_profile = data.pos_profile;
			});
		});
		*/
		this.eventBus.on("update_pos_coupons", (data) => {
			this.updatePosCoupons(data);
		});
		this.eventBus.on("set_pos_coupons", (data) => {
			this.posa_coupons = data;
		});
	},
};
</script>

<style scoped>
.pos-coupons-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
	background: var(--pos-surface-raised, #ffffff);
	border-radius: var(--pos-radius-md, 12px);
}

.pos-coupons-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: var(--pos-surface-muted, #f8fafc);
	border-bottom: 1px solid var(--pos-border-light, #e2e8f0);
}

.pos-coupons-body {
	flex: 1;
	min-height: 0;
}

.pos-coupon-card {
	border-color: var(--pos-border-light, #e2e8f0) !important;
	border-radius: var(--pos-radius-sm, 10px) !important;
	transition: border-color 0.15s ease, background-color 0.15s ease;
}

.pos-coupon-card--applied {
	border-color: var(--pos-primary, #2563eb) !important;
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 4%, var(--pos-surface-raised, #ffffff)) !important;
}

.add-coupon-btn,
.pos-coupons-back-btn {
	min-height: 40px;
}

@media (min-width: 600px) and (max-width: 1199px) {
	.add-coupon-btn,
	.pos-coupons-back-btn {
		min-height: 42px;
	}
}

@media (max-width: 599px) {
	.add-coupon-btn,
	.pos-coupons-back-btn {
		min-height: 44px;
	}
}
</style>
