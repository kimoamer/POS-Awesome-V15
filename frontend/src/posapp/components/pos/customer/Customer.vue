<template>
	<!-- ? Disable dropdown if either readonly or loadingCustomers is true -->
	<div class="customer-input-wrapper">
		<div class="customer-field-shell">
			<v-autocomplete
				ref="customerDropdown"
				class="customer-autocomplete sleek-field pos-themed-input"
				density="compact"
				clearable
				variant="outlined"
				color="primary"
				:label="customerFieldLabel"
				:placeholder="customerFieldPlaceholder"
				:aria-label="__('Customer')"
				:loading="isCustomerSearchLocked"
				v-model="internalCustomer"
				:items="filteredCustomers"
				item-title="customer_name"
				item-value="name"
				:no-data-text="customerNoDataText"
				hide-details
				:customFilter="() => true"
				:disabled="effectiveReadonly || isCustomerSearchLocked"
				:menu-props="{ closeOnContentClick: false }"
				@update:menu="onCustomerMenuToggle"
				@update:modelValue="onCustomerChange"
				@update:search="onCustomerSearch"
				@keydown.enter="handleEnter"
				:virtual-scroll="true"
				:virtual-scroll-item-height="48"
			>
				<template #prepend-inner>
					<v-icon class="customer-field-icon" size="18">mdi-account-outline</v-icon>
				</template>

				<!-- Dropdown display -->
				<template #item="{ props, item }">
					<v-list-item v-bind="props">
						<v-list-item-subtitle v-if="item.raw.customer_name !== item.raw.name">
							<div>{{ __("ID") }}: {{ item.raw.name }}</div>
						</v-list-item-subtitle>
						<v-list-item-subtitle v-if="item.raw.tax_id">
							<div>{{ __("TAX ID") }}: {{ item.raw.tax_id }}</div>
						</v-list-item-subtitle>
						<v-list-item-subtitle v-if="item.raw.email_id">
							<div>{{ __("Email") }}: {{ item.raw.email_id }}</div>
						</v-list-item-subtitle>
						<v-list-item-subtitle v-if="item.raw.mobile_no">
							<div>{{ __("Mobile No") }}: {{ item.raw.mobile_no }}</div>
						</v-list-item-subtitle>
						<v-list-item-subtitle v-if="item.raw.primary_address">
							<div>{{ __("Primary Address") }}: {{ item.raw.primary_address }}</div>
						</v-list-item-subtitle>
					</v-list-item>
				</template>
			</v-autocomplete>
			<v-tooltip :text="__('Add new customer')" content-class="posa-theme-tooltip">
				<template #activator="{ props }">
					<v-btn
						v-bind="props"
						icon
						variant="text"
						color="primary"
						class="customer-action-btn"
						:aria-label="__('Add new customer')"
						:title="__('Add new customer')"
						@mousedown.prevent.stop
						@click.stop="new_customer"
					>
						<v-icon size="20">mdi-plus</v-icon>
					</v-btn>
				</template>
			</v-tooltip>
			<v-menu v-model="customerActionsOpen" location="bottom end" :offset="[0, 8]">
				<template #activator="{ props }">
					<v-btn
						v-bind="props"
						icon
						variant="text"
						color="primary"
						class="customer-action-btn"
						:aria-label="__('Customer actions')"
						:title="__('Customer actions')"
					>
						<v-icon size="20">mdi-dots-vertical</v-icon>
					</v-btn>
				</template>
				<v-card class="customer-actions-menu pos-themed-card" elevation="8">
					<v-list density="compact" nav class="customer-actions-list">
						<v-list-item class="customer-actions-item" @click="edit_customer">
							<template #prepend>
								<v-icon size="18">mdi-account-edit-outline</v-icon>
							</template>
							<v-list-item-title>{{ __("Edit customer") }}</v-list-item-title>
						</v-list-item>
						<v-list-item
							class="customer-actions-item"
							:disabled="!networkOnline"
							@click="reload_customers"
						>
							<template #prepend>
								<v-icon size="18">mdi-refresh</v-icon>
							</template>
							<v-list-item-title>{{ __("Reload customers") }}</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-card>
			</v-menu>
			<v-progress-linear
				v-if="showCustomerLoadProgress"
				:model-value="customerLoadPercent"
				height="4"
				color="primary"
				class="customer-load-bar"
				rounded
			/>
			<div v-if="showCustomerLoadProgress" class="customer-load-status" aria-live="polite">
				<span class="customer-load-status__count">
					{{ customerLoadedCountLabel }}
				</span>
				<span class="customer-load-status__percent"> {{ customerLoadPercent }}% </span>
			</div>
		</div>
		<!-- Update customer modal -->
		<div class="customer-dialog-host">
			<UpdateCustomer />
		</div>
	</div>
</template>

<style scoped>
.customer-input-wrapper {
	width: 100%;
	max-width: 100%;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	position: relative;
}

.customer-autocomplete {
	width: 100%;
	box-sizing: border-box;
	border-radius: var(--pos-radius-control, 8px);
	background: var(--pos-surface-raised, #ffffff);
}

.customer-field-shell {
	position: relative;
	width: 100%;
	display: grid;
	grid-template-columns: minmax(0, 1fr) 44px 44px;
	align-items: center;
	gap: var(--pos-control-gap, 6px);
	min-width: 0;
}

.customer-load-bar {
	grid-column: 1 / -1;
	position: relative;
	inset-inline: auto;
	inset-block-end: auto;
	opacity: 0.95;
	margin: -2px 4px 0;
}

.customer-load-status {
	grid-column: 1 / -1;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	width: 100%;
	margin-top: -2px;
	padding: 0 4px;
	font-size: 12px;
	font-weight: 700;
	line-height: 1.25;
	color: rgb(var(--v-theme-primary));
	box-sizing: border-box;
	white-space: nowrap;
}

.customer-load-status__count {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.customer-load-status__percent {
	flex: 0 0 auto;
	font-variant-numeric: tabular-nums;
}

/* Theme-aware internal field colors */
.customer-autocomplete :deep(.v-field__input),
.customer-autocomplete :deep(input),
.customer-autocomplete :deep(.v-label) {
	color: var(--pos-text-primary) !important;
}

.customer-autocomplete :deep(.v-field__overlay) {
	display: none !important;
}

.customer-autocomplete :deep(.v-field__outline) {
	--v-field-border-opacity: 0 !important;
	color: transparent !important;
}

.customer-autocomplete :deep(.v-field) {
	min-height: var(--pos-control-height, 44px) !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	box-shadow: none !important;
}

.customer-autocomplete :deep(.v-field--focused) {
	border-color: color-mix(in srgb, var(--pos-primary) 40%, var(--pos-border-light)) !important;
	box-shadow: none !important;
	outline: 2px solid color-mix(in srgb, var(--pos-primary) 12%, transparent);
	outline-offset: 0;
}

.customer-autocomplete :deep(.v-field__input),
.customer-autocomplete :deep(.v-field__prepend-inner),
.customer-autocomplete :deep(.v-field__append-inner),
.customer-autocomplete :deep(.v-field__clearable) {
	min-height: var(--pos-control-height, 44px) !important;
	padding-top: 0 !important;
	padding-bottom: 0 !important;
}

.customer-autocomplete :deep(input) {
	font-size: var(--pos-font-control, 13px);
	font-weight: 650;
	line-height: 1.2;
}

.customer-autocomplete :deep(.v-label) {
	font-size: var(--pos-font-meta, 11px);
	font-weight: 700;
	color: var(--pos-text-muted) !important;
	opacity: 0.9;
}

.customer-field-icon {
	color: var(--pos-text-muted);
}

.customer-action-btn {
	width: 44px !important;
	height: 44px !important;
	min-width: 44px !important;
	min-height: 44px !important;
	border: 1px solid var(--pos-border-light) !important;
	border-radius: var(--pos-radius-control, 8px) !important;
	background: var(--pos-surface-raised, #ffffff) !important;
	color: var(--pos-primary) !important;
	box-shadow: none !important;
}

.customer-action-btn:hover,
.customer-action-btn:focus-visible {
	border-color: color-mix(in srgb, var(--pos-primary) 36%, var(--pos-border-light)) !important;
	background: color-mix(in srgb, var(--pos-primary-container) 62%, var(--pos-surface-raised)) !important;
}

.customer-actions-menu {
	min-width: 210px;
	border: 1px solid var(--pos-border-light);
	border-radius: var(--pos-radius-md, 14px) !important;
	background: var(--pos-menu-bg) !important;
	box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12) !important;
	overflow: hidden;
}

.customer-actions-list {
	padding: 6px !important;
}

.customer-actions-item {
	min-height: 40px !important;
	border-radius: var(--pos-radius-sm, 10px) !important;
	color: var(--pos-text-primary) !important;
	font-size: 13px;
	font-weight: 650;
}

.disabled-icon {
	opacity: 0.3 !important;
	pointer-events: none;
	cursor: not-allowed;
}

.customer-dialog-host {
	display: contents;
}

@media (max-width: 768px) {
	.customer-input-wrapper {
		padding-inline-end: 0;
	}

	.customer-load-status {
		padding: 0 4px;
		font-size: 0.68rem;
	}
}
</style>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount, getCurrentInstance, nextTick } from "vue";
import { storeToRefs } from "pinia";
import _ from "lodash";
import UpdateCustomer from "../dialogs/customer/UpdateCustomer.vue";
import { useCustomersStore } from "../../../stores/customersStore.js";
import { useOnlineStatus } from "../../../composables/core/useOnlineStatus";
import { useToastStore } from "../../../stores/toastStore.js";
import { useUIStore } from "../../../stores/uiStore.js";
import { ensureCustomersReady } from "../../../modules/customers/customerLoadingCoordinator";

export default {
	props: {
		pos_profile: Object,
	},
	components: {
		UpdateCustomer,
	},
	setup(props, { expose }) {
		const { proxy } = getCurrentInstance();
		const eventBus = proxy?.eventBus;
		const customersStore = useCustomersStore();
		const toastStore = useToastStore();
		const uiStore = useUIStore();
		const {
			customers,
			filteredCustomers,
			loadingCustomers,
			isCustomerBackgroundLoading,
			loadProgress,
			customersLoaded,
			loadedCustomerCount,
			selectedCustomer,
			customerInfo,
		} = storeToRefs(customersStore);

		const internalCustomer = ref(null);
		const tempSelectedCustomer = ref(null);
		const isMenuOpen = ref(false);
		const customerActionsOpen = ref(false);
		const customerDropdown = ref(null);
		const readonlyState = ref(false);

		let scrollContainer = null;

		const { isOnline: networkOnline } = useOnlineStatus();

		const effectiveReadonly = computed(() => readonlyState.value && networkOnline.value);
		const showCustomerLoadProgress = computed(
			() => loadingCustomers.value || isCustomerBackgroundLoading.value,
		);
		const isCustomerSearchLocked = computed(() => loadingCustomers.value && customers.value.length === 0);
		const customerLoadPercent = computed(() =>
			Math.max(0, Math.min(100, Math.round(loadProgress.value || 0))),
		);
		const customerLoadedCountLabel = computed(
			() => `${Number(loadedCustomerCount.value || 0).toLocaleString()} ${__("customers")}`,
		);
		const customerFieldLabel = computed(() =>
			showCustomerLoadProgress.value ? frappe._("Loading customers") : "",
		);
		const customerFieldPlaceholder = computed(() =>
			showCustomerLoadProgress.value ? __("Loading customers...") : __("Search or select customer..."),
		);
		const customerNoDataText = computed(() =>
			showCustomerLoadProgress.value
				? `${__("Loading customers...")} ${customerLoadPercent.value}%`
				: __("Customers not found"),
		);
		const hasReadyCustomerCache = () =>
			Boolean(
				customersLoaded.value &&
					(loadProgress.value >= 100 ||
						loadedCustomerCount.value > 0 ||
						customers.value.length > 0),
			);

		const formatCustomerMetric = (value) => {
			const numericValue = Number(value || 0);
			return new Intl.NumberFormat(undefined, {
				minimumFractionDigits: 0,
				maximumFractionDigits: 2,
			}).format(numericValue);
		};

		const searchDebounce = _.debounce((term) => {
			customersStore.queueSearch(term || "");
		}, 300);

		const ensureCustomersForProfile = (profile) => {
			if (!profile) {
				return ensureCustomersReady({
					profile: null,
					online: networkOnline.value,
					manualOffline: false,
					setProfile: customersStore.setPosProfile,
					load: customersStore.get_customer_names,
					isReady: hasReadyCustomerCache,
				});
			}

			return ensureCustomersReady({
				profile,
				online: networkOnline.value,
				manualOffline: false,
				setProfile: customersStore.setPosProfile,
				load: customersStore.get_customer_names,
				isReady: hasReadyCustomerCache,
			});
		};

		watch(
			selectedCustomer,
			(value) => {
				if (!isMenuOpen.value) {
					internalCustomer.value = value || null;
				}
			},
			{ immediate: true },
		);

		watch(
			() => props.pos_profile,
			(profile) => {
				void ensureCustomersForProfile(profile);
			},
			{ immediate: true },
		);

		const detachScrollListener = () => {
			if (scrollContainer) {
				scrollContainer.removeEventListener("scroll", onCustomerScroll);
				scrollContainer = null;
			}
		};

		const onCustomerScroll = (event) => {
			const el = event.target;
			if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
				customersStore.loadMoreCustomers();
			}
		};

		const attachScrollListener = () => {
			const dropdown = customerDropdown.value?.$el?.querySelector(".v-overlay__content .v-select-list");
			if (dropdown) {
				scrollContainer = dropdown;
				scrollContainer.scrollTop = 0;
				scrollContainer.addEventListener("scroll", onCustomerScroll);
			}
		};

		const commitPendingCustomerSelection = () => {
			if (tempSelectedCustomer.value) {
				internalCustomer.value = tempSelectedCustomer.value;
				customersStore.setSelectedCustomer(tempSelectedCustomer.value);
			} else if (selectedCustomer.value) {
				internalCustomer.value = selectedCustomer.value;
			}
			tempSelectedCustomer.value = null;
		};

		const onCustomerMenuToggle = (isOpen) => {
			isMenuOpen.value = isOpen;
			if (isOpen) {
				internalCustomer.value = null;
				nextTick(() => {
					setTimeout(() => {
						attachScrollListener();
					}, 50);
				});
				return;
			}

			detachScrollListener();
			commitPendingCustomerSelection();
		};

		const closeCustomerMenu = () => {
			commitPendingCustomerSelection();
			const dropdown = customerDropdown.value;
			if (dropdown) {
				try {
					dropdown.menu = false;
				} catch {
					dropdown.$emit?.("update:menu", false);
				}
				const inputEl = dropdown.$el?.querySelector("input");
				if (inputEl) {
					inputEl.blur();
				}
			}
			isMenuOpen.value = false;
			detachScrollListener();
		};

		const onCustomerChange = (val) => {
			if (val && val === selectedCustomer.value) {
				internalCustomer.value = selectedCustomer.value;
				toastStore.show({
					title: __("Customer already selected"),
					color: "error",
				});
				return;
			}

			tempSelectedCustomer.value = val;

			if (isMenuOpen.value && val) {
				closeCustomerMenu();
			} else if (!isMenuOpen.value && val) {
				customersStore.setSelectedCustomer(val);
			}
		};

		const onCustomerSearch = (value) => {
			if (isCustomerSearchLocked.value) {
				return;
			}
			const term = value || "";
			searchDebounce(term);
		};

		const handleEnter = (event) => {
			const inputText = event.target.value?.toLowerCase() || "";
			const matched = customers.value.find((cust) => {
				return (
					cust.customer_name?.toLowerCase().includes(inputText) ||
					cust.name?.toLowerCase().includes(inputText)
				);
			});

			if (!matched) {
				return;
			}

			tempSelectedCustomer.value = matched.name;
			internalCustomer.value = matched.name;
			customersStore.setSelectedCustomer(matched.name);
			closeCustomerMenu();
			if (event?.target?.blur) {
				event.target.blur();
			}
		};

		const new_customer = () => {
			customerActionsOpen.value = false;
			customersStore.openUpdateCustomerDialog(null);
		};

		const edit_customer = () => {
			customerActionsOpen.value = false;
			customersStore.openUpdateCustomerDialog(customerInfo.value || {});
		};

		const reload_customers = async () => {
			customerActionsOpen.value = false;
			if (!networkOnline.value) return;
			await customersStore.reloadCustomers();
		};

		const selectFirstCustomer = () => {
			const list =
				filteredCustomers.value && filteredCustomers.value.length
					? filteredCustomers.value
					: customers.value;

			if (!list || !list.length) {
				return;
			}

			const first = list[0];
			tempSelectedCustomer.value = first.name;
			internalCustomer.value = first.name;
			customersStore.setSelectedCustomer(first.name);
			closeCustomerMenu();
		};

		const openNewCustomer = () => {
			new_customer();
		};

		const focusCustomerSearch = async () => {
			const dropdown = customerDropdown.value;
			if (!dropdown) {
				return;
			}

			try {
				dropdown.menu = true;
			} catch {
				dropdown.$emit?.("update:menu", true);
			}

			isMenuOpen.value = true;

			if (typeof dropdown.focus === "function") {
				dropdown.focus();
			}

			await nextTick();

			const inputEl = dropdown.$el?.querySelector("input");
			if (inputEl) {
				inputEl.focus();
				inputEl.select?.();
			}
		};

		expose({ focusCustomerSearch, selectFirstCustomer, openNewCustomer });

		const busHandlers = [];

		const _registerBus = (event, handler) => {
			if (eventBus && typeof eventBus.on === "function") {
				eventBus.on(event, handler);
				busHandlers.push({ event, handler });
			}
		};

		onMounted(async () => {
			await customersStore.searchCustomers("");

			watch(
				() => uiStore.posProfile,
				async (profile) => {
					await ensureCustomersForProfile(profile);
				},
				{ deep: true, immediate: true },
			);

			// registerBus("set_customer", (customer) => {
			// 	customersStore.setSelectedCustomer(customer);
			// 	internalCustomer.value = customer || null;
			// });

			// registerBus("add_customer_to_list", async (customer) => {
			// 	await customersStore.addOrUpdateCustomer(customer);
			// 	internalCustomer.value = customer?.name || null;
			// });

			// registerBus("set_customer_readonly", (value) => {
			// 	readonlyState.value = Boolean(value);
			// });

			// registerBus("set_customer_info_to_edit", (data) => {
			// 	customersStore.setCustomerInfo(data || {});
			// });
		});

		onBeforeUnmount(() => {
			busHandlers.forEach(({ event, handler }) => {
				eventBus?.off(event, handler);
			});
			searchDebounce.cancel();
			detachScrollListener();
		});

		return {
			customerDropdown,
			filteredCustomers,
			loadingCustomers,
			isCustomerBackgroundLoading,
			showCustomerLoadProgress,
			isCustomerSearchLocked,
			customerLoadPercent,
			customerLoadedCountLabel,
			customerFieldLabel,
			customerFieldPlaceholder,
			customerNoDataText,
			internalCustomer,
			customerActionsOpen,
			effectiveReadonly,
			onCustomerMenuToggle,
			onCustomerChange,
			onCustomerSearch,
			handleEnter,
			new_customer,
			edit_customer,
			selectFirstCustomer,
			openNewCustomer,
			focusCustomerSearch,
			reload_customers,
			networkOnline,
			customerInfo,
			formatCustomerMetric,
		};
	},
};
</script>
