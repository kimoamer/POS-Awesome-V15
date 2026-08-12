<template>
	<div class="pos-offers-container" :aria-busy="loading">
		<!-- Screen reader aria-live region -->
		<div class="sr-only" aria-live="polite">{{ announcement }}</div>

		<!-- Offers List -->
		<div class="pos-offers-body pa-3 overflow-y-auto">
			<div v-if="loading" class="pos-offers-loading pa-6 text-center text-muted">
				<v-progress-circular indeterminate color="primary" class="mb-2"></v-progress-circular>
				<div class="text-body-2">{{ __("Loading offers...") }}</div>
			</div>

			<div v-else-if="pos_offers.length === 0" class="pos-offers-empty pa-6 text-center text-muted">
				<v-icon size="40" class="mb-2">mdi-tag-off-outline</v-icon>
				<div class="text-body-2">{{ __("No offers available") }}</div>
			</div>

			<div v-else class="pos-offers-list">
				<v-card
					v-for="item in pos_offers"
					:key="getOfferId(item)"
					variant="outlined"
					class="pos-offer-card mb-3 pa-3"
					:class="{ 'pos-offer-card--applied': item.offer_applied }"
					:aria-expanded="item.description || item.offer == 'Give Product' ? 'true' : 'false'"
					:aria-controls="item.description || item.offer == 'Give Product' ? 'offer-details-' + getOfferId(item) : undefined"
				>
					<div class="pos-offer-card__header d-flex align-center justify-space-between gap-3">
						<div class="pos-offer-card__title-area">
							<bdi class="pos-offer-card__name font-weight-bold text-body-2">{{ item.name }}</bdi>
							<div class="pos-offer-card__meta d-flex align-center gap-1 mt-1">
								<v-chip size="x-small" variant="flat" color="blue-lighten-5" class="text-blue-darken-3">
									<bdi>{{ item.apply_on || __("Item") }}</bdi>
								</v-chip>
								<v-chip size="x-small" variant="flat" color="purple-lighten-5" class="text-purple-darken-3">
									<bdi>{{ item.offer || __("Discount") }}</bdi>
								</v-chip>
							</div>
						</div>

						<div class="pos-offer-card__action">
							<v-btn
								v-if="!item.offer_applied"
								color="success"
								size="small"
								class="pos-offer-action-btn"
								@click="applyOffer(item)"
								:disabled="
									(item.offer == 'Give Product' &&
										!item.give_item &&
										!item.replace_cheapest_item &&
										!item.replace_item) ||
									(item.offer == 'Grand Total' &&
										discount_percentage_offer_name &&
										discount_percentage_offer_name != item.name)
								"
							>
								{{ __("Apply") }}
							</v-btn>
							<v-btn
								v-else
								color="error"
								size="small"
								class="pos-offer-action-btn"
								@click="removeOffer(item)"
							>
								{{ __("Remove") }}
							</v-btn>
						</div>
					</div>

					<!-- Description / Give Item Details -->
					<div
						v-if="item.description || item.offer == 'Give Product'"
						:id="'offer-details-' + getOfferId(item)"
						class="pos-offer-card__details mt-2 pt-2 border-t"
					>
						<div v-if="item.description" class="posa-offer-description text-caption text-medium-emphasis mb-2">
							{{ item.description }}
						</div>
						<div v-if="item.offer == 'Give Product'" class="pos-offer-give-item">
							<div v-if="groupItemLoading[item.apply_item_group]" class="text-caption text-info d-flex align-center gap-1 my-1">
								<v-progress-circular indeterminate size="16" color="primary"></v-progress-circular>
								<span>{{ __("Loading group items...") }}</span>
							</div>
							<div v-else-if="groupItemError[item.apply_item_group]" class="group-item-error text-caption text-error d-flex align-center justify-space-between gap-1 my-1 pa-2 border rounded">
								<span>{{ groupItemError[item.apply_item_group] }}</span>
								<v-btn size="x-small" variant="text" color="primary" @click="fetchGroupItems(item.apply_item_group)">
									{{ __("Retry") }}
								</v-btn>
							</div>
							<v-autocomplete
								v-else
								v-model="item.give_item"
								:items="get_give_items(item)"
								item-title="item_name"
								item-value="item_code"
								variant="outlined"
								density="compact"
								color="primary"
								hide-details
								:label="frappe._('Give Item')"
								:disabled="
									item.apply_type != 'Item Group' ||
									item.replace_item ||
									item.replace_cheapest_item
								"
							></v-autocomplete>
						</div>
					</div>
				</v-card>
			</div>
		</div>
	</div>
</template>

<script>
import format from "../../../format";
import { useCustomersStore } from "../../../stores/customersStore";
import { useUIStore } from "../../../stores/uiStore";
import { useToastStore } from "../../../stores/toastStore";
import { storeToRefs } from "pinia";
const translate = (value) =>
	(typeof window !== "undefined" && (window.__ || window.frappe?._)
		? (window.__ || window.frappe._)(value)
		: value);
export default {
	inject: {
		eventBus: { default: null },
	},
	mixins: [format],
	setup() {
		const customersStore = useCustomersStore();
		const uiStore = useUIStore();
		const toastStore = useToastStore();
		const { selectedCustomer } = storeToRefs(customersStore);
		return { selectedCustomer, uiStore, toastStore };
	},
	data: () => ({
		loading: false,
		announcement: "",
		groupItemLoading: {},
		groupItemError: {},
		pos_profile: "",
		pos_offers: [],
		allItems: [],
		groupItemCache: {},
		busHandlers: {},
		discount_percentage_offer_name: null,
		itemsPerPage: 1000,
		expanded: [],
		singleExpand: true,
		items_headers: [
			{ title: translate("Name"), value: "name", align: "start" },
			{ title: translate("Apply On"), value: "apply_on", align: "start" },
			{ title: translate("Offer"), value: "offer", align: "start" },
			{ title: translate("Applied"), value: "offer_applied", align: "start" },
		],
	}),

	computed: {
		offersCount() {
			return this.pos_offers.length;
		},
		appliedOffersCount() {
			return this.pos_offers.filter((el) => !!el.offer_applied).length;
		},
		isRtl() {
			if (this.$vuetify?.locale?.isRTL !== undefined) {
				return this.$vuetify.locale.isRTL;
			}
			if (typeof window !== "undefined" && window.frappe?.utils?.is_rtl) {
				return window.frappe.utils.is_rtl();
			}
			if (typeof document !== "undefined") {
				return document.documentElement?.dir === "rtl";
			}
			return false;
		},
		browseBackIcon() {
			return this.isRtl ? "mdi-arrow-right" : "mdi-arrow-left";
		},
	},

	methods: {
		back_to_invoice() {
			this.uiStore.setActiveView("items");
		},
		async fetchGroupItems(group) {
			if (!group) return;
			this.groupItemLoading = { ...this.groupItemLoading, [group]: true };
			this.groupItemError = { ...this.groupItemError, [group]: null };
			try {
				const { message } = await frappe.call({
					method: "posawesome.posawesome.api.items.get_items",
					args: {
						pos_profile: JSON.stringify(this.pos_profile),
						item_group: group,
					},
				});

				const fullItems = message || [];

				this.groupItemCache[group] = fullItems.map((it) => ({
					item_code: it.item_code,
					item_name: it.item_name || it.item_code,
					rate: it.price_list_rate,
				}));

				const existing = new Set(this.allItems.map((it) => it.item_code));
				const newItems = fullItems.filter((it) => !existing.has(it.item_code));
				if (newItems.length) {
					this.allItems.push(...newItems);
					this.eventBus.emit("set_all_items", this.allItems);
				}

				this.forceUpdateItem();
			} catch (error) {
				console.error("Failed to fetch group items", error);
				this.groupItemError = {
					...this.groupItemError,
					[group]: error?.message || __("Failed to load group items"),
				};
			} finally {
				this.groupItemLoading = { ...this.groupItemLoading, [group]: false };
			}
		},
		forceUpdateItem() {
			let list_offers = [];
			list_offers = [...this.pos_offers];
			this.pos_offers = list_offers;
		},
		applyOffer(item) {
			item.offer_applied = true;
			this.announcement = `${item.name || __("Offer")} ${__("applied")}`;
			this.forceUpdateItem();
		},
		removeOffer(item) {
			item.offer_applied = false;
			this.announcement = `${item.name || __("Offer")} ${__("removed")}`;
			this.forceUpdateItem();
		},
		normalizeOfferRowId(value) {
			return String(value ?? "").trim();
		},
		getOfferId(offer) {
			return this.normalizeOfferRowId(offer?.row_id || offer?.name);
		},
		normalizeOfferIdentity(offer) {
			if (!offer || typeof offer !== "object") return offer;
			const rowId = this.getOfferId(offer);
			if (rowId) {
				offer.row_id = rowId;
			}
			return offer;
		},
		makeid(length) {
			let result = "";
			const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
			const charactersLength = characters.length;
			for (var i = 0; i < length; i++) {
				result += characters.charAt(Math.floor(Math.random() * charactersLength));
			}
			return result;
		},
		updatePosOffers(offers) {
			const incoming = (Array.isArray(offers) ? offers : []).map((offer) =>
				this.normalizeOfferIdentity({ ...offer }),
			);
			const toRemove = [];
			this.pos_offers.forEach((pos_offer) => {
				const offer = incoming.find((offer) => this.getOfferId(offer) === this.getOfferId(pos_offer));
				if (!offer) {
					toRemove.push(this.getOfferId(pos_offer));
				}
			});
			this.removeOffers(toRemove);
			incoming.forEach((offer) => {
				const pos_offer = this.pos_offers.find(
					(pos_offer) => this.getOfferId(offer) === this.getOfferId(pos_offer),
				);
				if (pos_offer) {
					pos_offer.items = offer.items;
					if (
						offer.apply_on == "Item Group" &&
						offer.apply_type == "Item Group" &&
						offer.replace_cheapest_item
					) {
						pos_offer.give_item = offer.give_item;
						pos_offer.apply_item_code = offer.apply_item_code;
					}
				} else {
					const newOffer = { ...offer };
					if (!offer.row_id) {
						newOffer.row_id = this.getOfferId(offer) || this.makeid(20);
					}
					if (offer.apply_type == "Item Code") {
						if (offer.replace_item) {
							newOffer.give_item = offer.item || offer.apply_item_code || null;
						} else {
							newOffer.give_item = offer.apply_item_code || null;
						}
					}
					if (offer.offer_applied) {
						newOffer.offer_applied = !!offer.offer_applied;
					} else {
						if (
							offer.apply_type == "Item Group" &&
							offer.offer == "Give Product" &&
							!offer.replace_cheapest_item &&
							!offer.replace_item
						) {
							newOffer.offer_applied = false;
						} else if (offer.offer === "Grand Total" && this.discount_percentage_offer_name) {
							newOffer.offer_applied = false;
						} else {
							newOffer.offer_applied = !!offer.auto;
						}
					}
					if (newOffer.offer == "Give Product" && !newOffer.give_item) {
						const giveItems = this.get_give_items(newOffer);
						if (giveItems.length) {
							newOffer.give_item = giveItems[0].item_code;
						}
					}
					this.pos_offers.push(newOffer);
					this.toastStore.show({
						title: __("New Offer Available"),
						color: "warning",
					});
				}
			});
		},
		removeOffers(offers_id_list) {
			const normalized = new Set((offers_id_list || []).map((id) => this.normalizeOfferRowId(id)));
			this.pos_offers = this.pos_offers.filter((offer) => !normalized.has(this.getOfferId(offer)));
		},
		handelOffers() {
			const applyedOffers = this.pos_offers.filter((offer) => offer.offer_applied);
			this.eventBus.emit("update_invoice_offers", applyedOffers);
		},
		get_give_items(offer) {
			if (offer.apply_type === "Item Code") {
				return [
					{
						item_code: offer.apply_item_code,
						item_name: offer.apply_item_code,
					},
				];
			} else if (offer.apply_type === "Item Group") {
				const group = offer.apply_item_group;
				if (!this.groupItemCache[group]) {
					this.fetchGroupItems(group);
					return [];
				}
				let filtered_items = this.groupItemCache[group];
				if (offer.less_then > 0) {
					filtered_items = filtered_items.filter((item) => item.rate < offer.less_then);
				}
				const unique = [];
				const seen = new Set();
				filtered_items.forEach((item) => {
					if (!seen.has(item.item_code)) {
						seen.add(item.item_code);
						unique.push({
							item_code: item.item_code,
							item_name: item.item_name || item.item_code,
						});
					}
				});
				return unique;
			}
			return [];
		},
		updateCounters() {
			// update store
			this.uiStore.setOfferCounts(this.offersCount, this.appliedOffersCount);
		},
		updatePosCoupuns() {
			const applyedOffers = this.pos_offers.filter(
				(offer) => offer.offer_applied && offer.coupon_based,
			);
			this.eventBus.emit("update_pos_coupons", applyedOffers);
		},
	},

	watch: {
		pos_offers: {
			deep: true,
			handler() {
				this.handelOffers();
				this.updateCounters();
				this.updatePosCoupuns();
			},
		},
		selectedCustomer(newCustomer, oldCustomer) {
			if (newCustomer === oldCustomer) {
				return;
			}
			this.pos_offers = [];
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
		this.$watch(
			() => this.uiStore.applicableOffers,
			(offers) => {
				if (Array.isArray(offers)) {
					this.updatePosOffers(offers);
				}
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
		this.busHandlers.updatePosOffers = (data) => {
			this.updatePosOffers(data);
		};
		this.busHandlers.updateDiscountOfferName = (data) => {
			this.discount_percentage_offer_name = data.value;
		};
		this.busHandlers.setAllItems = (data) => {
			this.allItems = data;
		};
		this.eventBus?.on?.("update_pos_offers", this.busHandlers.updatePosOffers);
		this.eventBus?.on?.(
			"update_discount_percentage_offer_name",
			this.busHandlers.updateDiscountOfferName,
		);
		this.eventBus?.on?.("set_all_items", this.busHandlers.setAllItems);
	},
	beforeUnmount() {
		this.eventBus?.off?.("update_pos_offers", this.busHandlers.updatePosOffers);
		this.eventBus?.off?.(
			"update_discount_percentage_offer_name",
			this.busHandlers.updateDiscountOfferName,
		);
		this.eventBus?.off?.("set_all_items", this.busHandlers.setAllItems);
	},
};
</script>

<style scoped>
.pos-offers-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
	background: var(--pos-surface-raised, #ffffff);
	border-radius: var(--pos-radius-md, 12px);
}

.pos-offers-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: var(--pos-surface-muted, #f8fafc);
	border-bottom: 1px solid var(--pos-border-light, #e2e8f0);
}

.pos-offers-body {
	flex: 1;
	min-height: 0;
}

.pos-offer-card {
	border-color: var(--pos-border-light, #e2e8f0) !important;
	border-radius: var(--pos-radius-sm, 10px) !important;
	transition: border-color 0.15s ease, background-color 0.15s ease;
}

.pos-offer-card--applied {
	border-color: var(--pos-primary, #2563eb) !important;
	background: color-mix(in srgb, var(--pos-primary, #2563eb) 4%, var(--pos-surface-raised, #ffffff)) !important;
}

.pos-offer-action-btn,
.pos-offers-back-btn {
	min-height: 40px;
}

@media (min-width: 600px) and (max-width: 1199px) {
	.pos-offer-action-btn,
	.pos-offers-back-btn {
		min-height: 42px;
	}
}

@media (max-width: 599px) {
	.pos-offer-action-btn,
	.pos-offers-back-btn {
		min-height: 44px;
	}

	.pos-offer-card__header {
		flex-direction: column;
		align-items: stretch !important;
	}

	.pos-offer-action-btn {
		width: 100% !important;
	}
}

.posa-offer-description {
	white-space: pre-line;
}

.sr-only {
	position: absolute;
	width: 1px;
	height: 1px;
	padding: 0;
	margin: -1px;
	overflow: hidden;
	clip: rect(0, 0, 0, 0);
	white-space: nowrap;
	border: 0;
}
</style>
