<template>
	<div
		class="pos-main-container dynamic-container"
		:class="rtlClasses"
		:style="[responsiveStyles, layoutStyleOverrides, rtlStyles]"
	>
		<Drafts></Drafts>
		<InvoiceManagement></InvoiceManagement>
		<SalesOrders></SalesOrders>
		<Returns></Returns>
		<NewAddress></NewAddress>
		<MpesaPayments></MpesaPayments>
		<Variants></Variants>
		<OpeningDialog
			v-if="dialog"
			:dialog="dialog"
			@close="closeOpeningDialog"
			@register="handleRegisterPosData"
		></OpeningDialog>
		<v-dialog
			v-if="usePaymentDialog"
			v-model="paymentDialogOpen"
			:retain-focus="false"
			content-class="posa-payment-dialog-overlay"
			:width="1120"
			:max-width="1120"
			scroll-strategy="block"
			scrim="rgba(15, 23, 42, 0.55)"
			class="payment-dialog"
			@update:model-value="handlePaymentDialogUpdate"
			@after-leave="handlePaymentDialogAfterLeave"
		>
			<Payments dialog-mode :viewport-mode="paymentViewportMode" />
		</v-dialog>
		<div
			v-show="!dialog"
			class="pos-workspace dynamic-main-row"
			:class="{
				'pos-workspace--compact': useCompactPosSwitcher,
				'pos-workspace--phone': isPhone,
				'pos-workspace--rtl': isRtl,
				'pos-workspace--payment-active': activeView === 'payment' && !usePaymentDialog,
			}"
		>
			<section
				v-show="
					(!useCompactPosSwitcher || compactPanel === 'selector') &&
					['items', 'offers', 'coupons'].includes(activeView)
				"
				class="pos pos-pane pos-products-pane dynamic-col dynamic-col--selector"
				data-pos-region="products"
			>
				<ItemsSelector context="pos" />
			</section>
			<section
				v-if="activeView === 'payment' && !usePaymentDialog"
				class="pos pos-pane pos-products-pane dynamic-col dynamic-col--selector pos-payment-pane--fullscreen"
				data-pos-region="payment"
			>
				<Payments :viewport-mode="paymentViewportMode"></Payments>
			</section>

			<section
				v-show="(!useCompactPosSwitcher || compactPanel === 'invoice') && activeView !== 'payment'"
				class="pos pos-pane pos-cart-pane dynamic-col dynamic-col--invoice"
				:class="{ 'pos-cart-pane--dedicated': useCompactPosSwitcher }"
				data-pos-region="cart"
			>
				<div v-if="useCompactPosSwitcher" class="compact-cart-header">
					<button
						type="button"
						class="compact-cart-header__back"
						:aria-label="__('Back to products')"
						@click="setSelectorView('items')"
					>
						<v-icon :icon="isRtl ? 'mdi-arrow-right' : 'mdi-arrow-left'" size="18" />
					</button>
					<div class="compact-cart-header__title">
						<strong>{{ __("Cart") }}</strong>
						<span>{{ itemsCount }} {{ itemsCount === 1 ? __("item") : __("items") }}</span>
					</div>
				</div>
				<Invoice ref="invoicePanel"></Invoice>
			</section>
		</div>
		<div v-if="showBottomDock" ref="mobileDock" class="mobile-pos-stack">
			<div class="mobile-sale-dock">
				<div class="mobile-sale-dock__copy">
					<span class="mobile-sale-dock__eyebrow">{{ __("Active sale") }}</span>
					<strong class="mobile-sale-dock__amount">{{ formattedCartTotal }}</strong>
					<div class="mobile-sale-dock__meta">
						<span>{{ cartMetaLabel }}</span>
						<span>{{ formattedDiscountTotal }}</span>
					</div>
				</div>
				<div class="mobile-sale-dock__field">
					<v-text-field
						v-if="!posProfile?.posa_use_percentage_discount"
						ref="additionalDiscountField"
						v-model="additionalDiscountDisplay"
						@update:model-value="handleAdditionalDiscountUpdate"
						@focus="handleAdditionalDiscountFocus"
						@blur="handleAdditionalDiscountBlur"
						:label="__('Additional Discount')"
						prepend-inner-icon="mdi-cash-minus"
						variant="solo"
						density="compact"
						color="warning"
						:prefix="getCurrencySymbol(posProfile?.currency)"
						:disabled="
							!posProfile?.posa_allow_user_to_edit_additional_discount ||
							!!discountPercentageOfferName
						"
						hide-details
					/>
					<v-text-field
						v-else
						ref="additionalDiscountField"
						v-model="additionalDiscountPercentageDisplay"
						@update:model-value="handleAdditionalDiscountPercentageUpdate"
						@focus="handleAdditionalDiscountPercentageFocus"
						@blur="handleAdditionalDiscountPercentageBlur"
						@change="commitAdditionalDiscountPercentage"
						:label="__('Additional Discount %')"
						suffix="%"
						prepend-inner-icon="mdi-percent"
						variant="solo"
						density="compact"
						color="warning"
						:disabled="
							!posProfile?.posa_allow_user_to_edit_additional_discount ||
							!!discountPercentageOfferName
						"
						hide-details
					/>
				</div>
			</div>
			<div class="mobile-pos-dock">
				<button
					type="button"
					class="mobile-pos-dock__item"
					:class="{ 'mobile-pos-dock__item--active': isSelectorViewActive('items') }"
					@click="setSelectorView('items')"
				>
					<v-icon icon="mdi-magnify" size="20" />
					<span>{{ __("Browse") }}</span>
				</button>
				<button
					type="button"
					class="mobile-pos-dock__item"
					:class="{ 'mobile-pos-dock__item--active': activeView === 'offers' }"
					@click="setSelectorView('offers')"
				>
					<v-icon icon="mdi-tag-outline" size="20" />
					<span>{{ __("Offers") }}</span>
				</button>
				<button
					type="button"
					class="mobile-pos-dock__item mobile-pos-dock__item--cart"
					:class="{ 'mobile-pos-dock__item--active': compactPanel === 'invoice' }"
					@click="showInvoicePanel"
				>
					<span class="mobile-pos-dock__pill">{{ itemsCount }}</span>
					<v-icon icon="mdi-cart-outline" size="22" />
					<span>{{ __("Cart") }}</span>
				</button>
				<button
					type="button"
					class="mobile-pos-dock__item"
					:class="{ 'mobile-pos-dock__item--active': activeView === 'coupons' }"
					@click="setSelectorView('coupons')"
				>
					<v-icon icon="mdi-ticket-percent-outline" size="20" />
					<span>{{ __("Coupons") }}</span>
				</button>
				<button
					type="button"
					class="mobile-pos-dock__item mobile-pos-dock__item--pay"
					:class="{ 'mobile-pos-dock__item--active': activeView === 'payment' }"
					@click="triggerInvoicePay"
				>
					<v-icon icon="mdi-credit-card-outline" size="20" />
					<span>{{ __("Pay") }}</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import ItemsSelector from "../items/ItemsSelector.vue";
import Invoice from "../Invoice.vue";
import OpeningDialog from "../shift/OpeningDialog.vue";
import Payments from "../Payments.vue";
import Drafts from "../flows/Drafts.vue";
import InvoiceManagement from "../flows/InvoiceManagement.vue";
import SalesOrders from "../flows/SalesOrders.vue";
import NewAddress from "../customer/NewAddress.vue";
import Variants from "../items/Variants.vue";
import Returns from "../flows/Returns.vue";
import MpesaPayments from "../payments/Mpesa-Payments.vue";
import { inject, ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from "vue";
import { usePosShift } from "../../../composables/pos/shared/usePosShift";
import { useOffers } from "../../../composables/pos/shared/useOffers";
// Import the cache cleanup function
import { clearExpiredCustomerBalances } from "../../../../offline/index";
import { useResponsive } from "../../../composables/core/useResponsive";
import { useRtl } from "../../../composables/core/useRtl";
import { useUIStore } from "../../../stores/uiStore.js";
import { useInvoiceStore } from "../../../stores/invoiceStore.js";
import { useItemsStore } from "../../../stores/itemsStore.js";
import { storeToRefs } from "pinia";
import { useCustomerDisplayPublisher } from "../../../composables/pos/shared/useCustomerDisplayPublisher";

export default {
	setup() {
		const eventBus = inject("eventBus");
		const dialog = ref(false);
		const invoicePanel = ref(null);
		const additionalDiscountField = ref(null);
		const mobileDock = ref(null);
		const responsive = useResponsive();
		const rtl = useRtl();
		const shift = usePosShift(() => {
			dialog.value = true;
		});
		const offers = useOffers();
		const uiStore = useUIStore();
		const invoiceStore = useInvoiceStore();
		const itemsStore = useItemsStore();
		const __ = window.__;
		const { activeView, posProfile, paymentDialogOpen } = storeToRefs(uiStore);
		const {
			invoiceDoc,
			itemsCount,
			totalQty,
			grossTotal,
			discountTotal,
			additionalDiscount,
			additionalDiscountPercentage,
		} = storeToRefs(invoiceStore);
		const usePaymentDialog = computed(() => responsive.windowWidth.value >= 1200);
		const paymentViewportMode = computed(() => {
			const width = responsive.windowWidth.value;
			if (width < 600) return "phone";
			if (width < 900) return "tablet-portrait";
			if (width < 1200) return "tablet-landscape";
			return "desktop";
		});
		const useCompactPosSwitcher = computed(() => responsive.windowWidth.value < 1200);
		const compactPanel = ref("selector");
		const isPhone = computed(() => responsive.isPhone.value);
		const showBottomDock = computed(
			() => !dialog.value && responsive.windowWidth.value < 1200 && activeView.value !== "payment",
		);
		const bottomDockHeight = ref(0);
		let mobileDockObserver = null;
		const isEditingAdditionalDiscount = ref(false);
		const isEditingAdditionalDiscountPercentage = ref(false);
		const invoiceTotal = computed(() => {
			const liveSubtotal = Number(invoicePanel.value?.subtotal);
			if (Number.isFinite(liveSubtotal)) {
				return liveSubtotal;
			}

			const doc = invoiceDoc.value || {};
			const fallbackTotal = Number(grossTotal.value || 0);
			const rawValue = doc.rounded_total ?? doc.grand_total ?? doc.total ?? fallbackTotal;
			const numericValue = Number(rawValue);
			return Number.isFinite(numericValue) ? numericValue : fallbackTotal;
		});
		const activeCurrency = computed(() => invoiceDoc.value?.currency || posProfile.value?.currency || "");
		const formatCompactNumber = (value) =>
			new Intl.NumberFormat(undefined, {
				maximumFractionDigits: value % 1 === 0 ? 0 : 2,
			}).format(Number(value || 0));
		const getCurrencySymbol = (currency) => {
			const resolver = window.get_currency_symbol || globalThis.get_currency_symbol;
			if (typeof resolver === "function") {
				return resolver(currency || activeCurrency.value || "") || "";
			}
			return currency ? `${currency} ` : "";
		};
		const formattedCartTotal = computed(() => {
			const symbol = getCurrencySymbol(activeCurrency.value);
			return `${symbol}${formatCompactNumber(invoiceTotal.value)}`.trim();
		});
		const formattedDiscountTotal = computed(() => {
			const symbol = getCurrencySymbol(activeCurrency.value);
			return `${symbol}${formatCompactNumber(discountTotal.value || 0)} ${__("discount")}`.trim();
		});
		const cartMetaLabel = computed(() => {
			const qty = formatCompactNumber(totalQty.value || 0);
			const itemCount = formatCompactNumber(itemsCount.value || 0);
			return `${itemCount} ${__("lines")} | ${qty} ${__("qty")}`;
		});

		const discountPercentageOfferName = computed(
			() => invoicePanel.value?.discount_percentage_offer_name || null,
		);
		const showUnsignedReturnDiscount = computed(
			() =>
				!!invoicePanel.value?.return_discount_meta && !posProfile.value?.posa_use_percentage_discount,
		);
		const normalizeDiscountDisplay = (value) => {
			if (value === 0 || value === "0") {
				return "";
			}
			return value;
		};
		const normalizeAdditionalDiscountDisplay = (value) => {
			if (value === 0 || value === "0") {
				return "";
			}
			if (showUnsignedReturnDiscount.value) {
				const proratedValue = Number(invoicePanel.value?.return_discount_meta?.prorated_discount);
				if (Number.isFinite(proratedValue)) {
					return Math.abs(proratedValue);
				}
				const numericValue = Number(value);
				if (Number.isFinite(numericValue)) {
					return Math.abs(numericValue);
				}
			}
			return value;
		};
		const normalizeAdditionalDiscountInput = (value) => {
			if (showUnsignedReturnDiscount.value) {
				const numericValue = Number(value);
				if (Number.isFinite(numericValue)) {
					const originalStoredValue = Number(additionalDiscount.value);
					const sign = Math.sign(
						Number.isFinite(originalStoredValue) && originalStoredValue !== 0
							? originalStoredValue
							: -1,
					);
					return sign * Math.abs(numericValue);
				}
			}
			return value;
		};
		const additionalDiscountDisplay = ref(normalizeAdditionalDiscountDisplay(additionalDiscount.value));
		const additionalDiscountPercentageDisplay = ref(
			normalizeDiscountDisplay(additionalDiscountPercentage.value),
		);

		watch(
			() => [
				additionalDiscount.value,
				invoicePanel.value?.return_discount_meta?.prorated_discount,
				posProfile.value?.posa_use_percentage_discount,
			],
			([value]) => {
				if (!isEditingAdditionalDiscount.value) {
					additionalDiscountDisplay.value = normalizeAdditionalDiscountDisplay(value);
				}
			},
		);

		watch(additionalDiscountPercentage, (value) => {
			if (!isEditingAdditionalDiscountPercentage.value) {
				additionalDiscountPercentageDisplay.value = normalizeDiscountDisplay(value);
			}
		});

		const focusItemSearchField = () => {
			nextTick(() => {
				uiStore.triggerItemSearchFocus();
				eventBus?.emit?.("focus_item_search");
			});
		};

		const handlePaymentDialogUpdate = (value) => {
			if (value || !usePaymentDialog.value) {
				return;
			}
			uiStore.closePaymentDialog();
		};

		const handlePaymentDialogAfterLeave = () => {
			if (!usePaymentDialog.value) {
				return;
			}
			focusItemSearchField();
		};

		const setCompactPanel = (panel) => {
			compactPanel.value = panel;
			if (panel === "selector" && activeView.value === "items") {
				focusItemSearchField();
			}
		};
		const setSelectorView = (view) => {
			compactPanel.value = "selector";
			uiStore.setActiveView(view);
			if (view === "items") {
				focusItemSearchField();
			}
		};
		const showInvoicePanel = () => {
			compactPanel.value = "invoice";
			if (activeView.value === "payment" && !usePaymentDialog.value) {
				uiStore.setActiveView("items");
			}
		};
		const showPaymentPanel = () => {
			compactPanel.value = "selector";
			if (usePaymentDialog.value) {
				uiStore.openPaymentDialog();
				uiStore.setActiveView("items");
				return;
			}
			uiStore.setActiveView("payment");
		};
		const triggerInvoicePay = () => {
			if (typeof invoicePanel.value?.handleShowPaymentRequest === "function") {
				invoicePanel.value.handleShowPaymentRequest();
				return;
			}
			if (typeof invoicePanel.value?.show_payment === "function") {
				invoicePanel.value.show_payment();
				return;
			}
			showPaymentPanel();
		};
		const isSelectorViewActive = (view) => compactPanel.value === "selector" && activeView.value === view;
		const getFallbackBottomSpace = () => {
			const rawValue = responsive.responsiveStyles.value["--bottom-safe-space"];
			const parsed = Number.parseFloat(String(rawValue || "0"));
			return Number.isFinite(parsed) ? parsed : 24;
		};
		const updateBottomDockHeight = () => {
			const dockElement = mobileDock.value;
			if (!showBottomDock.value || !dockElement) {
				bottomDockHeight.value = 0;
				return;
			}
			bottomDockHeight.value = dockElement.offsetHeight + 20;
		};
		const layoutStyleOverrides = computed(() => {
			if (!showBottomDock.value) {
				return {
					"--bottom-safe-space": "0px",
				};
			}

			const fallbackBottomSpace = getFallbackBottomSpace();
			const effectiveBottomSpace = Math.max(bottomDockHeight.value, fallbackBottomSpace);
			return {
				"--bottom-safe-space": `${effectiveBottomSpace}px`,
			};
		});
		const handleAdditionalDiscountUpdate = (value) => {
			invoiceStore.setAdditionalDiscount(normalizeAdditionalDiscountInput(value));
		};
		const handleAdditionalDiscountFocus = () => {
			isEditingAdditionalDiscount.value = true;
		};
		const handleAdditionalDiscountBlur = () => {
			isEditingAdditionalDiscount.value = false;
		};
		const handleAdditionalDiscountPercentageUpdate = (value) => {
			invoiceStore.setAdditionalDiscountPercentage(value);
		};
		const handleAdditionalDiscountPercentageFocus = () => {
			isEditingAdditionalDiscountPercentage.value = true;
		};
		const commitAdditionalDiscountPercentage = () => {
			invoicePanel.value?.update_discount_umount?.();
		};
		const handleAdditionalDiscountPercentageBlur = () => {
			isEditingAdditionalDiscountPercentage.value = false;
			commitAdditionalDiscountPercentage();
		};
		const focusAdditionalDiscountField = () => {
			const field = additionalDiscountField.value;
			field?.focus?.();
			field?.$el?.querySelector?.("input")?.focus?.();
		};
		const handlePosTabFocus = (event) => {
			if (event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey) {
				return;
			}

			event.preventDefault();
			focusItemSearchField();
		};

		useCustomerDisplayPublisher({
			posProfile,
			eventBus,
		});

		onMounted(() => {
			document.addEventListener("keydown", handlePosTabFocus, true);
			if (typeof window !== "undefined" && "ResizeObserver" in window) {
				mobileDockObserver = new ResizeObserver(() => {
					updateBottomDockHeight();
				});
			}
			if (eventBus) {
				eventBus.on("submit_closing_pos", (data) => {
					shift.submit_closing_pos(data);
				});
				eventBus.on("focus_additional_discount", focusAdditionalDiscountField);
				eventBus.on("set_compact_panel", setCompactPanel);
			}
			nextTick(() => {
				updateBottomDockHeight();
				if (mobileDockObserver && mobileDock.value) {
					mobileDockObserver.observe(mobileDock.value);
				}
			});
		});

		onBeforeUnmount(() => {
			document.removeEventListener("keydown", handlePosTabFocus, true);
			if (mobileDockObserver) {
				mobileDockObserver.disconnect();
				mobileDockObserver = null;
			}
			if (eventBus) {
				eventBus.off("submit_closing_pos");
				eventBus.off("focus_additional_discount", focusAdditionalDiscountField);
				eventBus.off("set_compact_panel", setCompactPanel);
			}
		});

		watch(usePaymentDialog, (enabled) => {
			if (enabled && activeView.value === "payment") {
				uiStore.openPaymentDialog();
				uiStore.setActiveView("items");
				return;
			}

			if (!enabled && paymentDialogOpen.value) {
				uiStore.closePaymentDialog();
				uiStore.setActiveView("payment");
			}
		});

		watch(activeView, (view) => {
			if (!useCompactPosSwitcher.value) {
				return;
			}

			if (["items", "offers", "coupons", "payment"].includes(view)) {
				compactPanel.value = "selector";
			}
		});

		watch(useCompactPosSwitcher, (enabled) => {
			if (!enabled) {
				compactPanel.value = "selector";
				return;
			}

			if (["offers", "coupons", "payment"].includes(activeView.value)) {
				compactPanel.value = "selector";
			}
		});

		watch(
			[showBottomDock, () => responsive.windowWidth.value, () => responsive.windowHeight.value],
			() => {
				nextTick(() => {
					if (mobileDockObserver) {
						mobileDockObserver.disconnect();
						if (showBottomDock.value && mobileDock.value) {
							mobileDockObserver.observe(mobileDock.value);
						}
					}
					updateBottomDockHeight();
				});
			},
			{ immediate: true },
		);

		return {
			...responsive,
			...rtl,
			...shift,
			...offers,
			uiStore,
			invoiceStore,
			itemsStore,
			__,
			invoiceDoc,
			itemsCount,
			totalQty,
			formattedCartTotal,
			formattedDiscountTotal,
			cartMetaLabel,
			posProfile,
			additionalDiscountField,
			additionalDiscountDisplay,
			additionalDiscountPercentageDisplay,
			activeView,
			paymentDialogOpen,
			isPhone,
			usePaymentDialog,
			paymentViewportMode,
			useCompactPosSwitcher,
			showBottomDock,
			layoutStyleOverrides,
			compactPanel,
			mobileDock,
			setCompactPanel,
			setSelectorView,
			showInvoicePanel,
			showPaymentPanel,
			triggerInvoicePay,
			isSelectorViewActive,
			handleAdditionalDiscountUpdate,
			handleAdditionalDiscountFocus,
			handleAdditionalDiscountBlur,
			handleAdditionalDiscountPercentageUpdate,
			handleAdditionalDiscountPercentageFocus,
			handleAdditionalDiscountPercentageBlur,
			commitAdditionalDiscountPercentage,
			handlePaymentDialogUpdate,
			handlePaymentDialogAfterLeave,
			discountPercentageOfferName,
			getCurrencySymbol,
			invoicePanel,
			eventBus,
			dialog,
		};
	},
	data: function () {
		return {};
	},

	components: {
		ItemsSelector,
		Invoice,
		OpeningDialog,
		Payments,
		Drafts,
		InvoiceManagement,

		Returns,
		NewAddress,
		Variants,
		MpesaPayments,
		SalesOrders,
	},

	methods: {
		create_opening_voucher() {
			this.dialog = true;
		},
		get_pos_setting() {
			frappe.db.get_doc("POS Settings", undefined).then((_doc) => {
				// Update store directly instead of emitting event
				// If Payments.vue or others need this, they should watch uiStore.posSettings
				// For now, we assume uiStore.setStockSettings or similar is sufficient,
				// or we add a new generic settings store.
				// However, the original code used eventBus.emit("set_pos_settings", doc);
				// We'll attach it to uiStore if a suitable method exists, or just log for now as
				// clean separation implies components fetch what they need or use a centralized config store.
				// Assuming uiStore handles global config:
				// this.uiStore.setPosSettings(doc); // We might need to implement this if it doesn't exist
			});
		},
		// handleAddItem removed as ItemsSelector handles pos addition internally
		handleRegisterPosData(data) {
			this.pos_profile = data.pos_profile;
			this.get_offers(this.pos_profile.name, this.pos_profile);
			this.pos_opening_shift = data.pos_opening_shift;

			// Update Store
			this.uiStore.setRegisterData(data);
		},
		closeOpeningDialog() {
			this.dialog = false;
		},
	},

	mounted: function () {
		this.$nextTick(function () {
			this.check_opening_entry();
			this.get_pos_setting();

			// Watch store for updates
			this.$watch(
				() => this.uiStore.posProfile,
				(newProfile) => {
					if (newProfile && newProfile.name) {
						this.pos_profile = newProfile;
						this.get_offers(newProfile.name, newProfile);
					}
				},
				{ deep: true, immediate: true },
			);
		});
	},
	// In the created() or mounted() lifecycle hook
	created() {
		// Clean up expired customer balance cache on POS load
		clearExpiredCustomerBalances();
	},
};
</script>

<style scoped>
.payment-dialog :deep(.v-overlay__content) {
	max-height: calc(100dvh - 24px);
}

.dynamic-container {
	--pos-page-gap: var(--pos-workspace-padding, 10px);
	width: 100%;
	height: 100%;
	min-height: 0;
	min-width: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	padding-block: 0;
	padding-inline: var(--pos-page-gap);
	box-sizing: border-box;
}

.dynamic-main-row {
	flex: 1 1 auto;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	margin: 0;
	padding: 0;
}

.pos-workspace {
	display: grid;
	grid-template-areas: "products cart";
	grid-template-columns: minmax(0, 1fr) clamp(400px, 40%, 620px);
	gap: 0;
	padding: 0;
	overflow: hidden;
	isolation: isolate;
	box-sizing: border-box;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-workspace, 14px);
	background: var(--pos-surface-raised, #ffffff);
	box-shadow: none;
}

.pos-workspace--rtl:not(.pos-workspace--compact) {
	grid-template-areas: "cart products";
	grid-template-columns: clamp(400px, 40%, 620px) minmax(0, 1fr);
}

.pos-workspace--compact {
	display: flex;
	flex-direction: column;
}

.dynamic-col {
	padding: 0;
	margin: 0;
}

.pos-pane {
	display: flex;
	flex-direction: column;
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	padding: var(--pos-pane-padding, 10px);
	overflow: hidden;
	box-sizing: border-box;
	background: transparent;
}

.pos-products-pane {
	grid-area: products;
}

.pos-cart-pane {
	grid-area: cart;
	border-inline-start: 1px solid var(--pos-border-light);
}

.pos-workspace--rtl:not(.pos-workspace--compact) .pos-cart-pane {
	border-inline-start: 0;
	border-inline-end: 1px solid var(--pos-border-light);
}

.pos-pane > :deep(*) {
	flex: 1 1 auto;
	min-width: 0;
	min-height: 0;
}

.pos-workspace--compact .pos-pane {
	height: 100%;
	border-inline: 0;
}

.pos-cart-pane--dedicated {
	gap: var(--pos-section-gap, 8px);
}

.compact-cart-header {
	display: flex;
	align-items: center;
	gap: var(--pos-control-gap, 6px);
	flex: 0 0 auto;
	min-height: 44px;
	min-width: 0;
	padding: 0;
	border-block-end: 1px solid var(--pos-border-light);
	background: transparent;
}

.compact-cart-header__back {
	inline-size: 44px;
	block-size: 44px;
	min-inline-size: 44px;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-control, 8px);
	background: var(--pos-surface-raised, #ffffff);
	color: var(--pos-text-primary);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
}

.compact-cart-header__back:hover,
.compact-cart-header__back:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary) 36%, var(--pos-border-light));
	background: color-mix(in srgb, var(--pos-primary-container) 62%, var(--pos-surface-raised));
	color: var(--pos-primary);
	outline: none;
}

.compact-cart-header__title {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
	flex: 1 1 auto;
	min-width: 0;
	font-size: var(--pos-font-body, 13px);
	color: var(--pos-text-primary);
}

.compact-cart-header__title strong,
.compact-cart-header__title span {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.compact-cart-header__title strong {
	font-size: var(--pos-font-section-title, 15px);
	font-weight: 760;
}

.compact-cart-header__title span {
	flex: 0 0 auto;
	font-size: var(--pos-font-meta, 11px);
	font-weight: 750;
	color: var(--pos-primary);
}

.pos-products-pane :deep(.items-selector-shell),
.pos-cart-pane :deep(.invoice-shell) {
	width: 100%;
	height: 100%;
	min-width: 0;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
}

.pos-products-pane :deep(.selection-card),
.pos-cart-pane :deep(.invoice-main-card) {
	flex: 1 1 auto;
	width: 100%;
	height: 100% !important;
	max-height: 100% !important;
	min-height: 0 !important;
	margin-top: 0 !important;
	resize: none !important;
	overflow: hidden !important;
	border: 0 !important;
	border-radius: 0 !important;
	background: transparent !important;
	box-shadow: none !important;
}

.pos-cart-pane--dedicated > .compact-cart-header {
	flex: 0 0 auto;
}

.pos-cart-pane--dedicated > :deep(.invoice-shell) {
	flex: 1 1 auto;
}

.pos-payment-pane--fullscreen {
	flex: 1 1 100% !important;
	width: 100% !important;
	max-width: 100% !important;
	height: 100% !important;
	margin: 0 !important;
	padding: 0 !important;
}

.pos-workspace--payment-active {
	border: 0 !important;
	border-radius: 0 !important;
	padding: 0 !important;
	background: transparent !important;
}

.pos-workspace--payment-active .pos-payment-pane--fullscreen {
	border: 0 !important;
	border-radius: 0 !important;
	padding: 0 !important;
}

.mobile-pos-stack {
	position: fixed;
	left: max(10px, env(safe-area-inset-left));
	right: max(10px, env(safe-area-inset-right));
	bottom: max(10px, env(safe-area-inset-bottom));
	display: flex;
	flex-direction: column;
	gap: 10px;
	z-index: 20;
}

.mobile-sale-dock,
.mobile-pos-dock {
	padding: 10px;
	border-radius: 24px;
	background: color-mix(in srgb, var(--pos-card-bg) 88%, transparent);
	backdrop-filter: blur(18px);
	box-shadow: 0 18px 38px var(--pos-shadow);
	border: 1px solid var(--pos-border);
}

.mobile-sale-dock {
	display: grid;
	grid-template-columns: minmax(0, 1.2fr) minmax(220px, 0.8fr);
	gap: 12px;
	align-items: center;
}

.mobile-sale-dock__copy {
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
}

.mobile-sale-dock__eyebrow {
	font-size: 0.72rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: var(--pos-text-secondary);
}

.mobile-sale-dock__amount {
	font-size: clamp(1.05rem, 2vw, 1.5rem);
	line-height: 1.1;
	color: var(--pos-text-primary);
}

.mobile-sale-dock__meta {
	display: flex;
	flex-wrap: wrap;
	gap: 6px 12px;
	font-size: 0.82rem;
	color: var(--pos-text-secondary);
}

.mobile-sale-dock__field :deep(.v-field) {
	background: rgba(var(--v-theme-surface), 0.92);
}

.mobile-pos-dock {
	display: grid;
	grid-template-columns: repeat(5, minmax(0, 1fr));
	gap: 8px;
}

.mobile-pos-dock__item {
	position: relative;
	border: 0;
	border-radius: 18px;
	background: transparent;
	min-width: 0;
	min-height: 58px;
	padding: 8px 4px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 4px;
	font: inherit;
	font-size: 0.72rem;
	font-weight: 700;
	color: var(--pos-text-secondary);
	cursor: pointer;
	transition:
		background-color 0.18s ease,
		color 0.18s ease,
		transform 0.18s ease;
}

.mobile-pos-dock__item span {
	display: block;
	width: 100%;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	text-align: center;
}

.mobile-pos-dock__item--active {
	background: rgba(var(--v-theme-primary), 0.12);
	color: rgb(var(--v-theme-primary));
}

.mobile-pos-dock__item--pay.mobile-pos-dock__item--active {
	background: rgba(var(--v-theme-success), 0.16);
	color: rgb(var(--v-theme-success));
}

:deep(.v-theme--dark) .mobile-sale-dock,
:deep(.v-theme--dark) .mobile-pos-dock,
:deep([data-theme="dark"]) .mobile-sale-dock,
:deep([data-theme="dark"]) .mobile-pos-dock,
:deep([data-theme-mode="dark"]) .mobile-sale-dock,
:deep([data-theme-mode="dark"]) .mobile-pos-dock {
	background: color-mix(in srgb, var(--pos-card-bg) 94%, transparent);
	box-shadow: 0 18px 40px rgba(0, 0, 0, 0.42);
	border-color: rgba(255, 255, 255, 0.08);
}

:deep(.v-theme--dark) .mobile-pos-dock__item--active,
:deep([data-theme="dark"]) .mobile-pos-dock__item--active,
:deep([data-theme-mode="dark"]) .mobile-pos-dock__item--active {
	background: rgba(var(--v-theme-primary), 0.2);
}

:deep(.v-theme--dark) .mobile-pos-dock__item--pay.mobile-pos-dock__item--active,
:deep([data-theme="dark"]) .mobile-pos-dock__item--pay.mobile-pos-dock__item--active,
:deep([data-theme-mode="dark"]) .mobile-pos-dock__item--pay.mobile-pos-dock__item--active {
	background: rgba(var(--v-theme-success), 0.22);
}

.mobile-pos-dock__item:active {
	transform: scale(0.98);
}

.mobile-pos-dock__pill {
	position: absolute;
	top: 4px;
	right: 10px;
	min-width: 18px;
	height: 18px;
	padding: 0 5px;
	border-radius: 999px;
	background: rgb(var(--v-theme-primary));
	color: #fff;
	font-size: 0.68rem;
	line-height: 18px;
	text-align: center;
}

@media (max-width: 1199px) {
	.dynamic-container {
		padding-bottom: calc(var(--bottom-safe-space, 0px) + var(--pos-page-gap));
	}
}

@media (min-width: 1200px) {
	.dynamic-container {
		padding-top: 0;
		padding-bottom: 0;
	}
}

@media (max-width: 768px) {
	.dynamic-container {
		--pos-page-gap: 8px;
		--pos-pane-padding: 8px;
	}
}

@media (max-width: 1360px) and (min-width: 1200px) {
	.dynamic-container {
		--pos-page-gap: 10px;
	}

	.pos-workspace {
		grid-template-columns: minmax(0, 1fr) clamp(380px, 42%, 560px);
	}

	.pos-workspace--rtl:not(.pos-workspace--compact) {
		grid-template-columns: clamp(380px, 42%, 560px) minmax(0, 1fr);
	}
}

@media (max-width: 560px) {
	.mobile-sale-dock {
		grid-template-columns: 1fr;
	}

	.mobile-sale-dock,
	.mobile-pos-dock {
		padding: 8px;
	}

	.mobile-pos-dock {
		gap: 6px;
	}

	.mobile-pos-dock__item {
		min-height: 52px;
		font-size: 0.65rem;
	}
}
</style>
